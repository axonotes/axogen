import {liveExec} from "./";
import type {
    ZodAnyCommand,
    ZodAxogenConfig,
    ZodGroupCommand,
    ZodGlobalCommandContext,
    ZodSimpleCommandContext,
    ZodAdvancedCommand,
    AxogenConfig,
} from "../config/types";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import * as z from "zod";
import {
    getCommandHelp,
    isAdvancedCommand,
    isGroupCommand,
    isStringCommand,
    validateArgsWithZod,
    validateOptionsWithZod,
} from "./zod_helpers.ts";
import {logger} from "../utils/console/logger.ts";

export interface RunCommandOptions {
    config: ZodAxogenConfig;
    global: ZodGlobalCommandContext;
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
        command: ZodAnyCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            if (typeof command === "string") {
                return await this.executeStringCommand(command, options);
            }

            if (typeof command === "function") {
                return await this.executeFunctionCommand(command, options);
            }

            if (isStringCommand(command)) {
                return await this.executeStringCommand(
                    command.command,
                    options
                );
            }

            if (isAdvancedCommand(command)) {
                return await this.executeAdvancedCommand(command, options);
            }

            if (isGroupCommand(command)) {
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
            const context: ZodSimpleCommandContext = {
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

    private async executeAdvancedCommand(
        command: ZodAdvancedCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        try {
            const validatedOptions = command.options
                ? validateOptionsWithZod(options.options || {}, command.options)
                : {};

            const validatedArgs = command.args
                ? validateArgsWithZod(options.args || [], command.args)
                : {};

            await command.exec({
                global: options.global,
                config: options.config as AxogenConfig,
                options: validatedOptions,
                args: validatedArgs,
            });
            return {success: true};
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = zodIssuesToErrors(error.issues);

                logger.validation(
                    `Command validation failed: ${command.help || "No description"}`,
                    validationErrors
                );

                return {success: false, error: "Validation failed"};
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    private async executeCommandGroup(
        group: ZodGroupCommand,
        options: RunCommandOptions
    ): Promise<CommandResult> {
        const [subcommandName, ...remainingArgs] = options.args || [];

        if (!subcommandName) {
            if (group.help) {
                logger.info(group.help);
                console.log(); // Add spacing
            }

            logger.info("Available subcommands:");
            console.log(); // Add spacing

            // Create a table-like display for commands
            const commandRows: Array<{key: string; value: string}> = [];

            for (const [name, command] of Object.entries(group.commands)) {
                const help = getCommandHelp(command);
                commandRows.push({
                    key: name,
                    value: help || "No description available",
                });
            }

            if (commandRows.length > 0) {
                const maxKeyLength = Math.max(
                    ...commandRows.map((row) => row.key.length)
                );

                commandRows.forEach((row) => {
                    const paddedKey = row.key.padEnd(maxKeyLength, " ");
                    logger.bullet(`${paddedKey} - ${row.value}`);
                });
            } else {
                logger.bullet("No subcommands available");
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
}

export const commandRunner = new CommandRunner();
