import * as z from "zod";
import Hjson from "hjson";
import ini from "ini";
import * as yaml from "js-yaml";
import type {UnparseConfig} from "papaparse";
import type {XmlBuilderOptions} from "fast-xml-parser";

export type SchemaType = z.ZodType | Record<string, any>;

/**
 * Supported file extensions for target generation
 */
export const SupportedTargetTypes = [
    // Core formats
    "json",
    "json5",
    "jsonc",
    "hjson",

    // Configuration formats
    "yaml",
    "toml",
    "ini",
    "properties",
    "env",

    // Structured data
    "xml",
    "csv",

    // Alternative formats
    "cson",

    // Template formats
    "template",
];

export type SupportedTargetTypesType = (typeof SupportedTargetTypes)[number];

/**
 * Base interface for all target schemas
 * @template TSchema - The Zod schema type for the target
 * @property {string} path - The file path where the target will be generated
 * @property {TSchema} schema - The Zod schema defining the structure of the target
 * @property {z.infer<TSchema>} variables - The inferred type of the schema, representing the variables to be used in the target
 * @property {boolean} [generate_meta] - Optional flag to indicate whether to generate metadata for the target. Defaults to false. (ignored for csv)
 */
interface BaseTargetSchema<TSchema extends z.ZodType> {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
}

export type JsonTargetOptions = {
    replacer?: (number | string)[] | null;
    space?: string | number;
};
export interface JsonTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "json";
    options?: JsonTargetOptions;
}

export type Json5TargetOptions = {
    space?: string | number | null;
};
export interface Json5Target<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "json5";
    options?: Json5TargetOptions;
}

export interface JsoncTargetOptions {
    replacer?: (number | string)[] | null;
    space?: string | number;
}
export interface JsoncTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "jsonc";
    options?: JsoncTargetOptions;
}

export type HjsonTargetOptions = Hjson.SerializeOptions;
export interface HjsonTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "hjson";
    options?: Hjson.SerializeOptions;
}

export type YamlTargetOptions = yaml.DumpOptions;
export interface YamlTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "yaml";
    options?: YamlTargetOptions;
}

export interface TomlTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "toml";
}

export type IniTargetOptions = ini.EncodeOptions;
export interface IniTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "ini";
    options?: IniTargetOptions;
}

export type PropertiesTargetOptions = {
    align?: boolean;
    sort?: boolean;
    whitespace?: boolean;
    platform?: string;
};
export interface PropertiesTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "properties";
    options?: PropertiesTargetOptions;
}

export interface EnvTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "env";
}

export type XmlTargetOptions = XmlBuilderOptions;
export interface XmlTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "xml";
    config?: XmlBuilderOptions;
}

export type CsvTargetOptions = UnparseConfig;
export interface CsvTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "csv";
    options?: CsvTargetOptions;
}

export interface CsonTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "cson";
}

export type TemplateTargetEngine = "nunjucks" | "handlebars" | "mustache";
export interface TemplateTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "template";
    template: string;
    engine?: TemplateTargetEngine;
}

/**
 * Base interface for all target schemas without a Zod schema
 * @property {string} path - The file path where the target will be generated
 * @property {Record<string, any>} variables - The variables to be used in the target
 * @property {boolean} [generate_meta] - Optional flag to indicate whether to generate metadata for the target. Defaults to false. (ignored for csv)
 */
interface BaseTargetNoSchema {
    path: string;
    variables: Record<string, any>;
    generate_meta?: boolean;
}

export interface JsonTargetNoSchema extends BaseTargetNoSchema {
    type: "json";
    options?: JsonTargetOptions;
}

export interface Json5TargetNoSchema extends BaseTargetNoSchema {
    type: "json5";
    options?: Json5TargetOptions;
}

export interface JsoncTargetNoSchema extends BaseTargetNoSchema {
    type: "jsonc";
    options?: JsoncTargetOptions;
}

export interface HjsonTargetNoSchema extends BaseTargetNoSchema {
    type: "hjson";
    options?: HjsonTargetOptions;
}

export interface YamlTargetNoSchema extends BaseTargetNoSchema {
    type: "yaml";
    options?: YamlTargetOptions;
}

export interface TomlTargetNoSchema extends BaseTargetNoSchema {
    type: "toml";
}

export interface IniTargetNoSchema extends BaseTargetNoSchema {
    type: "ini";
    options?: IniTargetOptions;
}

export interface PropertiesTargetNoSchema extends BaseTargetNoSchema {
    type: "properties";
    options?: PropertiesTargetOptions;
}

export interface EnvTargetNoSchema extends BaseTargetNoSchema {
    type: "env";
}

export interface XmlTargetNoSchema extends BaseTargetNoSchema {
    type: "xml";
    config?: XmlTargetOptions;
}

export interface CsvTargetNoSchema extends BaseTargetNoSchema {
    type: "csv";
    options?: CsvTargetOptions;
}

export interface CsonTargetNoSchema extends BaseTargetNoSchema {
    type: "cson";
}

export interface TemplateTargetNoSchema extends BaseTargetNoSchema {
    type: "template";
    template: string;
    engine?: TemplateTargetEngine;
}

export type Target<TSchema extends SchemaType = Record<string, any>> =
    TSchema extends z.ZodType
        ?
              | JsonTarget<TSchema>
              | Json5Target<TSchema>
              | JsoncTarget<TSchema>
              | HjsonTarget<TSchema>
              | YamlTarget<TSchema>
              | TomlTarget<TSchema>
              | IniTarget<TSchema>
              | PropertiesTarget<TSchema>
              | EnvTarget<TSchema>
              | XmlTarget<TSchema>
              | CsvTarget<TSchema>
              | CsonTarget<TSchema>
              | TemplateTarget<TSchema>
        : TSchema extends Record<string, any>
          ?
                | JsonTargetNoSchema
                | Json5TargetNoSchema
                | JsoncTargetNoSchema
                | HjsonTargetNoSchema
                | YamlTargetNoSchema
                | TomlTargetNoSchema
                | IniTargetNoSchema
                | PropertiesTargetNoSchema
                | EnvTargetNoSchema
                | XmlTargetNoSchema
                | CsvTargetNoSchema
                | CsonTargetNoSchema
                | TemplateTargetNoSchema
          : never;

export type Targets<T extends Record<string, SchemaType>> = {
    [K in keyof T]: Target<T[K]>;
};
