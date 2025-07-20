import {z} from "zod";

/**
 * Zod schemas for configuration validation - FIXED for Zod v4
 */

// Base schemas
const baseTargetSchema = z.object({
    path: z.string({
        message: "Target path must be a string",
    }),
    variables: z.record(z.string(), z.any()),
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

// Command schemas - with strict validation
const commandOptionSchema = z
    .object({
        flags: z
            .string({
                message:
                    "Option flags must be a string (e.g., '-f, --file <path>')",
            })
            .regex(/^-/, {
                message: "Option flags must start with '-'",
            }),
        description: z.string().optional(),
        default: z.any().optional(),
        choices: z.array(z.string()).readonly().optional(),
        required: z.boolean().optional(),
        parser: z.any().optional(), // Functions can't be validated in Zod v4
        env: z.string().optional(),
    })
    .strict();

const commandArgumentSchema = z
    .object({
        syntax: z
            .string({
                message:
                    "Argument syntax must be a string (e.g., '<n>' or '[name]')",
            })
            .regex(/^(<[^>]+>|\[[^\]]+\])$/, {
                message:
                    "Invalid argument syntax. Use <required> or [optional]",
            }),
        description: z.string().optional(),
        default: z.any().optional(),
        parser: z.any().optional(), // Functions can't be validated in Zod v4
    })
    .strict();

// Command function schema - simplified for Zod v4 compatibility
const commandFunctionSchema = z
    .any()
    .refine((val) => typeof val === "function", {
        message: "Must be a function",
    });

// Command definition schemas - with strict validation
const executableCommandSchema = z
    .object({
        help: z.string().optional(),
        options: z.array(commandOptionSchema).readonly().optional(),
        arguments: z.array(commandArgumentSchema).readonly().optional(),
        exec: z.union([z.string(), commandFunctionSchema]),
        subcommands: z.undefined().optional(),
    })
    .strict();

const parentCommandSchema: z.ZodType<any> = z
    .object({
        help: z.string().optional(),
        subcommands: z.lazy(() => z.record(z.string(), commandSchema)),
        exec: z.undefined().optional(),
        options: z.undefined().optional(),
        arguments: z.undefined().optional(),
    })
    .strict();

const commandDefinitionSchema = z.union([
    executableCommandSchema,
    parentCommandSchema,
]);

// Main command schema (string, function, or definition)
export const commandSchema: z.ZodType<any> = z.union([
    z.string(),
    commandFunctionSchema,
    commandDefinitionSchema,
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

export type CommandOption = z.infer<typeof commandOptionSchema>;
export type CommandArgument = z.infer<typeof commandArgumentSchema>;

export interface CommandContext<
    TOptions extends Record<string, any> = Record<string, any>,
    TArgs extends readonly any[] = readonly any[],
> {
    options: TOptions;
    args: TArgs;
    config: AxogenConfig;
}

export type CommandFunction<
    TOptions extends Record<string, any> = Record<string, any>,
    TArgs extends readonly any[] = readonly any[],
> = (context: CommandContext<TOptions, TArgs>) => Promise<void> | void;

export type ExecutableCommandDefinition = z.infer<
    typeof executableCommandSchema
>;
export type ParentCommandDefinition = z.infer<typeof parentCommandSchema>;
export type CommandDefinition = z.infer<typeof commandDefinitionSchema>;
export type Command = z.infer<typeof commandSchema>;

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
export function validateCommand(name: string, command: unknown): Command {
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
