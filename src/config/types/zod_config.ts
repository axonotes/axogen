import * as z from "zod";
import {allTargetsSchema} from "./zod_targets.ts";
import {anyCommandSchema} from "./zod_commands.ts";

export const axogenConfigSchema = z.object({
    type: z.literal("AxogenConfig").optional(),
    watch: z.array(z.string()).optional(),
    targets: allTargetsSchema.optional(),
    commands: z.record(z.string(), anyCommandSchema).optional(),
});

export type ZodAxogenConfig = z.infer<typeof axogenConfigSchema>;
