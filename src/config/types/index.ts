import type {SchemaType} from "./targets.ts";
import * as z from "zod";
import {axogenConfigSchema, type ZodAxogenConfig} from "./zod_config.ts";
import {zodIssuesToErrors} from "../../utils/helpers.ts";
import {pretty} from "../../utils/pretty.ts";
import type {AxogenConfig} from "./config.ts";

export function defineConfig<TTargets extends Record<string, SchemaType>>(
    config: AxogenConfig<TTargets>
): ZodAxogenConfig {
    try {
        return axogenConfigSchema.parse({
            ...config,
            _type: "AxogenConfig",
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = zodIssuesToErrors(error.issues);

            pretty.validation.errorGroup(
                `Configuration validation failed`,
                validationErrors
            );

            console.log();
            pretty.info(
                `${pretty.text.dimmed("💡 Check your config file structure.")}`
            );

            throw new Error("Configuration validation failed");
        }

        throw new Error(
            `Failed to load config: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}

// re-export the types for convenience
export type {AxogenConfig, Variables, ConfigInput} from "./config.ts";

export type {ZodAxogenConfig} from "./zod_config.ts";

export {axogenConfigSchema} from "./zod_config.ts";

export type {
    EnvTarget,
    EnvTargetNoSchema,
    JsonTarget,
    JsonTargetNoSchema,
    YamlTarget,
    YamlTargetNoSchema,
    TomlTarget,
    TomlTargetNoSchema,
    TemplateTarget,
    TemplateTargetNoSchema,
    Target,
    Targets,
} from "./targets.ts";

export type {
    ZodEnvTarget,
    ZodJsonTarget,
    ZodYamlTarget,
    ZodTomlTarget,
    ZodTemplateTarget,
    ZodTarget,
    ZodTargets,
} from "./zod_targets.ts";

export {
    envTargetSchema,
    jsonTargetSchema,
    yamlTargetSchema,
    tomlTargetSchema,
    templateTargetSchema,
    targetSchema,
    targetsSchema,
} from "./zod_targets.ts";

export type {
    CommandGlobalContext,
    CommandContext,
    SimpleCommandContext,
    SimpleCommandFunction,
    SchemaCommandFunction,
    StringCommand,
    SchemaCommand,
    FunctionCommand,
    ParallelCommand,
    SequentialCommand,
    CommandGroup,
    AnyCommand,
} from "./commands.ts";

export type {
    ZodStringCommand,
    ZodSchemaCommand,
    ZodFunctionCommand,
    ZodParallelCommand,
    ZodSequentialCommand,
    ZodCommandGroup,
    ZodAnyCommand,
} from "./zod_commands.ts";

export {
    stringCommandSchema,
    schemaCommandSchema,
    functionCommandSchema,
    parallelCommandSchema,
    sequentialCommandSchema,
    commandGroupSchema,
    commandSchema,
    stringCommand,
    functionCommand,
    defineCommand,
    commandGroup,
    parallelCommand,
    sequentialCommand,
    command,
} from "./zod_commands.ts";
