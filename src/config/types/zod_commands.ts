/**
 * Where commands.ts is for DX, this file is for Zod validation.
 * It defines the actual Zod schemas for the commands and validates them.
 * It is used to ensure that the commands are correctly defined and can be
 * used in the Axogen config.
 */

import * as z from "zod";
import type {
    AnyCommand,
    CommandFunction,
    SimpleCommandFunction,
} from "./commands.ts";
import {axogenConfigSchema} from "./zod_config.ts";

const helpSchema = z
    .string()
    .describe("A description of the command, used for help output")
    .optional();

export const globalCommandContextSchema = z.object({
    cwd: z.string().describe("The current working directory"),
    process_env: z
        .record(z.string(), z.any())
        .describe("The process environment variables"),
    verbose: z
        .boolean()
        .describe("Whether the command is running in verbose mode"),
});

export const zodTypeSchema = z.custom<z.ZodType>((val) => {
    return val && typeof val === "object" && ("_zod" in val || "_def" in val);
});

export const commandContextSchema = z.object({
    options: z
        .record(z.string(), zodTypeSchema)
        .describe("The options for the command, as a record of Zod types")
        .default({}),
    args: z
        .record(z.string(), zodTypeSchema)
        .describe("The arguments for the command, as a record of Zod types")
        .default({}),
    global: globalCommandContextSchema.describe(
        "The global context for the command, including cwd and env"
    ),
    config: axogenConfigSchema,
});

export const simpleCommandContextSchema = z.object({
    global: globalCommandContextSchema.describe(
        "The global context for the command, including cwd and env"
    ),
    config: axogenConfigSchema,
});

export const stringCommandSchema = z.object({
    type: z
        .literal("string")
        .describe("The type of the command, in this case a string command"),
    help: helpSchema,
    command: z.string().describe("The command to be executed, as a string"),
});

export const groupCommandSchema = z.object({
    type: z
        .literal("group")
        .describe("The type of the command, in this case a group command"),
    help: helpSchema,
    commands: z
        .record(
            z.string(),
            z.lazy(() => anyCommandSchema)
        )
        .describe("The commands in the group"),
});

export const advancedCommandSchema = z.object({
    type: z
        .literal("advanced")
        .describe("The type of the command, in this case an advanced command"),
    help: helpSchema,
    options: z
        .record(z.string(), zodTypeSchema)
        .describe("The options for the command, as a record of Zod types")
        .default({}),
    args: z
        .record(z.string(), zodTypeSchema)
        .describe("The arguments for the command, as a record of Zod types")
        .default({}),
    exec: z
        .custom<CommandFunction>((val) => {
            return typeof val === "function";
        })
        .describe("The function to execute for the command"),
});

export const simpleStringCommandSchema = z
    .string()
    .describe("A simple command string, which is executed directly");
export const simpleCommandFunctionSchema = z
    .custom<SimpleCommandFunction>((val) => {
        return typeof val === "function";
    })
    .describe("A simple command function that takes a context object");

export const anyCommandSchema: z.ZodType<AnyCommand> = z.union([
    simpleStringCommandSchema,
    simpleCommandFunctionSchema,
    stringCommandSchema,
    groupCommandSchema,
    advancedCommandSchema,
]);

// --- Exported Types ---

export type ZodAnyCommand = z.infer<typeof anyCommandSchema>;

export type ZodStringCommand = z.infer<typeof stringCommandSchema>;
export type ZodGroupCommand = z.infer<typeof groupCommandSchema>;
export type ZodAdvancedCommand = z.infer<typeof advancedCommandSchema>;
export type ZodSimpleStringCommand = z.infer<typeof simpleStringCommandSchema>;
export type ZodSimpleCommandFunction = z.infer<
    typeof simpleCommandFunctionSchema
>;

export type ZodCommandContext = z.infer<typeof commandContextSchema>;
export type ZodSimpleCommandContext = z.infer<
    typeof simpleCommandContextSchema
>;
export type ZodGlobalCommandContext = z.infer<
    typeof globalCommandContextSchema
>;
