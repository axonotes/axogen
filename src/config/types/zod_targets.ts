import * as z from "zod";

const baseTargetSchema = z.object({
    path: z
        .string({
            error: "Target path must be a string",
        })
        .describe("Target file path"),
    schema: z
        .custom<z.ZodType>((val) => {
            return (
                val &&
                typeof val === "object" &&
                ("_zod" in val || "_def" in val)
            );
        })
        .optional(),
    variables: z.record(z.string(), z.any()).optional().default({}),
    generate_meta: z.boolean().default(false).optional(),
});

export const envTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("env"),
    })
    .strict();

export const jsonTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("json"),
        indent: z.union([z.number(), z.string()]).default(2).optional(),
    })
    .strict();

export const yamlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("yaml"),
        options: z
            .object({
                indent: z.number().optional(),
                lineWidth: z.number().optional(),
                noRefs: z.boolean().optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export const tomlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("toml"),
    })
    .strict();

export const templateTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("template"),
        template: z.string({
            message: "Template path must be a string",
        }),
        engine: z
            .enum(["nunjucks", "handlebars", "mustache"])
            .default("nunjucks")
            .optional(),
    })
    .strict();

// Union of all target types
export const targetSchema = z
    .discriminatedUnion("type", [
        envTargetSchema,
        jsonTargetSchema,
        yamlTargetSchema,
        tomlTargetSchema,
        templateTargetSchema,
    ])
    .check((ctx) => {
        if (ctx.value.schema && ctx.value.variables) {
            const result = ctx.value.schema.safeParse(ctx.value.variables);
            if (!result.success) {
                result.error.issues.forEach((issue) => {
                    ctx.issues.push({
                        code: "custom",
                        message: issue.message,
                        path: ["variables", ...issue.path],
                        input: ctx.value,
                    });
                });
            }
        }
    });

export const targetsSchema = z.record(z.string(), targetSchema).optional();

export type ZodEnvTarget = z.infer<typeof envTargetSchema>;
export type ZodJsonTarget = z.infer<typeof jsonTargetSchema>;
export type ZodYamlTarget = z.infer<typeof yamlTargetSchema>;
export type ZodTomlTarget = z.infer<typeof tomlTargetSchema>;
export type ZodTemplateTarget = z.infer<typeof templateTargetSchema>;

export type ZodTarget = z.infer<typeof targetSchema>;
export type ZodTargets = z.infer<typeof targetsSchema>;
