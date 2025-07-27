import * as z from "zod";
import type {AxogenConfig} from "./index.ts";

/**
 * Global context available to all commands
 */
export interface CommandGlobalContext {
    cwd: string;
    process_env: Record<string, string | undefined>;
    verbose: boolean;
}

/**
 * Command context for schema-based commands
 */
export interface CommandContext<
    TOptions extends Record<string, z.ZodType> = Record<string, z.ZodType>,
    TArgs extends Record<string, z.ZodType> = Record<string, z.ZodType>,
> {
    options: {
        [K in keyof TOptions]: z.infer<TOptions[K]>;
    };
    args: {
        [K in keyof TArgs]: z.infer<TArgs[K]>;
    };
    global: CommandGlobalContext;
    config: AxogenConfig;
}

/**
 * Simple command context for function-only commands
 */
export interface SimpleCommandContext {
    global: CommandGlobalContext;
    config: AxogenConfig;
}

/**
 * Command function types
 */
export type SimpleCommandFunction = (
    context: SimpleCommandContext
) => Promise<void> | void;

export type SchemaCommandFunction<
    TOptions extends Record<string, z.ZodType> = Record<string, z.ZodType>,
    TArgs extends Record<string, z.ZodType> = Record<string, z.ZodType>,
> = (context: CommandContext<TOptions, TArgs>) => Promise<void> | void;

/**
 * String command definition
 */
export interface StringCommand {
    _type: "string";
    command: string;
    help?: string;
}

/**
 * Schema-based command definition
 */
export interface SchemaCommand<
    TOptions extends Record<string, z.ZodType> = Record<string, z.ZodType>,
    TArgs extends Record<string, z.ZodType> = Record<string, z.ZodType>,
> {
    _type: "schema";
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: SchemaCommandFunction<TOptions, TArgs>;
}

/**
 * Function command definition
 */
export interface FunctionCommand {
    _type: "function";
    exec: SimpleCommandFunction;
}

/**
 * Command group definition
 */
export interface CommandGroup {
    _type: "group";
    help?: string;
    commands: Record<string, AnyCommand>;
}

/**
 * Union of all command types
 */
export type AnyCommand =
    | string
    | SimpleCommandFunction
    | StringCommand
    | SchemaCommand
    | SchemaCommand<any, any>
    | FunctionCommand
    | CommandGroup;

/**
 * Zod schema for command validation
 */
const stringCommandSchema = z.object({
    _type: z.literal("string"),
    command: z.string(),
    help: z.string().optional(),
});

const functionCommandSchema = z.object({
    _type: z.literal("function"),
    exec: z.custom<SimpleCommandFunction>(
        (value) => typeof value === "function"
    ),
});

const schemaCommandSchema = z.object({
    _type: z.literal("schema"),
    help: z.string().optional(),
    options: z.record(z.string(), z.any()).optional(),
    args: z.record(z.string(), z.any()).optional(),
    exec: z.custom<SchemaCommandFunction>(
        (value) => typeof value === "function"
    ),
});

const commandGroupSchema: z.ZodType<CommandGroup> = z.object({
    _type: z.literal("group"),
    help: z.string().optional(),
    commands: z.record(
        z.string(),
        z.lazy(() => commandSchema)
    ),
});

// Main command schema that accepts all types
export const commandSchema: z.ZodType<AnyCommand> = z.union([
    z.string(),
    stringCommandSchema,
    schemaCommandSchema,
    functionCommandSchema,
    commandGroupSchema,
]);
