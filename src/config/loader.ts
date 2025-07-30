/**
 * Configuration loading utilities for Axogen.
 * This module provides functionality to load, validate, and process configuration files
 * from TypeScript or JavaScript sources using Jiti for TypeScript compilation.
 */

import {resolve, join} from "node:path";
import {access, constants} from "node:fs/promises";
import {z} from "zod";
import {createJiti} from "jiti";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import {
    type AxogenConfig,
    axogenConfigSchema,
    type ConfigInput,
    type ZodAxogenConfig,
} from "./types";
import {logger} from "../utils/logger.ts";

/**
 * Configuration loader class that handles loading and validation of Axogen configuration files.
 * Supports both TypeScript and JavaScript configuration files with automatic compilation.
 */
export class ConfigLoader {
    /**
     * Load configuration from a file with validation and type checking.
     * Automatically detects file type and uses appropriate loader (Jiti for TypeScript).
     * @param configPath - Optional path to configuration file. If not provided, searches for default config files
     * @returns Promise that resolves to validated Axogen configuration
     * @throws Error if configuration file cannot be found, loaded, or fails validation
     */
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
                    `Config file at ${logger.text.accent(resolvedPath)} must export a default object`
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

                logger.validation(
                    `Configuration validation failed in ${logger.text.file(resolvedPath)}`,
                    validationErrors
                );

                console.log();
                logger.info(
                    `${logger.text.dimmed("💡 Check your config file structure.")}`
                );

                throw new Error("Configuration validation failed");
            }

            throw new Error(
                `Failed to load config from ${logger.text.file(resolvedPath)}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /**
     * Create Jiti loader for TypeScript files with appropriate configuration.
     * Configures Jiti with optimal settings for TypeScript compilation and caching.
     * @returns Promise that resolves to configured Jiti instance
     * @throws Error if Jiti is not available
     */
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
                `jiti is required to load TypeScript config files. Install it with: ${logger.text.command("bun add jiti")}`
            );
        }
    }

    /**
     * Find and resolve the configuration file path.
     * If no path is provided, searches for default configuration files in the current working directory.
     * @param configPath - Optional explicit path to configuration file
     * @returns Promise that resolves to the absolute path of the configuration file
     * @throws Error if no configuration file can be found
     */
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
            .map((name) => logger.text.file(name))
            .join(", ");
        throw new Error(`No config file found. Looking for: ${formattedNames}`);
    }
}

/** Singleton instance of ConfigLoader for convenient access */
export const configLoader = new ConfigLoader();

/**
 * Load configuration - convenience function that uses the singleton ConfigLoader instance.
 * This is the primary function users should call to load their Axogen configuration.
 * @param configPath - Optional path to configuration file
 * @returns Promise that resolves to validated Axogen configuration
 */
export async function loadConfig(
    configPath?: string
): Promise<ZodAxogenConfig> {
    return configLoader.load(configPath);
}
