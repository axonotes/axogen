// Core configuration types for axogen

export interface AxogenConfig {
    /** Files to watch for changes */
    watch?: string[];

    /** Target file generation configuration */
    targets?: Record<string, Target>;

    /** Command definitions */
    commands?: Record<string, Command>;
}

// Target Types
export interface BaseTarget {
    /** Path where the generated file should be written */
    path: string;
    /** Variables to include in the generated file */
    variables: Record<string, any>;
}

export interface EnvTarget extends BaseTarget {
    type: "env";
}

export interface JsonTarget extends BaseTarget {
    type: "json";
}

export interface YamlTarget extends BaseTarget {
    type: "yaml";
}

export interface TomlTarget extends BaseTarget {
    type: "toml";
}

export interface TemplateTarget extends BaseTarget {
    type: "template";
    /** Path to the template file */
    template: string;
}

export type Target =
    | EnvTarget
    | JsonTarget
    | YamlTarget
    | TomlTarget
    | TemplateTarget;

// Command Types
export interface CommandContext<
    TOptions extends Record<string, any> = Record<string, any>,
    TArgs extends readonly any[] = readonly any[],
> {
    /** Parsed command options (typed based on command definition) */
    options: TOptions;
    /** Parsed command arguments (typed based on command definition) */
    args: TArgs;
    /** Access to the full configuration */
    config: AxogenConfig;
}

export type CommandFunction<
    TOptions extends Record<string, any> = Record<string, any>,
    TArgs extends readonly any[] = readonly any[],
> = (context: CommandContext<TOptions, TArgs>) => Promise<void> | void;

export interface CommandOption {
    /** Option flags (e.g., '-f, --file <path>' or '-v, --verbose') */
    flags: string;
    /** Help description for this option */
    description?: string;
    /** Default value if not provided */
    default?: any;
    /** Valid choices for this option */
    choices?: string[];
    /** Whether this is a required option */
    required?: boolean;
    /** Custom parser function */
    parser?: (value: string, previous?: any) => any;
    /** Environment variable to check for value */
    env?: string;
}

export interface CommandArgument {
    /** Argument syntax (e.g., '<name>', '[name]', '<files...>') */
    syntax: string;
    /** Help description for this argument */
    description?: string;
    /** Default value for optional arguments */
    default?: any;
    /** Custom parser function */
    parser?: (value: string) => any;
}

// Command Definitions - Either executable OR parent with subcommands
export interface ExecutableCommandDefinition {
    /** Help text for this command */
    help?: string;
    /** Command options (flags) */
    options?: CommandOption[];
    /** Command arguments (positional) */
    arguments?: CommandArgument[];
    /** Command execution */
    exec: CommandFunction | string;
    /** Cannot have subcommands if executable */
    subcommands?: never;
}

export interface ParentCommandDefinition {
    /** Help text for this command */
    help?: string;
    /** Nested subcommands */
    subcommands: Record<string, Command>;
    /** Cannot execute if it has subcommands */
    exec?: never;
    /** Parent commands don't have their own options/arguments */
    options?: never;
    arguments?: never;
}

export type CommandDefinition =
    | ExecutableCommandDefinition
    | ParentCommandDefinition;

export type Command = string | CommandFunction | CommandDefinition;

// Helper function type for defineConfig
export type ConfigFunction = () => AxogenConfig | Promise<AxogenConfig>;
export type ConfigInput = AxogenConfig | ConfigFunction;
