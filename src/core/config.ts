import {resolve, join} from "node:path";
import {access, constants} from "node:fs/promises";
import {z} from "zod";
import type {AxogenConfig, ConfigInput} from "../types";
import {axogenConfigSchema} from "../types";
import {createJiti} from "jiti";

export class ConfigLoader {
    /** Load configuration from a file */
    async load(configPath?: string): Promise<AxogenConfig> {
        const resolvedPath = await this.resolveConfigPath(configPath);

        try {
            let configInput: ConfigInput;

            if (resolvedPath.endsWith(".ts")) {
                // Use jiti for TypeScript files
                const jiti = await this.createJitiLoader();
                configInput = jiti(resolvedPath).default;
            } else {
                // Use dynamic import for JS files
                const module = await import(resolvedPath);
                configInput = module.default;
            }

            // Resolve config (handle both direct config and function)
            const config = await this.resolveConfig(configInput);

            // Validate the config using Zod - let Zod handle all validation and errors
            return axogenConfigSchema.parse(config);
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Use Zod's built-in error formatting or a simple custom format
                const errorMessage = error.issues
                    .map(
                        (issue) =>
                            `  • ${issue.path.join(".")}: ${issue.message}`
                    )
                    .join("\n");

                throw new Error(
                    `Configuration validation failed in ${resolvedPath}:\n${errorMessage}\n\n  💡 Check your config file structure.`
                );
            }

            throw new Error(
                `Failed to load config from ${resolvedPath}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /** Create jiti loader for TypeScript files */
    private async createJitiLoader() {
        try {
            return createJiti(import.meta.url, {
                interopDefault: true,
            });
        } catch (error) {
            throw new Error(
                "jiti is required to load TypeScript config files. Install it with: bun add jiti"
            );
        }
    }

    /** Resolve config input (handle functions) */
    private async resolveConfig(input: ConfigInput): Promise<AxogenConfig> {
        if (typeof input === "function") {
            return await input();
        }
        return input;
    }

    /** Find the config file path */
    private async resolveConfigPath(configPath?: string): Promise<string> {
        if (configPath) {
            return resolve(configPath);
        }

        // Default config file names to look for
        const defaultNames = [
            "axogen.config.ts",
            "axogen.config.js",
            "axogen.ts",
            "axogen.js",
            "config.ts",
            "config.js",
        ];

        const cwd = process.cwd();

        for (const name of defaultNames) {
            const fullPath = join(cwd, name);
            try {
                await access(fullPath, constants.F_OK);
                return fullPath;
            } catch {
                // File doesn't exist, continue
            }
        }

        throw new Error(
            `No config file found. Looking for: ${defaultNames.join(", ")}`
        );
    }
}

// Singleton instance
export const configLoader = new ConfigLoader();

/** Load configuration - convenience function */
export async function loadConfig(configPath?: string): Promise<AxogenConfig> {
    return configLoader.load(configPath);
}
