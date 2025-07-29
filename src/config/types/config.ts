import type {AnyTarget} from "./targets.ts";
import type {ZodAxogenConfig} from "./zod_config.ts";
import type {AnyCommand, TypeArgs, TypeOptions} from "./commands.ts";

export interface AxogenConfig<
    TTargets extends Record<string, AnyTarget> = Record<string, AnyTarget>,
> {
    watch?: string[];
    targets?: TTargets;
    commands?: Record<string, AnyCommand<TypeOptions, TypeArgs, TTargets>>;
}

export type Variables = Record<string, unknown>;
export type ConfigInput = Variables | AxogenConfig | ZodAxogenConfig;
