import type {SchemaType, Targets} from "./targets.ts";
import type {AnyCommand} from "./commands.ts";
import type {ZodAxogenConfig} from "./zod_config.ts";

export interface AxogenConfig<
    TTargets extends Record<string, SchemaType> = Record<string, SchemaType>,
> {
    watch?: string[];
    targets?: Targets<TTargets>;
    commands?: Record<string, AnyCommand<TTargets>>;
}

export type Variables = Record<string, unknown>;
export type ConfigInput = Variables | AxogenConfig | ZodAxogenConfig;
