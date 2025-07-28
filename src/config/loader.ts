import {resolve, join} from "node:path";
import {access, constants} from "node:fs/promises";
import {z} from "zod";
import {createJiti} from "jiti";
import {pretty} from "../utils/pretty";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import {
    type AxogenConfig,
    axogenConfigSchema,
    type ConfigInput,
    type ZodAxogenConfig,
} from "./types";

export class ConfigLoader {
    /** Load configuration from a file */
    async load(configPath?: string): Promise<ZodAxogenConfig> {
        const resolvedPath = await this.resolveConfigPath(configPath);

        try {
            let configInput: ConfigInput;

            if (resolvedPath.endsWith(".ts")) {
                // Use jiti for TypeScript files
                const jiti = await this.createJitiLoader();
                configInput = await jiti.import(resolvedPath, {default: true});
            } else {
                // Use dynamic import for JS files
                const module = await import(resolvedPath);
                configInput = module.default;
            }

            if (!configInput || typeof configInput !== "object") {
                throw new Error(
                    `Config file at ${pretty.text.accent(resolvedPath)} must export a default object`
                );
            }

            if (
                "_type" in configInput &&
                configInput._type === "AxogenConfig"
            ) {
                // If the config is already in AxogenConfig format, return it directly
                return configInput as ZodAxogenConfig;
            }

            const axogenKeys = ["watch", "targets", "commands"];
            const inputKeys = Object.keys(configInput);

            if (!axogenKeys.some((key) => inputKeys.includes(key))) {
                // If the input is just variables, convert it to AxogenConfig format
                configInput = {
                    targets: {
                        env: {
                            path: ".env",
                            type: "env",
                            variables: configInput as Record<string, unknown>,
                        },
                    },
                } as AxogenConfig;
            }

            // Validate the config using Zod - let Zod handle all validation and errors
            return {
                ...axogenConfigSchema.parse(configInput),
                _type: "AxogenConfig",
            } as ZodAxogenConfig;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = zodIssuesToErrors(error.issues);

                pretty.validation.errorGroup(
                    `Configuration validation failed in ${pretty.text.accent(resolvedPath)}`,
                    validationErrors
                );

                console.log();
                pretty.info(
                    `${pretty.text.dimmed("💡 Check your config file structure.")}`
                );

                throw new Error("Configuration validation failed");
            }

            throw new Error(
                `Failed to load config from ${pretty.text.accent(resolvedPath)}: ${
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
                tryNative: false,
                sourceMaps: true,
                fsCache: true,
                moduleCache: true,
                transformModules: ["@axonotes/axogen"],
                extensions: [".ts", ".js"],
            });
        } catch (error) {
            throw new Error(
                `jiti is required to load TypeScript config files. Install it with: ${pretty.text.accent("bun add jiti")}`
            );
        }
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

        const formattedNames = defaultNames
            .map((name) => pretty.text.accent(name))
            .join(", ");
        throw new Error(`No config file found. Looking for: ${formattedNames}`);
    }
}

// Singleton instance
export const configLoader = new ConfigLoader();

/** Load configuration - convenience function */
export async function loadConfig(
    configPath?: string
): Promise<ZodAxogenConfig> {
    return configLoader.load(configPath);
}
