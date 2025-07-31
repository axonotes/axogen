/**
 * Main target generator module for Axogen.
 * Provides the core functionality for generating configuration files in various formats
 * including JSON, YAML, TOML, XML, CSV, and template-based generation.
 * Handles security checks for secrets detection and Git ignore validation.
 */

import {writeFile, mkdir, copyFile} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {
    EnvGenerator,
    JsonGenerator,
    YamlGenerator,
    TomlGenerator,
    TemplateGenerator,
    Json5Generator,
    HjsonGenerator,
    IniGenerator,
    PropertiesGenerator,
    XmlGenerator,
    CsvGenerator,
    CsonGenerator,
} from "./generatorTypes";
import {hasSecrets, unwrapUnsafe} from "../utils/secrets.ts";
import {isGitIgnored} from "../git/ignore-checker.ts";
import {type ZodAnyTarget} from "../config/types";
import {createHeaderComments, createMetadata} from "./metadata.ts";
import {logger} from "../utils/console/logger.ts";

export {
    EnvGenerator,
    JsonGenerator,
    YamlGenerator,
    TomlGenerator,
    TemplateGenerator,
};

/**
 * Configuration options for target generation.
 * Controls the behavior of generation processes including dry-run mode
 * and base directory resolution.
 */
export interface GenerateOptions {
    /** Show what would be generated without writing files */
    dryRun?: boolean;
    /** Base directory for resolving relative paths */
    baseDir?: string;
}

/**
 * Main target generator class that orchestrates the generation of configuration files
 * in various formats. Handles secrets detection, Git ignore validation, metadata
 * injection, and format-specific header comments.
 *
 * Supports multiple output formats including JSON, YAML, TOML, XML, CSV, INI, Properties,
 * environment variables, and template-based generation.
 */
export class TargetGenerator {
    /** Generator for environment variable files */
    private envGenerator = new EnvGenerator();
    /** Generator for JSON files */
    private jsonGenerator = new JsonGenerator();
    /** Generator for JSON5 files */
    private json5Generator = new Json5Generator();
    /** Generator for HJSON files */
    private hjsonGenerator = new HjsonGenerator();
    /** Generator for YAML files */
    private yamlGenerator = new YamlGenerator();
    /** Generator for TOML files */
    private tomlGenerator = new TomlGenerator();
    /** Generator for INI files */
    private iniGenerator = new IniGenerator();
    /** Generator for Properties files */
    private propertiesGenerator = new PropertiesGenerator();
    /** Generator for XML files */
    private xmlGenerator = new XmlGenerator();
    /** Generator for CSV files */
    private csvGenerator = new CsvGenerator();
    /** Generator for CSON files */
    private csonGenerator = new CsonGenerator();
    /** Generator for template-based files */
    private templateGenerator = new TemplateGenerator();

    /**
     * Validates that a target is safe to generate by checking for secrets and Git ignore status.
     * Unwraps unsafe variables if the target passes security checks.
     *
     * @param target - The target configuration to validate
     * @param targetName - Name of the target for error reporting
     * @param fullPath - Full file system path where the target will be written
     * @returns The validated target with unwrapped variables
     * @throws Error if target contains secrets and is not Git ignored
     */
    private isSafe(
        target: ZodAnyTarget,
        targetName: string,
        fullPath: string
    ): ZodAnyTarget {
        const secretsAnalysis = hasSecrets(target.variables, targetName);

        // Early return if no secrets detected
        if (!secretsAnalysis.hasSecrets) {
            target.variables = unwrapUnsafe(target.variables);
            return target;
        }

        // Check git ignore status
        const isIgnored = this.checkGitIgnoreStatus(fullPath, targetName);

        if (!isIgnored) {
            logger.security(
                `Target "${targetName}" contains secrets and cannot be generated!`,
                secretsAnalysis
            );

            logger.info(
                "To resolve this, add the target to your .gitignore file or remove the secrets from the target configuration."
            );

            throw new Error(`Target "${targetName}" contains secrets`);
        }

        target.variables = unwrapUnsafe(target.variables);
        return target;
    }

    /**
     * Checks if a file path is covered by Git ignore rules.
     * Gracefully handles errors by assuming files are not ignored if the check fails.
     *
     * @param fullPath - Full file system path to check
     * @param targetName - Name of the target for error reporting
     * @returns True if the path is Git ignored, false otherwise
     */
    private checkGitIgnoreStatus(
        fullPath: string,
        targetName: string
    ): boolean {
        try {
            return isGitIgnored(fullPath);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            logger.warn(
                `Failed to check git ignore status for "${targetName}": ${message}`
            );
            return false; // Assume not ignored if check fails
        }
    }

    /**
     * Generates content for a target configuration without writing to file.
     * Performs security validation, processes metadata, and adds format-specific headers.
     *
     * @param targetName - Name of the target for identification and error reporting
     * @param target - Target configuration specifying format, variables, and options
     * @param options - Generation options including dry-run mode and base directory
     * @returns Promise resolving to an object containing the resolved file path and generated content
     * @throws Error if target validation fails or generation encounters an error
     */
    async generate(
        targetName: string,
        target: ZodAnyTarget,
        options: GenerateOptions = {}
    ): Promise<{path: string; content: string}> {
        const {baseDir = process.cwd()} = options;

        // Resolve full path
        const fullPath = resolve(baseDir, target.path);

        // Check if the target has secrets
        target = this.isSafe(target, targetName, fullPath);

        try {
            if (target.type === "csv") {
                target.generate_meta = false; // CSV does not support metadata
            }

            // Process variables and add metadata if needed
            const processedVariables = target.generate_meta
                ? {
                      _meta: createMetadata(target.path, target.type),
                      ...target.variables,
                  }
                : target.variables;

            // Generate content based on target type
            let content = await this.generateContent(
                processedVariables,
                target,
                baseDir
            );

            // Add header comments for formats that support them
            const headerComment = this.getCommentHeader(target);
            if (headerComment) {
                content = headerComment + "\n\n" + content;
            }

            return {path: fullPath, content};
        } catch (error) {
            throw new Error(
                `Failed to generate target "${targetName}": ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Generates content using the appropriate format-specific generator.
     * Routes to the correct generator based on target type and handles unsupported types.
     *
     * @param variables - Processed variables to serialize into the target format
     * @param target - Target configuration including type and format options
     * @param baseDir - Base directory for resolving relative paths in template generation
     * @returns Promise resolving to the generated content string
     * @throws Error if the target type is unsupported
     */
    private async generateContent(
        variables: Record<string, any>,
        target: ZodAnyTarget,
        baseDir: string
    ): Promise<string> {
        switch (target.type) {
            case "json":
                return this.jsonGenerator.generate(variables, target.options);
            case "json5":
                return this.json5Generator.generate(variables, target.options);
            case "jsonc":
                return this.jsonGenerator.generate(variables, target.options);
            case "hjson":
                return this.hjsonGenerator.generate(variables, target.options);
            case "yaml":
                return this.yamlGenerator.generate(variables, target.options);
            case "toml":
                return this.tomlGenerator.generate(variables);
            case "ini":
                return this.iniGenerator.generate(variables, target.options);
            case "properties":
                return this.propertiesGenerator.generate(
                    variables,
                    target.options
                );
            case "env":
                return this.envGenerator.generate(variables);
            case "xml":
                return this.xmlGenerator.generate(variables, target.options);
            case "csv":
                return this.csvGenerator.generate(variables, target.options);
            case "cson":
                return this.csonGenerator.generate(variables);
            case "template":
                return await this.templateGenerator.generate(target, baseDir);
            default:
                throw new Error(
                    `Unsupported target type: ${(target as any).type}`
                );
        }
    }

    /**
     * Generates format-appropriate header comments for supported file types.
     * Different formats use different comment syntaxes and some formats don't support comments.
     *
     * @param target - Target configuration to determine format and generate appropriate headers
     * @returns Header comment string for the target format, or empty string if not supported
     */
    private getCommentHeader(target: ZodAnyTarget): string {
        switch (target.type) {
            case "json":
                return "";
            case "json5":
                return createHeaderComments(target.path, "json5", "//").join(
                    "\n"
                );
            case "jsonc":
                return createHeaderComments(target.path, "jsonc", "//").join(
                    "\n"
                );
            case "hjson":
                return createHeaderComments(target.path, "hjson").join("\n");
            case "yaml":
                return createHeaderComments(target.path, "yaml").join("\n");
            case "toml":
                return createHeaderComments(target.path, "toml").join("\n");
            case "ini":
                return createHeaderComments(target.path, "ini", ";").join("\n");
            case "properties":
                return createHeaderComments(
                    target.path,
                    "properties",
                    "#"
                ).join("\n");
            case "env":
                return createHeaderComments(target.path, "env").join("\n");
            case "xml":
                return createHeaderComments(
                    target.path,
                    "xml",
                    "<!--",
                    "-->"
                ).join("\n");
            case "csv":
                return "";
            case "cson":
                return createHeaderComments(target.path, "cson", "#").join(
                    "\n"
                );
            case "template":
                return "";
            default:
                return "";
        }
    }

    /**
     * Generates content for a target and writes it to the file system.
     * Creates necessary parent directories and handles dry-run mode.
     *
     * @param targetName - Name of the target for identification and error reporting
     * @param target - Target configuration specifying format, variables, and output path
     * @param options - Generation options including dry-run mode and base directory
     * @returns Promise resolving to the absolute path where the file was written
     */
    async generateAndWrite(
        targetName: string,
        target: ZodAnyTarget,
        options: GenerateOptions = {}
    ): Promise<string> {
        const {dryRun = false} = options;

        const {path, content} = await this.generate(
            targetName,
            target,
            options
        );

        if (!dryRun) {
            if (target.backup) {
                if (!target.backupPath) {
                    if (!isGitIgnored(".axogen/backup")) {
                        logger.warn(
                            "The .axogen/backup directory is not ignored by git. Backups may be committed."
                        );
                    }
                }

                const backupPath =
                    target.backupPath || `.axogen/backup/${target.path}`;
                const fullSourcePath = resolve(
                    options.baseDir || process.cwd(),
                    target.path
                );
                const fullBackupPath = resolve(
                    options.baseDir || process.cwd(),
                    backupPath
                );
                try {
                    await mkdir(dirname(fullBackupPath), {recursive: true});
                    await copyFile(fullSourcePath, fullBackupPath);
                    logger.info(`Backup created at: ${fullBackupPath}`);
                } catch (error) {
                    logger.error(
                        `Failed to create backup for target "${targetName}": ${error instanceof Error ? error.message : String(error)}`
                    );
                }
            }

            await mkdir(dirname(path), {recursive: true});
            await writeFile(path, content, "utf-8");
        }

        return path;
    }

    /**
     * Generates multiple targets in a single operation with individual error handling.
     * Evaluates target conditions and skips targets that don't meet their criteria.
     * Continues processing other targets even if individual targets fail.
     *
     * @param targets - Record of target names to target configurations
     * @param options - Generation options applied to all targets
     * @returns Promise resolving to an array of results indicating success/failure for each target
     */
    async generateMultiple(
        targets: Record<string, ZodAnyTarget>,
        options: GenerateOptions = {}
    ): Promise<
        Array<{name: string; path: string; success: boolean; error?: string}>
    > {
        const results: Array<{
            name: string;
            path: string;
            success: boolean;
            error?: string;
        }> = [];

        for (const [name, target] of Object.entries(targets)) {
            // Check if the target should be generated
            if (!target.condition && target.condition !== undefined) {
                logger.info(
                    `Skipping target "${name}" as it does not meet the condition.`
                );
                continue;
            }

            try {
                const path = await this.generateAndWrite(name, target, options);
                results.push({name, path, success: true});
            } catch (error) {
                if (target.backup) {
                    logger.info(
                        `No backup created for target "${name}" as it was not written due to an error.`
                    );
                }
                const errorMessage =
                    error instanceof Error ? error.message : String(error);
                results.push({
                    name,
                    path: target.path,
                    success: false,
                    error: errorMessage,
                });
            }
        }

        return results;
    }
}

/**
 * Default instance of TargetGenerator for convenient access.
 * Pre-instantiated and ready to use for standard target generation operations.
 */
export const targetGenerator = new TargetGenerator();
