// Main package exports
import type {AxogenConfig, ConfigInput} from "./types";

/**
 * Define an axogen configuration
 *
 * @param config The configuration object or function
 * @returns The configuration object
 */
export function defineConfig(config: AxogenConfig): AxogenConfig;
export function defineConfig(config: () => AxogenConfig): () => AxogenConfig;
export function defineConfig(
    config: () => Promise<AxogenConfig>
): () => Promise<AxogenConfig>;
export function defineConfig(config: ConfigInput): ConfigInput {
    return config;
}

// Re-export types for user convenience
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
} from "./types";

// Export utilities that users might want
export {loadConfig} from "./core/config.js";
