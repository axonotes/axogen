import * as z from "zod";
import {
    type envTargetSchema,
    jsonTargetSchema,
    targetSchema,
    templateTargetSchema,
    tomlTargetSchema,
    yamlTargetSchema,
} from "./targets.ts";
import {type AnyCommand, commandSchema} from "./commands.ts";

export * from "./targets.ts";
export * from "./commands.ts";

// Main config schema
export const axogenConfigSchema = z
    .object({
        watch: z.array(z.string()).optional(),
        targets: z.record(z.string(), targetSchema).optional(),
        commands: z.record(z.string(), commandSchema).optional(),
    })
    .strict();

// Schema for direct variables input
export const variablesSchema = z.record(z.string(), z.unknown());

// Type exports (inferred from schemas)
export type EnvTarget = z.infer<typeof envTargetSchema>;
export type JsonTarget = z.infer<typeof jsonTargetSchema>;
export type YamlTarget = z.infer<typeof yamlTargetSchema>;
export type TomlTarget = z.infer<typeof tomlTargetSchema>;
export type TemplateTarget = z.infer<typeof templateTargetSchema>;
export type Target = z.infer<typeof targetSchema>;

export type AxogenConfig = z.infer<typeof axogenConfigSchema>;
export type Variables = z.infer<typeof variablesSchema>;
export type ConfigFunction = () =>
    | AxogenConfig
    | Variables
    | Promise<AxogenConfig | Variables>;
export type ConfigInput = AxogenConfig | Variables | ConfigFunction;

// Helper function to detect if input is direct variables
export function isVariablesInput(input: unknown): input is Variables {
    if (!input || typeof input !== "object") return false;

    // If it has any of the AxogenConfig keys, it's not a variables input
    const axogenKeys = ["watch", "targets", "commands"];
    const inputKeys = Object.keys(input);

    return !axogenKeys.some((key) => inputKeys.includes(key));
}

// Helper function to convert variables input to full config
export function variablesToConfig(variables: Variables): AxogenConfig {
    return {
        targets: {
            env: {
                path: ".env",
                type: "env",
                variables,
            },
        },
    };
}

// Helper function to normalize any config input to AxogenConfig
export async function normalizeConfig(
    input: ConfigInput
): Promise<AxogenConfig> {
    if (typeof input === "function") {
        const result = input();
        if (result instanceof Promise) {
            return result.then((resolved) =>
                isVariablesInput(resolved)
                    ? variablesToConfig(resolved)
                    : resolved
            );
        }
        return isVariablesInput(result) ? variablesToConfig(result) : result;
    }

    return isVariablesInput(input) ? variablesToConfig(input) : input;
}

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
