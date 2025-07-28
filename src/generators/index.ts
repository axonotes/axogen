import {writeFile, mkdir} from "node:fs/promises";
import {dirname, resolve} from "node:path";
import {EnvGenerator} from "./env";
import {JsonGenerator} from "./json";
import {YamlGenerator} from "./yaml";
import {TomlGenerator} from "./toml";
import {TemplateGenerator} from "./template";
import {hasSecrets, unwrapUnsafe} from "../utils/secrets.ts";
import {pretty} from "../utils/pretty.ts";
import {isGitIgnored} from "../git/ignore-checker.ts";
import type {ZodTarget} from "../config/types";

export interface GenerateOptions {
    /** Show what would be generated without writing files */
    dryRun?: boolean;
    /** Base directory for resolving relative paths */
    baseDir?: string;
}

export class TargetGenerator {
    private envGenerator = new EnvGenerator();
    private jsonGenerator = new JsonGenerator();
    private yamlGenerator = new YamlGenerator();
    private tomlGenerator = new TomlGenerator();
    private templateGenerator = new TemplateGenerator();

    private isSafe(
        target: ZodTarget,
        targetName: string,
        fullPath: string
    ): ZodTarget {
        const secretsAnalysisResult = hasSecrets(target.variables, targetName);
        if (secretsAnalysisResult.hasSecrets) {
            let isIgnored = false;

            try {
                // Check if the target is ignored by git
                isIgnored = isGitIgnored(fullPath);
            } catch (e) {
                const message = e instanceof Error ? e.message : String(e);
                pretty.warn(
                    `Failed to check if target is ignored by git: ${message}`
                );
            }

            if (!isIgnored) {
                pretty.secrets.detected(
                    `Target "${targetName}" contains secrets and cannot be generated!`,
                    secretsAnalysisResult
                );

                console.log();
                pretty.info(
                    "To resolve this, add the target to your .gitignore file or remove the secrets from the target configuration."
                );

                throw new Error(`Target "${targetName}" contains secrets`);
            }
        }

        // Unwrap unsafe objects
        target.variables = unwrapUnsafe(target.variables);
        return target;
    }

    /** Generate content for a target */
    async generate(
        targetName: string,
        target: ZodTarget,
        options: GenerateOptions = {}
    ): Promise<{path: string; content: string}> {
        const {baseDir = process.cwd()} = options;

        // Resolve full path
        const fullPath = resolve(baseDir, target.path);

        // Check if the target has secrets
        target = this.isSafe(target, targetName, fullPath);

        try {
            // Generate content based on target type
            let content: string;

            switch (target.type) {
                case "env":
                    content = this.envGenerator.generate(target);
                    break;
                case "json":
                    content = this.jsonGenerator.generate(target);
                    break;
                case "yaml":
                    content = this.yamlGenerator.generate(target);
                    break;
                case "toml":
                    content = this.tomlGenerator.generate(target);
                    break;
                case "template":
                    content = await this.templateGenerator.generate(target);
                    break;
                default:
                    throw new Error(
                        `Unsupported target type: ${(target as any).type}`
                    );
            }

            return {path: fullPath, content};
        } catch (error) {
            throw new Error(
                `Failed to generate target "${targetName}": ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /** Generate and write target to file */
    async generateAndWrite(
        targetName: string,
        target: ZodTarget,
        options: GenerateOptions = {}
    ): Promise<string> {
        const {dryRun = false} = options;

        const {path, content} = await this.generate(
            targetName,
            target,
            options
        );

        if (!dryRun) {
            // Ensure directory exists
            await mkdir(dirname(path), {recursive: true});

            // Write file
            await writeFile(path, content, "utf-8");
        }

        return path;
    }

    /** Generate multiple targets */
    async generateMultiple(
        targets: Record<string, ZodTarget>,
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

// Export generators for direct use
export {EnvGenerator} from "./env.js";
export {JsonGenerator} from "./json.js";
export {YamlGenerator} from "./yaml.js";
export {TomlGenerator} from "./toml.js";
export {TemplateGenerator} from "./template.js";

// Export default instance
export const targetGenerator = new TargetGenerator();
