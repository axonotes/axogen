import {liveExec} from "./";
import type {
    AnyCommand,
    StringCommand,
    FunctionCommand,
    CommandGroup,
    CommandGlobalContext,
    SimpleCommandContext,
    AxogenConfig,
} from "../types";
import {pretty} from "../utils/pretty";

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
        try {
            const prefix = this.extractCommandPrefix(command);

            const result = await liveExec(command, {
                cwd: options.global.cwd,
                env: options.global.process_env,
                outputPrefix: prefix,
            });

            return {
                success: result.exitCode === 0,
                exitCode: result.exitCode,
                error:
                    result.exitCode !== 0
                        ? `Command exited with code ${result.exitCode}`
                        : undefined,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private extractCommandPrefix(command: string): string {
        // Handle common patterns and extract meaningful command names

        // Remove leading/trailing whitespace
        const trimmed = command.trim();

        // Handle cd && command patterns - extract the actual command after &&
        const cdAndMatch = trimmed.match(/cd\s+[^&]*&&\s*(.+)/);
        if (cdAndMatch) {
            return this.extractCommandPrefix(cdAndMatch[1]);
        }

        // Handle pipe chains - use the first command
        const pipeMatch = trimmed.match(/^([^|]+)/);
        const baseCommand = pipeMatch ? pipeMatch[1].trim() : trimmed;

        // Extract the first word (the actual command)
        const words = baseCommand.split(/\s+/);
        const firstWord = words[0];

        // Handle common command patterns
        const commandMappings: Record<string, string> = {
            npm: "NPM",
            yarn: "YARN",
            pnpm: "PNPM",
            bun: "BUN",
            cargo: "CARGO",
            rustc: "RUST",
            node: "NODE",
            deno: "DENO",
            python: "PYTHON",
            python3: "PYTHON",
            pip: "PIP",
            git: "GIT",
            docker: "DOCKER",
            kubectl: "K8S",
            helm: "HELM",
            terraform: "TF",
            aws: "AWS",
            gcloud: "GCP",
            az: "AZURE",
            make: "MAKE",
            cmake: "CMAKE",
            gcc: "GCC",
            clang: "CLANG",
            go: "GO",
            javac: "JAVA",
            java: "JAVA",
            mvn: "MAVEN",
            gradle: "GRADLE",
            dotnet: "DOTNET",
            nuget: "NUGET",
            composer: "PHP",
            php: "PHP",
            ruby: "RUBY",
            gem: "GEM",
            bundle: "BUNDLE",
            rails: "RAILS",
            mix: "ELIXIR",
            iex: "ELIXIR",
            stack: "HASKELL",
            cabal: "HASKELL",
            swift: "SWIFT",
            xcodebuild: "XCODE",
            flutter: "FLUTTER",
            dart: "DART",
        };

        // Check if we have a mapping for this command
        const mapped = commandMappings[firstWord.toLowerCase()];
        if (mapped) {
            return mapped;
        }

        // Handle executable paths (./something, ../something, /something)
        if (firstWord.includes("/")) {
            const basename = firstWord.split("/").pop() || firstWord;
            return basename.toUpperCase();
        }

        // Handle commands with extensions (.exe, .sh, etc.)
        const withoutExt = firstWord.replace(/\.(exe|sh|bat|cmd|ps1)$/i, "");

        // Return uppercased first word, max 8 chars for readability
        return withoutExt.toUpperCase().slice(0, 8);
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
            if (group.help) {
                pretty.info(group.help);
            } else {
                pretty.info("Available subcommands:");
            }

            console.log(); // Add spacing

            // Create a table-like display for commands
            const commandRows: Array<{key: string; value: string}> = [];

            for (const [name, command] of Object.entries(group.commands)) {
                const help = this.getCommandHelp(command);
                commandRows.push({
                    key: name,
                    value: help || "No description available",
                });
            }

            if (commandRows.length > 0) {
                pretty.format.table(commandRows);
            } else {
                pretty.format.bullet("No subcommands available");
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
