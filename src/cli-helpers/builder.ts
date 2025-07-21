import {Command} from "commander";
import {z} from "zod";
import type {
    AnyCommand,
    AxogenConfig,
    CommandGlobalContext,
    SchemaCommand,
} from "../types";
import {commandRunner} from "./runner";
import {pretty} from "../utils/pretty";

export function buildDynamicCommands(cli: Command, config: AxogenConfig): void {
    if (!config.commands) return;

    for (const [name, command] of Object.entries(config.commands)) {
        const cmd = createCommandFromConfig(name, command, config);
        cli.addCommand(cmd);
    }
}

function createCommandFromConfig(
    name: string,
    command: AnyCommand,
    config: AxogenConfig
): Command {
    const cmd = new Command(name);

    const help = getCommandHelp(command);
    if (help) {
        cmd.description(help);
    }

    if (isSchemaCommand(command)) {
        return buildSchemaCommand(cmd, command, config);
    }

    return buildSimpleCommand(cmd, command, config);
}

function buildSchemaCommand(
    cmd: Command,
    command: SchemaCommand,
    config: AxogenConfig
): Command {
    // Add options - Commander.js just handles basic parsing
    if (command.options) {
        for (const [optionName, zodSchema] of Object.entries(command.options)) {
            addBasicOption(cmd, optionName, zodSchema);
        }
    }

    // Add arguments - Commander.js just handles basic parsing
    if (command.args) {
        for (const [argName, zodSchema] of Object.entries(command.args)) {
            addBasicArgument(cmd, argName, zodSchema);
        }
    }

    cmd.action(async (...args) => {
        const commandObj = args[args.length - 1];
        const rawOptions = commandObj.opts();
        const rawArgs = args.slice(0, -1);

        try {
            // Let Zod handle ALL the type conversion and validation
            const validatedOptions = command.options
                ? validateOptionsWithZod(rawOptions, command.options)
                : {};

            const validatedArgs = command.args
                ? validateArgsWithZod(rawArgs, command.args)
                : {};

            const global = createGlobalContext(
                commandObj.parent?.opts?.()?.verbose
            );

            await command.exec({
                options: validatedOptions,
                args: validatedArgs,
                global,
                config,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = error.issues.map((issue) => {
                    const field = issue.path.join(".");

                    // Determine error type
                    let type: "missing" | "invalid" | "type" = "invalid";
                    if (
                        issue.code === "invalid_type" &&
                        issue.input === undefined
                    ) {
                        type = "missing";
                    } else if (issue.code === "invalid_type") {
                        type = "type";
                    }

                    return {
                        field,
                        message: issue.message,
                        type,
                    };
                });

                pretty.validation.errorGroup(
                    "Command validation failed",
                    validationErrors
                );
                console.log();
                pretty.info(
                    `${pretty.text.dimmed("💡 Check your command arguments and options.")}`
                );

                process.exit(1);
            }
            pretty.error(
                `Command failed: ${error instanceof Error ? error.message : error}`
            );
            process.exit(1);
        }
    });

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

// =============================================
// ZOD-BASED VALIDATION
// =============================================

function validateOptionsWithZod(
    rawOptions: Record<string, any>,
    optionsSchema: Record<string, z.ZodType>
): any {
    // Preprocess: Convert comma-separated strings to arrays for array schemas
    const processedOptions = {...rawOptions};

    for (const [key, schema] of Object.entries(optionsSchema)) {
        const info = analyzeZodSchema(schema);
        if (
            info.baseType === "array" &&
            typeof processedOptions[key] === "string"
        ) {
            // Split comma-separated string into array
            processedOptions[key] = processedOptions[key]
                .split(",")
                .map((s: string) => s.trim());
        }
    }

    // Let Zod handle all type conversion, defaults, validation
    return z.object(optionsSchema).parse(processedOptions);
}

function validateArgsWithZod(
    rawArgs: any[],
    argsSchema: Record<string, z.ZodType>
): any {
    const argNames = Object.keys(argsSchema);
    const argsObject: Record<string, any> = {};

    // Map positional args to schema keys
    for (let i = 0; i < argNames.length; i++) {
        const argName = argNames[i];
        const value = rawArgs[i];
        if (value !== undefined) {
            argsObject[argName] = value;
        }
    }

    try {
        // Let Zod handle all type conversion, defaults, validation
        return z.object(argsSchema).parse(argsObject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new z.ZodError([
                ...error.issues.map((issue) => ({
                    ...issue,
                    path: ["args", ...issue.path],
                })),
            ]);
        }
        throw error;
    }
}

// =============================================
// SIMPLIFIED SCHEMA ANALYSIS
// =============================================

interface ZodSchemaInfo {
    baseType: string;
    isOptional: boolean;
    description?: string;
}

function analyzeZodSchema(schema: z.ZodType): ZodSchemaInfo {
    let currentSchema = schema;
    let isOptional = false;
    let description: string | undefined = undefined;

    // Traverse wrapper schemas only - stop at core types
    while (currentSchema) {
        // Extract description
        if (!description) {
            description = extractDescription(currentSchema);
        }

        // Check for optional/nullable markers
        const type = getZodType(currentSchema);

        if (type === "optional" || type === "nullable" || type === "default") {
            isOptional = true;
            // These are wrapper types - unwrap them
            if (canUnwrap(currentSchema)) {
                currentSchema = currentSchema.unwrap();
            } else {
                break;
            }
        } else {
            // This is a core type (array, string, number, etc.) - stop here!
            break;
        }
    }

    // Get final base type
    const baseType = getZodType(currentSchema);

    return {
        baseType,
        isOptional,
        description,
    };
}

function getZodType(schema: z.ZodType): string {
    return schema._zod?.def?.type || "unknown";
}

function extractDescription(schema: z.ZodType): string | undefined {
    try {
        const meta = schema.meta();
        if (meta && typeof meta.description === "string") {
            return meta.description;
        }
    } catch {
        // Schema doesn't support meta
    }
    return undefined;
}

function canUnwrap(
    schema: z.ZodType
): schema is z.ZodType & {unwrap(): z.ZodType} {
    return typeof (schema as any).unwrap === "function";
}

// =============================================
// REMAINING FUNCTIONS
// =============================================

function buildSimpleCommand(
    cmd: Command,
    command: AnyCommand,
    config: AxogenConfig
): Command {
    cmd.allowUnknownOption(true);
    cmd.allowExcessArguments(true);

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
                pretty.error(`Command failed: ${result.error}`);
                process.exit(result.exitCode || 1);
            }
        } catch (error) {
            pretty.error(
                `Command failed: ${error instanceof Error ? error.message : error}`
            );
            process.exit(1);
        }
    });

    return cmd;
}

function getCommandHelp(command: AnyCommand): string | undefined {
    if (
        typeof command === "string" ||
        typeof command === "function" ||
        command._type === "function"
    ) {
        return undefined;
    }
    return command.help;
}

function isSchemaCommand(command: AnyCommand): command is SchemaCommand {
    return (
        typeof command === "object" &&
        command !== null &&
        "_type" in command &&
        command._type === "schema"
    );
}

function createGlobalContext(verbose: boolean = false): CommandGlobalContext {
    return {
        cwd: process.cwd(),
        process_env: process.env,
        verbose,
    };
}
