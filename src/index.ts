// Main package exports
import type {AxogenConfig} from "./types";

/**
 * Define an axogen configuration with full TypeScript support and runtime validation
 */
export function defineConfig<T extends AxogenConfig>(
    config: T | (() => T | Promise<T>)
): T | (() => T | Promise<T>) {
    return config;
}

// Re-export all types for user convenience
export type {
    AxogenConfig,
    ConfigInput,
    CommandContext,
    CommandFunction,
    Target,
    Command,
    CommandDefinition,
    ExecutableCommandDefinition,
    ParentCommandDefinition,
    CommandOption,
    CommandArgument,
    EnvTarget,
    JsonTarget,
    YamlTarget,
    TomlTarget,
    TemplateTarget,
    EnvSchema,
    ParsedEnv,
    EnvConfig,
} from "./types";

// Export Zod schemas for advanced users who want to extend or customize validation
export {
    axogenConfigSchema,
    targetSchema,
    commandSchema,
    envTargetSchema,
    jsonTargetSchema,
    yamlTargetSchema,
    tomlTargetSchema,
    templateTargetSchema,
    validateTarget,
    validateCommand,
} from "./types/config";

// Export utilities that users might want
export {loadConfig} from "./core/config";

// Export env utilities
export {createTypedEnv} from "./env/typed";

// Re-export Zod for convenience (users don't need to install it separately if they only use basic features)
export {z} from "zod";
