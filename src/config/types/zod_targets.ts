/**
 * Where targets.ts is for DX, this file is for Zod validation.
 * It defines the actual Zod schemas for the targets and validates them.
 * It is used to ensure that the targets are correctly defined and can be
 * used in the Axogen config.
 */

import * as z from "zod";
import {
    type Json5TargetOptions,
    type JsonTargetOptions,
    type JsoncTargetOptions,
    type HjsonTargetOptions,
    type YamlTargetOptions,
    type IniTargetOptions,
    type PropertiesTargetOptions,
    type XmlTargetOptions,
    type CsvTargetOptions,
    templateTargetEngines,
} from "./targets.ts";

const baseTargetSchema = z.object({
    path: z.string().describe("The output path for the target"),
    schema: z
        .custom<z.ZodType>((val) => {
            return (
                val &&
                typeof val === "object" &&
                ("_def" in val || "_zod" in val)
            );
        })
        .describe("The Schema to validate the variables against")
        .optional(),
    generate_meta: z
        .boolean()
        .describe("Whether to generate metadata for the target")
        .default(false),
    condition: z
        .boolean()
        .describe("Condition to determine if the target should be generated")
        .default(true),
});

export const jsonTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("json")
        .describe("The type of the target, in this case JSON"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<JsonTargetOptions>(),
});

export const json5TargetSchema = baseTargetSchema.extend({
    type: z
        .literal("json5")
        .describe("The type of the target, in this case JSON5"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<Json5TargetOptions>(),
});

export const jsoncTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("jsonc")
        .describe("The type of the target, in this case JSONC"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<JsoncTargetOptions>(),
});

export const hjsonTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("hjson")
        .describe("The type of the target, in this case HJSON"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<HjsonTargetOptions>(),
});

export const yamlTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("yaml")
        .describe("The type of the target, in this case YAML"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<YamlTargetOptions>(),
});

export const tomlTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("toml")
        .describe("The type of the target, in this case TOML"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
});

export const iniTargetSchema = baseTargetSchema.extend({
    type: z.literal("ini").describe("The type of the target, in this case INI"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<IniTargetOptions>(),
});

export const propertiesTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("properties")
        .describe("The type of the target, in this case Properties"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<PropertiesTargetOptions>(),
});

export const envTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("env")
        .describe("The type of the target, in this case Environment Variables"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
});

export const xmlTargetSchema = baseTargetSchema.extend({
    type: z.literal("xml").describe("The type of the target, in this case XML"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
    options: z.custom<XmlTargetOptions>(),
});

export const csvTargetSchema = baseTargetSchema.extend({
    type: z.literal("csv").describe("The type of the target, in this case CSV"),
    variables: z
        .array(z.record(z.string(), z.any()))
        .describe("Variables to be used in the target"),
    options: z.custom<CsvTargetOptions>(),
});

export const csonTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("cson")
        .describe("The type of the target, in this case CSON"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
});

export const templateTargetSchema = baseTargetSchema.extend({
    type: z
        .literal("template")
        .describe("The type of the target, in this case Template"),
    engine: z
        .enum(templateTargetEngines)
        .describe("The template engine to use"),
    template: z.string().describe("The template string or file path"),
    variables: z
        .record(z.string(), z.any())
        .describe("Variables to be used in the target"),
});

export const anyTargetSchema = z
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

export const allTargetsSchema = z
    .record(z.string(), anyTargetSchema)
    .describe(
        "A record of targets where the key is the target name and the value is the target definition"
    );

// ---- Exported Types ----

export type ZodAnyTarget = z.infer<typeof anyTargetSchema>;
export type ZodAllTargets = z.infer<typeof allTargetsSchema>;

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
