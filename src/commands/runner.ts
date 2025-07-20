import {z} from "zod";
import {spawn} from "node:child_process";
import type {
    AnyCommand,
    StringCommand,
    SchemaCommand,
    CommandGroup,
    FunctionCommand,
    CommandGlobalContext,
    SimpleCommandContext,
    CommandContext,
    AxogenConfig,
} from "../types";

/**
 * Options for command execution
 */
export interface RunCommandOptions {
    config: AxogenConfig;
    global: CommandGlobalContext;
    args?: string[];
    options?: Record<string, any>;
}

/**
 * Result of command execution
 */
export interface CommandResult {
    success: boolean;
    error?: string;
    exitCode?: number;
}

/**
 * Command runner class that handles execution of different command types
 */
export class CommandRunner {
    /**
     * Execute a command by name
     */
    async runCommand(
        commandName: string,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        if (!options.config.commands) {
            return {
                success: false,
                error: "No commands defined in configuration",
            };
        }

        const command = options.config.commands[commandName];
        if (!command) {
            return {
                success: false,
                error: `Command "${commandName}" not found`,
            };
        }

        return this.executeCommand(command, options);
    }

    /**
     * Execute a command directly
     */
    async executeCommand(
        command: AnyCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            // Handle different command types
            if (typeof command === "string") {
                return this.executeStringCommand(command, options);
            }

            if (typeof command === "function") {
                return this.executeFunctionCommand(command, options);
            }

            if (this.isStringCommand(command)) {
                return this.executeStringCommand(command.command, options);
            }

            if (this.isFunctionCommand(command)) {
                return this.executeFunctionCommand(command.exec, options);
            }

            if (this.isSchemaCommand(command)) {
                return this.executeSchemaCommand(command, options);
            }

            if (this.isCommandGroup(command)) {
                return this.executeCommandGroup(command, options);
            }

            return {
                success: false,
                error: "Unknown command type",
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Execute a string command
     */
    private async executeStringCommand(
        command: string,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        return new Promise((resolve) => {
            const child = spawn(command, {
                shell: true,
                stdio: "inherit",
                cwd: options.global.cwd,
                env: {...process.env, ...options.global.env},
            });

            child.on("close", (code) => {
                resolve({
                    success: code === 0,
                    exitCode: code || 0,
                    error:
                        code !== 0
                            ? `Command exited with code ${code}`
                            : undefined,
                });
            });

            child.on("error", (error) => {
                resolve({
                    success: false,
                    error: error.message,
                });
            });
        });
    }

    /**
     * Execute a function command
     */
    private async executeFunctionCommand(
        fn: Function,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            const context: SimpleCommandContext = {
                global: options.global,
                config: options.config,
                // Legacy aliases
                cwd: options.global.cwd,
                env: options.global.env,
            };

            await fn(context);
            return {success: true};
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Execute a schema-based command with validation
     */
    private async executeSchemaCommand(
        command: SchemaCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            // Parse and validate options
            let validatedOptions = {};
            if (command.options) {
                const optionsSchema = z.object(command.options);
                validatedOptions = optionsSchema.parse(options.options || {});
            }

            // Parse and validate arguments
            let validatedArgs = {};
            if (command.args) {
                const argsSchema = z.object(command.args);
                // Convert array args to object based on schema keys
                const argsObject = this.arrayToArgsObject(
                    options.args || [],
                    Object.keys(command.args)
                );
                validatedArgs = argsSchema.parse(argsObject);
            }

            // Create typed context
            const context: CommandContext = {
                options: validatedOptions,
                args: validatedArgs,
                global: options.global,
                config: options.config,
            };

            await command.exec(context);
            return {success: true};
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessage = error.issues
                    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
                    .join(", ");
                return {
                    success: false,
                    error: `Validation error: ${errorMessage}`,
                };
            }

            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Execute a command group (show help or delegate to subcommand)
     */
    private async executeCommandGroup(
        group: CommandGroup,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        const [subcommandName, ...remainingArgs] = options.args || [];

        if (!subcommandName) {
            // Show help for the group
            console.log(group.help || "Available commands:");
            for (const [name, command] of Object.entries(group.commands)) {
                const help = this.getCommandHelp(command);
                console.log(`  ${name}${help ? ` - ${help}` : ""}`);
            }
            return {success: true};
        }

        const subcommand = group.commands[subcommandName];
        if (!subcommand) {
            return {
                success: false,
                error: `Subcommand "${subcommandName}" not found`,
            };
        }

        return this.executeCommand(subcommand, {
            ...options,
            args: remainingArgs,
        });
    }

    /**
     * Get help text for a command
     */
    private getCommandHelp(command: AnyCommand): string | undefined {
        if (typeof command === "string" || typeof command === "function") {
            return undefined;
        }

        if ("help" in command) {
            return command.help;
        }

        return undefined;
    }

    /**
     * Convert array arguments to object based on schema keys
     */
    private arrayToArgsObject(
        args: string[],
        keys: string[]
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = args[i];

            if (value !== undefined) {
                result[key] = value;
            }
        }

        return result;
    }

    /**
     * Type guards
     */
    private isStringCommand(command: any): command is StringCommand {
        return command && command._type === "string";
    }

    private isFunctionCommand(command: any): command is FunctionCommand {
        return command && command._type === "function";
    }

    private isSchemaCommand(command: any): command is SchemaCommand {
        return command && command._type === "schema";
    }

    private isCommandGroup(command: any): command is CommandGroup {
        return command && command._type === "group";
    }
}

// Singleton instance
export const commandRunner = new CommandRunner();
