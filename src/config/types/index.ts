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
export type * from "./config.ts";
export type * from "./zod_config.ts";
export * from "./zod_config.ts";
export type * from "./targets.ts";
export type * from "./zod_targets.ts";
export * from "./zod_targets.ts";
export type * from "./commands.ts";
export type * from "./zod_commands.ts";
export * from "./zod_commands.ts";
