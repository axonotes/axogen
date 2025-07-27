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
    Target,
    EnvTarget,
    JsonTarget,
    YamlTarget,
    TomlTarget,
    TemplateTarget,
    EnvSchema,
    ParsedEnv,
    EnvConfig,
    AnyCommand,
    StringCommand,
    SchemaCommand,
    CommandGroup,
    FunctionCommand,
    CommandContext,
    SimpleCommandContext,
    CommandGlobalContext,
    SchemaCommandFunction,
    SimpleCommandFunction,
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

// Export command helper functions
export {
    stringCommand,
    defineCommand,
    commandGroup,
    functionCommand,
    command,
    cmd,
    group,
    exec,
    executeCommand,
    liveExec,
} from "./cli-helpers";

// Export utilities that users might want
export {loadConfig} from "./core/config";

// Export env utilities
export {loadEnv, createTypedEnv} from "./env/typed";

// Export unsafe
export {unsafe} from "./utils/secrets";

// Re-export loaders for convenience
export * from "./loaders";

// Re-export Zod for convenience (users don't need to install it separately if they only use basic features)
export {z} from "zod";
