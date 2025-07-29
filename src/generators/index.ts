import {writeFile, mkdir} from "node:fs/promises";
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
import {pretty} from "../utils/pretty.ts";
import {isGitIgnored} from "../git/ignore-checker.ts";
import {type ZodAnyTarget} from "../config/types";
import {createHeaderComments, createMetadata} from "./metadata.ts";

export {
    EnvGenerator,
    JsonGenerator,
    YamlGenerator,
    TomlGenerator,
    TemplateGenerator,
};

export interface GenerateOptions {
    /** Show what would be generated without writing files */
    dryRun?: boolean;
    /** Base directory for resolving relative paths */
    baseDir?: string;
}

export class TargetGenerator {
    private envGenerator = new EnvGenerator();
    private jsonGenerator = new JsonGenerator();
    private json5Generator = new Json5Generator();
    private hjsonGenerator = new HjsonGenerator();
    private yamlGenerator = new YamlGenerator();
    private tomlGenerator = new TomlGenerator();
    private iniGenerator = new IniGenerator();
    private propertiesGenerator = new PropertiesGenerator();
    private xmlGenerator = new XmlGenerator();
    private csvGenerator = new CsvGenerator();
    private csonGenerator = new CsonGenerator();
    private templateGenerator = new TemplateGenerator();

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
            pretty.secrets.detected(
                `Target "${targetName}" contains secrets and cannot be generated!`,
                secretsAnalysis
            );

            console.log();
            pretty.info(
                "To resolve this, add the target to your .gitignore file or remove the secrets from the target configuration."
            );

            throw new Error(`Target "${targetName}" contains secrets`);
        }

        target.variables = unwrapUnsafe(target.variables);
        return target;
    }

    private checkGitIgnoreStatus(
        fullPath: string,
        targetName: string
    ): boolean {
        try {
            return isGitIgnored(fullPath);
        } catch (error) {
            const message =
                error instanceof Error ? error.message : String(error);
            pretty.warn(
                `Failed to check git ignore status for "${targetName}": ${message}`
            );
            return false; // Assume not ignored if check fails
        }
    }

    /** Generate content for a target */
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

    /** Generate and write target to file */
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
            await mkdir(dirname(path), {recursive: true});
            await writeFile(path, content, "utf-8");
        }

        return path;
    }

    /** Generate multiple targets */
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
            try {
                const path = await this.generateAndWrite(name, target, options);
                results.push({name, path, success: true});
            } catch (error) {
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

// Export default instance
export const targetGenerator = new TargetGenerator();
