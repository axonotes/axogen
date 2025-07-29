import {type AnyTarget, json} from "./targets.ts";
import * as z from "zod";
import {axogenConfigSchema, type ZodAxogenConfig} from "./zod_config.ts";
import {zodIssuesToErrors} from "../../utils/helpers.ts";
import {pretty} from "../../utils/pretty.ts";
import type {AxogenConfig} from "./config.ts";
import {cmd} from "./commands.ts";

export function defineConfig<TTargets extends Record<string, AnyTarget>>(
    config: AxogenConfig<TTargets>
): ZodAxogenConfig {
    try {
        return axogenConfigSchema.parse({
            ...config,
            type: "AxogenConfig",
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
export * from "./config.ts";
export type * from "./zod_config.ts";
export * from "./zod_config.ts";
export type * from "./targets.ts";
export * from "./targets.ts";
export type * from "./zod_targets.ts";
export * from "./zod_targets.ts";
export type * from "./commands.ts";
export * from "./commands.ts";
export type * from "./zod_commands.ts";
export * from "./zod_commands.ts";

// Testing defineConfig (build will fail if tsc errors this)

const conf = defineConfig({
    targets: {
        someService: json({
            path: "output/someService.json",
            schema: z.object({
                someVar: z.string().describe("A variable for the service"),
            }),
            variables: {
                someVar: "value",
            },
        }),
    },
    commands: {
        someCommand: cmd({
            command: "echo 'Hello, World!'",
            help: "A simple command that echoes 'Hello, World!'",
        }),
        simple: "test",
        simpleFunction: (context) => {
            context.config.targets!.someService.variables.someVar;
        },
        complex: cmd({
            help: "A complex command with options and arguments",
            args: {
                someArg: z.number().describe("An argument for the command"),
            },
            exec: (context) => {
                const arg = context.args.someArg;
                const someVar =
                    context.config.targets!.someService.variables.someVar;
            },
        }),
    },
});
