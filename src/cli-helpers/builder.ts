import {Command} from "commander";
import {z} from "zod";
import {commandRunner} from "./runner";
import type {
    ZodAnyCommand,
    ZodAxogenConfig,
    ZodGlobalCommandContext,
} from "../config/types";
import {
    analyzeZodSchema,
    getCommandHelp,
    isAdvancedCommand,
    isGroupCommand,
} from "./zod_helpers.ts";
import {logger} from "../utils/console/logger.ts";

export function buildDynamicCommands(
    cli: Command,
    config: ZodAxogenConfig
): void {
    if (!config.commands) return;

    for (const [name, command] of Object.entries(config.commands)) {
        const cmd = createCommandFromConfig(name, command, config);
        cli.addCommand(cmd);
    }
}

function createCommandFromConfig(
    name: string,
    command: ZodAnyCommand,
    config: ZodAxogenConfig
): Command {
    const cmd = new Command(name);

    const help = getCommandHelp(command);
    if (help) {
        cmd.description(help);
    }

    if (isAdvancedCommand(command)) {
        // Add options - Commander.js just handles basic parsing
        if (command.options) {
            for (const [optionName, zodSchema] of Object.entries(
                command.options
            )) {
                addBasicOption(cmd, optionName, zodSchema);
            }
        }

        // Add arguments - Commander.js just handles basic parsing
        if (command.args) {
            for (const [argName, zodSchema] of Object.entries(command.args)) {
                addBasicArgument(cmd, argName, zodSchema);
            }
        }
    } else {
        cmd.allowUnknownOption(true);
        cmd.allowExcessArguments(true);
    }

    if (isGroupCommand(command)) {
        for (const [n, c] of Object.entries(command.commands)) {
            cmd.addCommand(createCommandFromConfig(n, c, config));
        }
    } else {
        cmd.action(async (...args) => {
            const commandObj = args[args.length - 1];
            const options = commandObj.opts();
            const positionalArgs = args.slice(0, -1);

            try {
                const global = createGlobalContext(
                    commandObj.parent?.opts?.()?.verbose
                );

                const result = await commandRunner.executeCommand(command, {
                    config,
                    global,
                    args: positionalArgs,
                    options,
                });

                if (!result.success) {
                    logger.error(`Command failed: ${result.error}`);
                    process.exit(result.exitCode || 1);
                }
            } catch (error) {
                logger.error(
                    `Command failed: ${error instanceof Error ? error.message : error}`
                );
                process.exit(1);
            }
        });
    }

    return cmd;
}

// =============================================
// BASIC COMMANDER.JS SETUP
// =============================================

function addBasicOption(
    cmd: Command,
    optionName: string,
    zodSchema: z.ZodType
): void {
    const info = analyzeZodSchema(zodSchema);
    const description = info.description || `${optionName} option`;

    // Handle boolean flags - Commander.js handles these natively
    if (info.baseType === "boolean") {
        cmd.option(`--${optionName}`, description);
        return;
    }

    // Handle arrays - Accept comma-separated strings, let Zod split them
    if (info.baseType === "array") {
        const flag = info.isOptional
            ? `--${optionName} [${optionName}]`
            : `--${optionName} <${optionName}>`;

        cmd.option(flag, `${description} (comma-separated)`);
        return;
    }

    // Handle regular options - Commander.js just captures strings
    const flag = info.isOptional
        ? `--${optionName} [${optionName}]`
        : `--${optionName} <${optionName}>`;

    cmd.option(flag, description);
}

function addBasicArgument(
    cmd: Command,
    argName: string,
    zodSchema: z.ZodType
): void {
    const info = analyzeZodSchema(zodSchema);
    const description = info.description || `${argName} argument`;

    // Handle array arguments - Commander.js collects remaining args
    // NOTE: Only the LAST argument can be variadic in Commander.js
    if (info.baseType === "array") {
        const syntax = info.isOptional ? `[${argName}...]` : `<${argName}...>`;
        cmd.argument(syntax, description);
    } else {
        // Handle single arguments
        const syntax = info.isOptional ? `[${argName}]` : `<${argName}>`;
        cmd.argument(syntax, description);
    }
}

function createGlobalContext(
    verbose: boolean = false
): ZodGlobalCommandContext {
    return {
        cwd: process.cwd(),
        process_env: process.env,
        verbose,
    };
}
