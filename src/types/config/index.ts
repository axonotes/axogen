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

// Type exports (inferred from schemas)
export type EnvTarget = z.infer<typeof envTargetSchema>;
export type JsonTarget = z.infer<typeof jsonTargetSchema>;
export type YamlTarget = z.infer<typeof yamlTargetSchema>;
export type TomlTarget = z.infer<typeof tomlTargetSchema>;
export type TemplateTarget = z.infer<typeof templateTargetSchema>;
export type Target = z.infer<typeof targetSchema>;

export type AxogenConfig = z.infer<typeof axogenConfigSchema>;
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
