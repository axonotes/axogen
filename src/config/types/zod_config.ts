import * as z from "zod";
import {targetsSchema} from "./zod_targets.ts";
import {commandSchema} from "./zod_commands.ts";

export const axogenConfigSchema = z.object({
    _type: z.literal("AxogenConfig").optional(),
    watch: z.array(z.string()).optional(),
    targets: targetsSchema,
    commands: z.record(z.string(), commandSchema).optional(),
});

export type ZodAxogenConfig = z.infer<typeof axogenConfigSchema>;
