import {pathToFileURL} from "node:url";
import {resolve, join} from "node:path";
import {access, constants} from "node:fs/promises";
import type {AxogenConfig, ConfigInput} from "../types";
import "tsx";

export class ConfigLoader {
    /** Load configuration from a file */
    async load(configPath?: string): Promise<AxogenConfig> {
        const resolvedPath = await this.resolveConfigPath(configPath);

        try {
            if (resolvedPath.endsWith(".ts")) {
                await this.setupTypeScriptLoader();
            }

            // Convert to file URL for dynamic import
            const fileUrl = pathToFileURL(resolvedPath).href;

            // Dynamic import the config file
            const module = await import(fileUrl);
            const configInput: ConfigInput = module.default;

            // Resolve config (handle both direct config and function)
            const config = await this.resolveConfig(configInput);

            // Validate the config
            this.validateConfig(config);

            return config;
        } catch (error) {
            throw new Error(
                `Failed to load config from ${resolvedPath}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /** Setup TypeScript loader if available */
    private async setupTypeScriptLoader(): Promise<void> {
        try {
            // @ts-ignore
            const tsx = await import("tsx/esm").catch(() => null);
            if (tsx) {
                tsx.register();
                console.log("✅ TypeScript loader registered successfully");
                return;
            }

            // @ts-ignore
            const tsNode = await import("ts-node/esm").catch(() => null);
            if (tsNode) {
                console.log("✅ TypeScript loader registered successfully");
                return; // ts-node/esm auto-registers
            }

            console.log(
                "⚠️ TypeScript loader not found, falling back to plain JavaScript"
            );
        } catch (error) {
            console.log(
                "⚠️ TypeScript loader not available, falling back to plain JavaScript"
            );
            // Ignore setup errors, let the actual import fail with a better message
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
        const defaultNames = ["axogen.config.ts"];

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

    /** Validate configuration structure */
    private validateConfig(config: AxogenConfig): void {
        if (!config || typeof config !== "object") {
            throw new Error("Config must be an object");
        }

        // Validate targets
        if (config.targets) {
            for (const [name, target] of Object.entries(config.targets)) {
                if (!target.type) {
                    throw new Error(`Target "${name}" must have a type`);
                }
                if (!target.path) {
                    throw new Error(`Target "${name}" must have a path`);
                }
                if (!target.variables) {
                    throw new Error(`Target "${name}" must have variables`);
                }
            }
        }

        // Validate commands
        if (config.commands) {
            for (const [name, command] of Object.entries(config.commands)) {
                this.validateCommand(command, name);
            }
        }
    }

    /** Validate a single command */
    private validateCommand(command: any, name: string): void {
        if (
            typeof command !== "string" &&
            typeof command !== "function" &&
            (typeof command !== "object" || command === null)
        ) {
            throw new Error(
                `Command "${name}" must be a string, function, or object`
            );
        }

        if (typeof command === "object") {
            // Validate command definition structure
            const hasExec = command.exec !== undefined;
            const hasSubcommands = command.subcommands !== undefined;

            // Enforce: either exec OR subcommands, not both
            if (hasExec && hasSubcommands) {
                throw new Error(
                    `Command "${name}" cannot have both 'exec' and 'subcommands'. Choose one.`
                );
            }

            if (!hasExec && !hasSubcommands) {
                throw new Error(
                    `Command "${name}" must have either 'exec' or 'subcommands'`
                );
            }

            // If it has subcommands, it shouldn't have arguments/options
            if (hasSubcommands) {
                if (command.arguments || command.options) {
                    throw new Error(
                        `Parent command "${name}" with subcommands cannot have its own arguments or options`
                    );
                }
            }

            // Validate arguments
            if (command.arguments) {
                for (const arg of command.arguments) {
                    if (!arg.syntax) {
                        throw new Error(
                            `Argument in command "${name}" must have syntax`
                        );
                    }
                    // Validate argument syntax follows commander.js patterns
                    if (!arg.syntax.match(/^(<[^>]+>|\[[^\]]+\])$/)) {
                        throw new Error(
                            `Invalid argument syntax "${arg.syntax}" in command "${name}". Use <required> or [optional]`
                        );
                    }
                    // Validate type if provided
                    if (
                        arg.type &&
                        !["string", "number", "boolean", "array"].includes(
                            arg.type
                        )
                    ) {
                        throw new Error(
                            `Invalid argument type "${arg.type}" in command "${name}". Use: string, number, boolean, array`
                        );
                    }
                }
            }

            // Validate options
            if (command.options) {
                for (const option of command.options) {
                    if (!option.flags) {
                        throw new Error(
                            `Option in command "${name}" must have flags`
                        );
                    }
                    // Basic validation of flag syntax
                    if (!option.flags.match(/^-/)) {
                        throw new Error(
                            `Invalid option flags "${option.flags}" in command "${name}". Must start with -`
                        );
                    }
                    // Validate type if provided
                    if (
                        option.type &&
                        !["string", "number", "boolean", "array"].includes(
                            option.type
                        )
                    ) {
                        throw new Error(
                            `Invalid option type "${option.type}" in command "${name}". Use: string, number, boolean, array`
                        );
                    }
                }
            }

            // Recursively validate subcommands
            if (command.subcommands) {
                for (const [subName, subCommand] of Object.entries(
                    command.subcommands
                )) {
                    this.validateCommand(subCommand, `${name}.${subName}`);
                }
            }
        }
    }
}

// Singleton instance
export const configLoader = new ConfigLoader();

/** Load configuration - convenience function */
export async function loadConfig(configPath?: string): Promise<AxogenConfig> {
    return configLoader.load(configPath);
}
