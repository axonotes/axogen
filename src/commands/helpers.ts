import {z} from "zod";
import type {
    StringCommand,
    SchemaCommand,
    CommandGroup,
    AnyCommand,
    SchemaCommandFunction,
    SimpleCommandFunction,
    FunctionCommand,
} from "../types";

/**
 * Create a simple string command with optional help text
 */
export function stringCommand(command: string, help?: string): StringCommand {
    return {
        _type: "string",
        command,
        help,
    };
}

/**
 * Create a function command from a simple function
 */
export function functionCommand(exec: SimpleCommandFunction): FunctionCommand {
    return {
        _type: "function",
        exec,
    };
}

/**
 * Define a schema-based command with type-safe options and arguments
 */
export function defineCommand<
    TOptions extends Record<string, z.ZodType> = Record<string, z.ZodType>,
    TArgs extends Record<string, z.ZodType> = Record<string, z.ZodType>,
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

/**
 * Create a command group with nested commands
 */
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

/**
 * Utility type to infer the context type for a command
 */
export type InferCommandContext<T> =
    T extends SchemaCommand<infer TOptions, infer TArgs>
        ? {
              options: {
                  [K in keyof TOptions]: z.infer<TOptions[K]>;
              };
              args: {
                  [K in keyof TArgs]: z.infer<TArgs[K]>;
              };
          }
        : never;

/**
 * Utility to create a strongly typed command definition with perfect inference
 */
export const command = {
    /**
     * Create a simple string command
     */
    string: stringCommand,

    /**
     * Create a function command
     */
    function: functionCommand,

    /**
     * Create a schema-based command with full type safety
     */
    define: defineCommand,

    /**
     * Create a command group
     */
    group: commandGroup,
} as const;

/**
 * Enhanced defineCommand with even better type inference
 * This version provides better IDE support and error messages
 */
export function cmd<
    TOptions extends Record<string, z.ZodType> = {},
    TArgs extends Record<string, z.ZodType> = {},
>(spec: {
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: (context: {
        options: {[K in keyof TOptions]: z.infer<TOptions[K]>};
        args: {[K in keyof TArgs]: z.infer<TArgs[K]>};
        global: {
            cwd: string;
            env: Record<string, string | undefined>;
            verbose: boolean;
        };
        config: any; // Will be properly typed when used
    }) => Promise<void> | void;
}): SchemaCommand<TOptions, TArgs> {
    return defineCommand(spec);
}

/**
 * Type-safe command group builder with better ergonomics
 */
export function group(
    spec: Record<string, AnyCommand>,
    help?: string
): CommandGroup {
    return commandGroup(spec, help);
}
