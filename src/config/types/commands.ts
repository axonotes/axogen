import * as z from "zod";
import type {AxogenConfig} from "./config.ts";
import type {SchemaType} from "./targets.ts";

export type TypeOptions = Record<string, z.ZodType>;
export type TypeArgs = Record<string, z.ZodType>;
export type TypeTargets = Record<string, SchemaType>;

// Context Types
export interface CommandGlobalContext {
    cwd: string;
    process_env: Record<string, string | undefined>;
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
    global: CommandGlobalContext;
    config: AxogenConfig<TTargets>;
}

export interface SimpleCommandContext<
    TTargets extends TypeTargets = TypeTargets,
> {
    global: CommandGlobalContext;
    config: AxogenConfig<TTargets>;
}

// Command Function Types
export type SimpleCommandFunction<TTargets extends TypeTargets = TypeTargets> =
    (context: SimpleCommandContext<TTargets>) => Promise<void> | void;

export type SchemaCommandFunction<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> = (
    context: CommandContext<TOptions, TArgs, TTargets>
) => Promise<void> | void;

// Command Definition Types
export interface StringCommand {
    _type: "string";
    command: string;
    help?: string;
}

export interface SchemaCommand<
    TOptions extends TypeOptions = TypeOptions,
    TArgs extends TypeArgs = TypeArgs,
    TTargets extends TypeTargets = TypeTargets,
> {
    _type: "schema";
    help?: string;
    options?: TOptions;
    args?: TArgs;
    exec: SchemaCommandFunction<TOptions, TArgs, TTargets>;
}

export interface FunctionCommand<TTargets extends TypeTargets = TypeTargets> {
    _type: "function";
    help?: string;
    exec: SimpleCommandFunction<TTargets>;
}

export interface ParallelCommand<TTargets extends TypeTargets = TypeTargets> {
    _type: "parallel";
    help?: string;
    commands: AnyCommand<TTargets>[];
}

export interface SequentialCommand<TTargets extends TypeTargets = TypeTargets> {
    _type: "sequential";
    help?: string;
    commands: AnyCommand<TTargets>[];
}

export interface CommandGroup<TTargets extends TypeTargets = TypeTargets> {
    _type: "group";
    help?: string;
    commands: Record<string, AnyCommand<TTargets>>;
}

export type AnyCommand<TTargets extends TypeTargets = TypeTargets> =
    | string
    | StringCommand
    | SimpleCommandFunction<TTargets>
    | SchemaCommand<TypeOptions, TypeArgs, TTargets>
    | SchemaCommand<any, any, TTargets>
    | FunctionCommand<TTargets>
    | ParallelCommand<TTargets>
    | SequentialCommand<TTargets>
    | CommandGroup<TTargets>;
