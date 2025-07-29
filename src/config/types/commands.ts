/**
 * This file is solely for the UX of defining commands in Axogen.
 * It is not used for Zod validation. (similar to targets.ts)
 */

import * as z from "zod";
import type {AnyTarget} from "./targets.ts";
import type {AxogenConfig} from "./config.ts";

export type TypeOptions = Record<string, z.ZodType>;
export type TypeArgs = Record<string, z.ZodType>;
export type TypeTargets = Record<string, AnyTarget>;

// ---- Command Contexts ----

export interface GlobalCommandContext {
    cwd: string;
    process_env: Record<string, any>;
    verbose: boolean;
}

export interface CommandContext<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> {
    options: {
        [K in keyof TOptions]: z.infer<TOptions[K]>;
    };
    args: {
        [K in keyof TArgs]: z.infer<TArgs[K]>;
    };
    global: GlobalCommandContext;
    config: AxogenConfig<TTargets>;
}

export interface SimpleCommandContext<
    TTargets extends TypeTargets = TypeTargets,
> {
    global: GlobalCommandContext;
    config: AxogenConfig<TTargets>;
}

// ---- Command Functions ----

/**
 * THIS IS ONLY FOR ZOD VALIDATION.
 * Dont use this export in your code.
 */
export type CommandFunction<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> = (
    context: CommandContext<TOptions, TArgs, TTargets>
) => void | Promise<void>;

/**
 * THIS IS ONLY FOR ZOD VALIDATION.
 * Dont use this export in your code.
 */
export type SimpleCommandFunction<TTargets extends TypeTargets = TypeTargets> =
    (context: SimpleCommandContext<TTargets>) => void | Promise<void>;

// ---- Command Definitions ----

interface CommandDefinition<TType extends string> {
    type: TType;
    help?: string;
}

export interface StringCommandDefinition extends CommandDefinition<"string"> {
    command: string;
}

export interface GroupCommandDefinition<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> extends CommandDefinition<"group"> {
    commands: Record<string, AnyCommand<TOptions, TArgs, TTargets>>;
}

export interface AdvancedCommandDefinition<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> extends CommandDefinition<"advanced"> {
    options?: TOptions;
    args?: TArgs;
    exec: CommandFunction<TOptions, TArgs, TTargets>;
}

export type AnyCommand<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> =
    | string
    | SimpleCommandFunction<TTargets>
    | StringCommandDefinition
    | GroupCommandDefinition<TOptions, TArgs, TTargets>
    | AdvancedCommandDefinition<TOptions, TArgs, TTargets>
    | AdvancedCommandDefinition<any, any, TTargets>;

// ---- Factory Functions ----

export function cmd(config: {
    command: string;
    help?: string;
}): StringCommandDefinition;

export function cmd<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
>(config: {
    exec: CommandFunction<TOptions, TArgs, TTargets>;
    options?: TOptions;
    args?: TArgs;
    help?: string;
}): AdvancedCommandDefinition<TOptions, TArgs, TTargets>;

export function cmd<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
>(
    config:
        | {command: string; help?: string}
        | {
              exec: CommandFunction<TOptions, TArgs, TTargets>;
              options?: TOptions;
              args?: TArgs;
              help?: string;
          }
): AnyCommand<TOptions, TArgs, TTargets> {
    // Case 1: String command
    if ("command" in config) {
        return {
            type: "string",
            command: config.command,
            help: config.help,
        };
    }

    // Case 2 Function commands
    if ("exec" in config) {
        return {
            type: "advanced",
            exec: config.exec as CommandFunction<TOptions, TArgs, TTargets>,
            options: config.options,
            args: config.args,
            help: config.help,
        };
    }

    // Should never reach here given the type constraints
    throw new Error("Invalid configuration object passed to cmd function");
}

export function group<
    TOptions extends TypeOptions,
    TArgs extends TypeArgs,
    TTargets extends TypeTargets,
>(config: {
    commands: Record<string, AnyCommand<TOptions, TArgs, TTargets>>;
    help?: string;
}): GroupCommandDefinition<TOptions, TArgs, TTargets> {
    return {
        type: "group",
        commands: config.commands,
        help: config.help,
    };
}
