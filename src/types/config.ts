import {z} from "zod";

/**
 * Zod schemas for configuration validation - UPDATED for new command system with Zod v4
 */

// Base schemas
const baseTargetSchema = z.object({
    path: z.string({
        message: "Target path must be a string",
    }),
    variables: z.record(z.string(), z.any()).optional().default({}),
    generate_meta: z.boolean().default(false).optional(),
});

// Target schemas - with strict validation
export const envTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("env"),
    })
    .strict();

export const jsonTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("json"),
        indent: z.union([z.number(), z.string()]).default(2).optional(),
    })
    .strict();

export const yamlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("yaml"),
        options: z
            .object({
                indent: z.number().optional(),
                lineWidth: z.number().optional(),
                noRefs: z.boolean().optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export const tomlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("toml"),
    })
    .strict();

export const templateTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("template"),
        template: z.string({
            message: "Template path must be a string",
        }),
        engine: z
            .enum(["nunjucks", "handlebars", "mustache"])
            .default("nunjucks")
            .optional(),
    })
    .strict();

// Union of all target types
export const targetSchema = z.discriminatedUnion("type", [
    envTargetSchema,
    jsonTargetSchema,
    yamlTargetSchema,
    tomlTargetSchema,
    templateTargetSchema,
]);

// NEW COMMAND SYSTEM TYPES

/**
 * Global context available to all commands
 */
export interface CommandGlobalContext {
    cwd: string;
    env: Record<string, string | undefined>;
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
    // Legacy aliases for compatibility
    cwd: string;
    env: Record<string, string | undefined>;
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

// Main config schema
export const axogenConfigSchema = z
    .object({
        watch: z.array(z.string()).optional(),
        targets: z.record(z.string(), targetSchema).optional(),
        commands: z.record(z.string(), commandSchema).optional(),
    })
    .strict();

// Type exports (inferred from schemas)
export type EnvTarget = z.infer<typeof envTargetSchema>;
export type JsonTarget = z.infer<typeof jsonTargetSchema>;
export type YamlTarget = z.infer<typeof yamlTargetSchema>;
export type TomlTarget = z.infer<typeof tomlTargetSchema>;
export type TemplateTarget = z.infer<typeof templateTargetSchema>;
export type Target = z.infer<typeof targetSchema>;

export type AxogenConfig = z.infer<typeof axogenConfigSchema>;

// Legacy compatibility
export type ConfigFunction = () => AxogenConfig | Promise<AxogenConfig>;
export type ConfigInput = AxogenConfig | ConfigFunction;

// Helper function to validate targets with better error messages
export function validateTarget(name: string, target: unknown): Target {
    try {
        return targetSchema.parse(target);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedError = error.issues
                .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
                .join("\n");
            throw new Error(`Invalid target "${name}":\n${formattedError}`);
        }
        throw error;
    }
}

// Helper function to validate commands with better error messages
export function validateCommand(name: string, command: unknown): AnyCommand {
    try {
        return commandSchema.parse(command);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const formattedError = error.issues
                .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
                .join("\n");
            throw new Error(`Invalid command "${name}":\n${formattedError}`);
        }
        throw error;
    }
}
