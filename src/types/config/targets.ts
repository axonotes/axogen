import * as z from "zod";

// Base schemas
const baseTargetSchema = z.object({
    path: z.string({
        message: "Target path must be a string",
    }),
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

// Target schemas - with strict validation
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
