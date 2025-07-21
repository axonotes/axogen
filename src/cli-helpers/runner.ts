import {spawn} from "node:child_process";
import type {
    AnyCommand,
    StringCommand,
    FunctionCommand,
    CommandGroup,
    CommandGlobalContext,
    SimpleCommandContext,
    AxogenConfig,
} from "../types";

export interface RunCommandOptions {
    config: AxogenConfig;
    global: CommandGlobalContext;
    args?: string[];
    options?: Record<string, any>;
}

export interface CommandResult {
    success: boolean;
    error?: string;
    exitCode?: number;
}

export class CommandRunner {
    async executeCommand(
        command: AnyCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            if (typeof command === "string") {
                return await this.executeStringCommand(command, options);
            }

            if (typeof command === "function") {
                return await this.executeFunctionCommand(command, options);
            }

            if (this.isStringCommand(command)) {
                return await this.executeStringCommand(
                    command.command,
                    options
                );
            }

            if (this.isFunctionCommand(command)) {
                return await this.executeFunctionCommand(command.exec, options);
            }

            if (this.isCommandGroup(command)) {
                return await this.executeCommandGroup(command, options);
            }

            return {success: false, error: "Unknown command type"};
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async executeStringCommand(
        command: string,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        return new Promise((resolve) => {
            const child = spawn(command, {
                shell: true,
                stdio: "inherit",
                cwd: options.global.cwd,
                env: {...process.env, ...options.global.process_env},
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
                resolve({success: false, error: error.message});
            });
        });
    }

    private async executeFunctionCommand(
        fn: Function,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            const context: SimpleCommandContext = {
                global: options.global,
                config: options.config,
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

    private async executeCommandGroup(
        group: CommandGroup,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        const [subcommandName, ...remainingArgs] = options.args || [];

        if (!subcommandName) {
            console.log(group.help || "Available subcommands:");
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

    private getCommandHelp(command: AnyCommand): string | undefined {
        if (
            typeof command === "string" ||
            typeof command === "function" ||
            command._type === "function"
        ) {
            return undefined;
        }
        return command.help;
    }

    private isStringCommand(command: any): command is StringCommand {
        return command && command._type === "string";
    }

    private isFunctionCommand(command: any): command is FunctionCommand {
        return command && command._type === "function";
    }

    private isCommandGroup(command: any): command is CommandGroup {
        return command && command._type === "group";
    }
}

export const commandRunner = new CommandRunner();
