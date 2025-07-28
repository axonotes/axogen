import * as z from "zod";
import type {
    AnyCommand,
    CommandGroup,
    FunctionCommand,
    ParallelCommand,
    SchemaCommand,
    SchemaCommandFunction,
    SequentialCommand,
    SimpleCommandFunction,
    StringCommand,
    TypeArgs,
    TypeOptions,
    TypeTargets,
} from "./commands.ts";
import {zodIssuesToErrors} from "../../utils/helpers.ts";
import {pretty} from "../../utils/pretty.ts";

export const stringCommandSchema: z.ZodType<StringCommand> = z.object({
    _type: z.literal("string"),
    command: z.string(),
    help: z.string().optional(),
});

export const schemaCommandSchema: z.ZodType<SchemaCommand> = z.object({
    _type: z.literal("schema"),
    help: z.string().optional(),
    options: z.record(z.string(), z.any()).optional(),
    args: z.record(z.string(), z.any()).optional(),
    exec: z.custom<SchemaCommandFunction>(
        (value) => typeof value === "function"
    ),
});

export const functionCommandSchema: z.ZodType<FunctionCommand> = z.object({
    _type: z.literal("function"),
    help: z.string().optional(),
    exec: z.custom<SimpleCommandFunction>(
        (value) => typeof value === "function"
    ),
});

export const parallelCommandSchema: z.ZodType<ParallelCommand> = z.object({
    _type: z.literal("parallel"),
    help: z.string().optional(),
    commands: z.array(z.lazy(() => commandSchema)),
});

export const sequentialCommandSchema: z.ZodType<SequentialCommand> = z.object({
    _type: z.literal("sequential"),
    help: z.string().optional(),
    commands: z.array(z.lazy(() => commandSchema)),
});

export const commandGroupSchema: z.ZodType<CommandGroup> = z.object({
    _type: z.literal("group"),
    help: z.string().optional(),
    commands: z.record(
        z.string(),
        z.lazy(() => commandSchema)
    ),
});

export const commandSchema: z.ZodType<AnyCommand> = z.union([
    z.string(),
    stringCommandSchema,
    schemaCommandSchema,
    functionCommandSchema,
    commandGroupSchema,
]);

export type ZodStringCommand = z.infer<typeof stringCommandSchema>;
export type ZodSchemaCommand = z.infer<typeof schemaCommandSchema>;
export type ZodFunctionCommand = z.infer<typeof functionCommandSchema>;
export type ZodParallelCommand = z.infer<typeof parallelCommandSchema>;
export type ZodSequentialCommand = z.infer<typeof sequentialCommandSchema>;
export type ZodCommandGroup = z.infer<typeof commandGroupSchema>;
export type ZodAnyCommand = z.infer<typeof commandSchema>;

// Helper functions to create and validate commands
function handleError(
    error: z.ZodError | Error | unknown,
    title: string
): never {
    if (error instanceof z.ZodError) {
        const validationErrors = zodIssuesToErrors(error.issues);

        pretty.validation.errorGroup(
            `Command validation failed for "${pretty.text.accent(title)}"`,
            validationErrors
        );

        console.log();

        throw new Error("Command validation failed");
    }

    throw new Error(
        `Failed to validate command "${pretty.text.accent(title)}": ${
            error instanceof Error ? error.message : String(error)
        }`
    );
}

export function stringCommand(command: string, help?: string): StringCommand {
    try {
        return stringCommandSchema.parse({
            _type: "string",
            command,
            help,
        });
    } catch (error) {
        handleError(error, command);
    }
}

export function functionCommand(exec: SchemaCommandFunction): FunctionCommand {
    try {
        return functionCommandSchema.parse({
            _type: "function",
            exec,
        });
    } catch (error) {
        handleError(error, exec.name || "anonymous function");
    }
}

export function defineCommand<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
>(definition: {
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: SchemaCommandFunction<TOptions, TArgs, TTargets>;
}): SchemaCommand {
    try {
        return schemaCommandSchema.parse({
            _type: "schema",
            help: definition.help,
            options: definition.options,
            args: definition.args,
            exec: definition.exec,
        });
    } catch (error) {
        handleError(
            error,
            definition.exec.name || definition.help || "anonymous function"
        );
    }
}

export function commandGroup(
    commands: Record<string, AnyCommand>,
    help?: string
): CommandGroup {
    try {
        return commandGroupSchema.parse({
            _type: "group",
            help,
            commands,
        });
    } catch (error) {
        handleError(error, help || "command group");
    }
}

export function parallelCommand(
    commands: AnyCommand[],
    help?: string
): ParallelCommand {
    try {
        return parallelCommandSchema.parse({
            _type: "parallel",
            help,
            commands,
        });
    } catch (error) {
        handleError(error, help || "parallel command");
    }
}

export function sequentialCommand(
    commands: AnyCommand[],
    help?: string
): SequentialCommand {
    try {
        return sequentialCommandSchema.parse({
            _type: "sequential",
            help,
            commands,
        });
    } catch (error) {
        handleError(error, help || "sequential command");
    }
}

export const command = {
    string: stringCommand,
    function: functionCommand,
    define: defineCommand,
    group: commandGroup,
    parallel: parallelCommand,
    sequential: sequentialCommand,
} as const;
