import {z} from "zod";
import type {
    StringCommand,
    SchemaCommand,
    CommandGroup,
    AnyCommand,
    SchemaCommandFunction,
    SimpleCommandFunction,
    FunctionCommand,
    CommandContext,
} from "../types";

export function stringCommand(command: string, help?: string): StringCommand {
    return {
        _type: "string",
        command,
        help,
    };
}

export function functionCommand(exec: SimpleCommandFunction): FunctionCommand {
    return {
        _type: "function",
        exec,
    };
}

export function defineCommand<
    TOptions extends Record<string, z.ZodType> = {},
    TArgs extends Record<string, z.ZodType> = {},
>(definition: {
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: SchemaCommandFunction<TOptions, TArgs>;
}): SchemaCommand<TOptions, TArgs> {
    return {
        _type: "schema",
        help: definition.help,
        options: definition.options,
        args: definition.args,
        exec: definition.exec,
    };
}

export function commandGroup(
    commands: Record<string, AnyCommand>,
    help?: string
): CommandGroup {
    return {
        _type: "group",
        help,
        commands,
    };
}

// Enhanced command builder with perfect type inference
export function cmd<
    TOptions extends Record<string, z.ZodType> = {},
    TArgs extends Record<string, z.ZodType> = {},
>(spec: {
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: (context: CommandContext<TOptions, TArgs>) => Promise<void> | void;
}): SchemaCommand<TOptions, TArgs> {
    return defineCommand(spec);
}

export function group(
    spec: Record<string, AnyCommand>,
    help?: string
): CommandGroup {
    return commandGroup(spec, help);
}

// Utility exports for easier use
export const command = {
    string: stringCommand,
    function: functionCommand,
    define: defineCommand,
    group: commandGroup,
} as const;
