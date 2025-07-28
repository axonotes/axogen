import * as z from "zod";
import type {
    CsvTargetOptions,
    HjsonTargetOptions,
    IniTargetOptions,
    PropertiesTargetOptions,
    XmlTargetOptions,
    YamlTargetOptions,
} from "./targets.ts";

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

export const jsonTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("json"),
        options: z
            .object({
                replacer: z
                    .union([
                        z.array(z.union([z.string(), z.number()])),
                        z.null(),
                    ])
                    .optional(),
                space: z.union([z.string(), z.number()]).optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export const json5TargetSchema = baseTargetSchema
    .extend({
        type: z.literal("json5"),
        options: z
            .object({
                space: z.union([z.string(), z.number(), z.null()]).optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export const jsoncTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("jsonc"),
        options: z
            .object({
                replacer: z
                    .union([
                        z.array(z.union([z.string(), z.number()])),
                        z.null(),
                    ])
                    .optional(),
                space: z.union([z.string(), z.number()]).optional(),
            })
            .strict()
            .optional(),
    })
    .strict();

export const hjsonTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("hjson"),
        options: z.custom<HjsonTargetOptions>().optional(),
    })
    .strict();

export const yamlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("yaml"),
        options: z.custom<YamlTargetOptions>().optional(),
    })
    .strict();

export const tomlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("toml"),
    })
    .strict();

export const iniTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("ini"),
        options: z.custom<IniTargetOptions>().optional(),
    })
    .strict();

export const propertiesTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("properties"),
        options: z.custom<PropertiesTargetOptions>().optional(),
    })
    .strict();

export const envTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("env"),
    })
    .strict();

export const xmlTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("xml"),
        options: z.custom<XmlTargetOptions>().optional(),
    })
    .strict();

export const csvTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("csv"),
        options: z.custom<CsvTargetOptions>().optional(),
    })
    .strict();

export const csonTargetSchema = baseTargetSchema
    .extend({
        type: z.literal("cson"),
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
        jsonTargetSchema,
        json5TargetSchema,
        jsoncTargetSchema,
        hjsonTargetSchema,
        yamlTargetSchema,
        tomlTargetSchema,
        iniTargetSchema,
        propertiesTargetSchema,
        envTargetSchema,
        xmlTargetSchema,
        csvTargetSchema,
        csonTargetSchema,
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

export type ZodJsonTarget = z.infer<typeof jsonTargetSchema>;
export type ZodJson5Target = z.infer<typeof json5TargetSchema>;
export type ZodJsoncTarget = z.infer<typeof jsoncTargetSchema>;
export type ZodHjsonTarget = z.infer<typeof hjsonTargetSchema>;
export type ZodYamlTarget = z.infer<typeof yamlTargetSchema>;
export type ZodTomlTarget = z.infer<typeof tomlTargetSchema>;
export type ZodIniTarget = z.infer<typeof iniTargetSchema>;
export type ZodPropertiesTarget = z.infer<typeof propertiesTargetSchema>;
export type ZodEnvTarget = z.infer<typeof envTargetSchema>;
export type ZodXmlTarget = z.infer<typeof xmlTargetSchema>;
export type ZodCsvTarget = z.infer<typeof csvTargetSchema>;
export type ZodCsonTarget = z.infer<typeof csonTargetSchema>;
export type ZodTemplateTarget = z.infer<typeof templateTargetSchema>;

export type ZodTarget = z.infer<typeof targetSchema>;
export type ZodTargets = z.infer<typeof targetsSchema>;
