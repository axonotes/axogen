/**
 * This file is solely for the UX of defining targets in Axogen.
 * It provides a set of types and factory functions to create target definitions
 * for various data formats and configurations.
 * It is not used to verify the structure of the config file.
 * This is where zod_targets.ts comes in.
 * It only exports some types and the factory functions.
 * Target Types for usage in this package should be used from
 * the zod_targets.ts file.
 */

import * as z from "zod";
import Hjson from "hjson";
import * as js_ini from "ini";
import * as js_yaml from "js-yaml";
import type {UnparseConfig} from "papaparse";
import type {XmlBuilderOptions} from "fast-xml-parser";

// ---- Target Options ----

/**
 * Options for JSON target generation
 */
export type JsonTargetOptions = {
    replacer?: (number | string)[] | null;
    space?: string | number;
};

/**
 * Options for JSON5 target generation
 */
export type Json5TargetOptions = {
    space?: string | number | null;
};

/**
 * Options for JSONC target generation
 * JSONC is JSON with comments, so it uses the same options as JSON
 */
export interface JsoncTargetOptions {
    replacer?: (number | string)[] | null;
    space?: string | number;
}

/**
 * Options for HJSON target generation
 */
export type HjsonTargetOptions = Hjson.SerializeOptions;

/**
 * Options for YAML target generation
 */
export type YamlTargetOptions = js_yaml.DumpOptions;

/**
 * Options for INI target generation
 */
export type IniTargetOptions = js_ini.EncodeOptions;

/**
 * Options for Properties target generation
 */
export type PropertiesTargetOptions = {
    align?: boolean;
    sort?: boolean;
    whitespace?: boolean;
    platform?: string;
};

/**
 * Options for XML target generation
 */
export type XmlTargetOptions = XmlBuilderOptions;

/**
 * Options for CSV target generation
 */
export type CsvTargetOptions = UnparseConfig;

/**
 * Template target engine types
 * - "nunjucks": Nunjucks templating engine
 * - "handlebars": Handlebars templating engine
 * - "mustache": Mustache templating engine
 */
export const templateTargetEngines = [
    "nunjucks",
    "handlebars",
    "mustache",
] as const;
export type TemplateTargetEngine = (typeof templateTargetEngines)[number];

// ---- Target Definitions ----

type InferVariablesType<TSchema> =
    TSchema extends z.ZodType<infer T> ? T : TSchema;

type ValidateSchemaVariables<TSchema, TVariables> =
    TSchema extends z.ZodType<infer Expected>
        ? TVariables extends Expected
            ? TVariables
            : never
        : TVariables;

interface BaseTargetDefinition<TType extends string, TSchema, TVariables> {
    type: TType;
    path: string;
    schema?: TSchema;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
}

export interface JsonTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "json",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: JsonTargetOptions;
}

export interface Json5TargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "json5",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: Json5TargetOptions;
}

export interface JsoncTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "jsonc",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: JsoncTargetOptions;
}

export interface HjsonTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "hjson",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: HjsonTargetOptions;
}

export interface YamlTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "yaml",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: YamlTargetOptions;
}

export interface TomlTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "toml",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

export interface IniTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "ini",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: IniTargetOptions;
}

export interface PropertiesTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "properties",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: PropertiesTargetOptions;
}

export interface EnvTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "env",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

export interface XmlTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "xml",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: XmlTargetOptions;
}

export interface CsvTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "csv",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    options?: CsvTargetOptions;
}

export interface CsonTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "cson",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

export interface TemplateTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "template",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    engine: TemplateTargetEngine;
    template: string;
}

export interface TargetTypeMap {
    json: JsonTargetDefinition;
    json5: Json5TargetDefinition;
    jsonc: JsoncTargetDefinition;
    hjson: HjsonTargetDefinition;
    yaml: YamlTargetDefinition;
    toml: TomlTargetDefinition;
    ini: IniTargetDefinition;
    properties: PropertiesTargetDefinition;
    env: EnvTargetDefinition;
    xml: XmlTargetDefinition;
    csv: CsvTargetDefinition;
    cson: CsonTargetDefinition;
    template: TemplateTargetDefinition;
}

export type AnyTarget = TargetTypeMap[keyof TargetTypeMap];

// Factory functions for better DX
export function json<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: JsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): JsonTargetDefinition<TSchema, z.infer<TSchema>>;

export function json<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: JsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): JsonTargetDefinition<TVariables, TVariables>;

export function json(config: any): any {
    return {type: "json", ...config};
}

export function json5<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: Json5TargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): Json5TargetDefinition<TSchema, z.infer<TSchema>>;

export function json5<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: Json5TargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): Json5TargetDefinition<TVariables, TVariables>;

export function json5(config: any): any {
    return {type: "json5", ...config};
}

export function jsonc<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: JsoncTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): JsoncTargetDefinition<TSchema, z.infer<TSchema>>;

export function jsonc<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: JsoncTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): JsoncTargetDefinition<TVariables, TVariables>;

export function jsonc(config: any): any {
    return {type: "jsonc", ...config};
}

export function hjson<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: HjsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): HjsonTargetDefinition<TSchema, z.infer<TSchema>>;

export function hjson<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: HjsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): HjsonTargetDefinition<TVariables, TVariables>;

export function hjson(config: any): any {
    return {type: "hjson", ...config};
}

export function yaml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: YamlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): YamlTargetDefinition<TSchema, z.infer<TSchema>>;

export function yaml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: YamlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): YamlTargetDefinition<TVariables, TVariables>;

export function yaml(config: any): any {
    return {type: "yaml", ...config};
}

export function toml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
}): TomlTargetDefinition<TSchema, z.infer<TSchema>>;

export function toml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
}): TomlTargetDefinition<TVariables, TVariables>;

export function toml(config: any): any {
    return {type: "toml", ...config};
}

export function ini<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: IniTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): IniTargetDefinition<TSchema, z.infer<TSchema>>;

export function ini<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: IniTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): IniTargetDefinition<TVariables, TVariables>;

export function ini(config: any): any {
    return {type: "ini", ...config};
}

export function properties<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: PropertiesTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): PropertiesTargetDefinition<TSchema, z.infer<TSchema>>;

export function properties<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: PropertiesTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): PropertiesTargetDefinition<TVariables, TVariables>;

export function properties(config: any): any {
    return {type: "properties", ...config};
}

export function env<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
}): EnvTargetDefinition<TSchema, z.infer<TSchema>>;

export function env<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
}): EnvTargetDefinition<TVariables, TVariables>;

export function env(config: any): any {
    return {type: "env", ...config};
}

export function xml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: XmlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): XmlTargetDefinition<TSchema, z.infer<TSchema>>;

export function xml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: XmlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): XmlTargetDefinition<TVariables, TVariables>;

export function xml(config: any): any {
    return {type: "xml", ...config};
}

export function csv<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: CsvTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): CsvTargetDefinition<TSchema, z.infer<TSchema>>;

export function csv<TVariables extends Record<string, any>[]>(config: {
    path: string;
    variables: TVariables;
    options?: CsvTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
}): CsvTargetDefinition<TVariables, TVariables>;

export function csv(config: any): any {
    return {type: "csv", ...config};
}

export function cson<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
}): CsonTargetDefinition<TSchema, z.infer<TSchema>>;

export function cson<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
}): CsonTargetDefinition<TVariables, TVariables>;

export function cson(config: any): any {
    return {type: "cson", ...config};
}

export function template<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    engine: TemplateTargetEngine;
    template: string;
    generate_meta?: boolean;
    condition?: boolean;
}): TemplateTargetDefinition<TSchema, z.infer<TSchema>>;

export function template<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    engine: TemplateTargetEngine;
    template: string;
    generate_meta?: boolean;
    condition?: boolean;
}): TemplateTargetDefinition<TVariables, TVariables>;

export function template(config: any): any {
    return {type: "template", ...config};
}
