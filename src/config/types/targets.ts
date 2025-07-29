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
 * Options for JSON target generation.
 * Uses standard JSON.stringify options for formatting control.
 */
export type JsonTargetOptions = {
    replacer?: (number | string)[] | null;
    space?: string | number;
};

/**
 * Options for JSON5 target generation.
 * JSON5 allows comments, trailing commas, and other relaxed JSON syntax.
 */
export type Json5TargetOptions = {
    space?: string | number | null;
};

/**
 * Options for JSONC target generation.
 * JSONC is JSON with comments, commonly used in VS Code configuration files.
 */
export interface JsoncTargetOptions {
    replacer?: (number | string)[] | null;
    space?: string | number;
}

/**
 * Options for HJSON target generation.
 * HJSON is a human-friendly JSON format with comments and relaxed syntax.
 * References Hjson.SerializeOptions from the hjson library.
 */
export type HjsonTargetOptions = Hjson.SerializeOptions;

/**
 * Options for YAML target generation.
 * References js-yaml DumpOptions for YAML serialization control.
 */
export type YamlTargetOptions = js_yaml.DumpOptions;

/**
 * Options for INI target generation.
 * References ini library EncodeOptions for INI file formatting.
 */
export type IniTargetOptions = js_ini.EncodeOptions;

/**
 * Options for Properties target generation.
 * Java-style properties file formatting options.
 */
export type PropertiesTargetOptions = {
    align?: boolean;
    sort?: boolean;
    whitespace?: boolean;
    platform?: string;
};

/**
 * Options for XML target generation.
 * References fast-xml-parser XmlBuilderOptions for XML formatting control.
 */
export type XmlTargetOptions = XmlBuilderOptions;

/**
 * Options for CSV target generation.
 * References papaparse UnparseConfig for CSV formatting and output control.
 */
export type CsvTargetOptions = UnparseConfig;

/**
 * Supported template engines for template target generation.
 */
export const templateTargetEngines = [
    "nunjucks",
    "handlebars",
    "mustache",
] as const;

/**
 * Union type of supported template engine names.
 */
export type TemplateTargetEngine = (typeof templateTargetEngines)[number];

// ---- Target Definitions ----

/**
 * Utility type to infer the TypeScript type from a Zod schema.
 */
type InferVariablesType<TSchema> =
    TSchema extends z.ZodType<infer T> ? T : TSchema;

/**
 * Utility type to validate that variables match the expected schema type.
 */
type ValidateSchemaVariables<TSchema, TVariables> =
    TSchema extends z.ZodType<infer Expected>
        ? TVariables extends Expected
            ? TVariables
            : never
        : TVariables;

/**
 * Base interface for all target definitions.
 * Provides common properties shared across all target types.
 */
interface BaseTargetDefinition<TType extends string, TSchema, TVariables> {
    /** The type of target format to generate */
    type: TType;
    /** Output file path where the target will be written */
    path: string;
    /** Optional Zod schema for validating variables */
    schema?: TSchema;
    /** Variables to use in target generation */
    variables: TVariables;
    /** Whether to generate metadata alongside the target */
    generate_meta?: boolean;
    /** Condition to determine if target should be generated */
    condition?: boolean;
    /** Whether to create a backup of the file before writing */
    backup?: boolean;
    /** Optional path for backup files, defaults to ".axogen/backup/{{path}}" */
    backupPath?: string;
}

/**
 * Target definition for JSON file generation.
 * Generates standard JSON files with optional formatting options.
 */
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

/**
 * Target definition for JSON5 file generation.
 * Generates JSON5 files with extended syntax support.
 */
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

/**
 * Target definition for JSONC file generation.
 * Generates JSON with comments for configuration files.
 */
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

/**
 * Target definition for HJSON file generation.
 * Generates human-friendly JSON with comments and relaxed syntax.
 */
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

/**
 * Target definition for YAML file generation.
 * Generates YAML files with configurable formatting options.
 */
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

/**
 * Target definition for TOML file generation.
 * Generates TOML configuration files.
 */
export interface TomlTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "toml",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

/**
 * Target definition for INI file generation.
 * Generates INI configuration files with formatting options.
 */
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

/**
 * Target definition for Properties file generation.
 * Generates Java-style properties files.
 */
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

/**
 * Target definition for environment variable file generation.
 * Generates .env files for environment variable configuration.
 */
export interface EnvTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "env",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

/**
 * Target definition for XML file generation.
 * Generates XML files with configurable formatting options.
 */
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

/**
 * Target definition for CSV file generation.
 * Generates CSV files with configurable formatting and output options.
 */
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

/**
 * Target definition for CSON file generation.
 * Generates CoffeeScript Object Notation files.
 */
export interface CsonTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "cson",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {}

/**
 * Target definition for template-based file generation.
 * Generates files using template engines like Nunjucks, Handlebars, or Mustache.
 */
export interface TemplateTargetDefinition<
    TSchema = any,
    TVariables = InferVariablesType<TSchema>,
> extends BaseTargetDefinition<
        "template",
        TSchema,
        ValidateSchemaVariables<TSchema, TVariables>
    > {
    /** Template engine to use for rendering */
    engine: TemplateTargetEngine;
    /** Template path to render with variables */
    template: string;
}

/**
 * Mapping of target type strings to their corresponding target definition interfaces.
 */
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

/**
 * Union type of all possible target definitions.
 */
export type AnyTarget = TargetTypeMap[keyof TargetTypeMap];

// Factory functions for better DX

/**
 * Creates a JSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSON target
 * @param config.path - The output file path where the JSON will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as JSON, validated against schema
 * @param config.options - JSON formatting options (replacer, space)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSON target definition with schema validation
 */
export function json<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: JsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): JsonTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a JSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSON target
 * @param config.path - The output file path where the JSON will be written
 * @param config.variables - Variables to serialize as JSON
 * @param config.options - JSON formatting options (replacer, space)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSON target definition without schema validation
 */
export function json<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: JsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): JsonTargetDefinition<TVariables, TVariables>;

export function json(config: any): any {
    return {type: "json", ...config};
}

/**
 * Creates a JSON5 target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSON5 target
 * @param config.path - The output file path where the JSON5 will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as JSON5, validated against schema
 * @param config.options - JSON5 formatting options
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSON5 target definition with schema validation
 */
export function json5<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: Json5TargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): Json5TargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a JSON5 target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSON5 target
 * @param config.path - The output file path where the JSON5 will be written
 * @param config.variables - Variables to serialize as JSON5
 * @param config.options - JSON5 formatting options
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSON5 target definition without schema validation
 */
export function json5<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: Json5TargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): Json5TargetDefinition<TVariables, TVariables>;

export function json5(config: any): any {
    return {type: "json5", ...config};
}

/**
 * Creates a JSONC target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSONC target
 * @param config.path - The output file path where the JSONC will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as JSONC, validated against schema
 * @param config.options - JSONC formatting options (replacer, space)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSONC target definition with schema validation
 */
export function jsonc<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: JsoncTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): JsoncTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a JSONC target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the JSONC target
 * @param config.path - The output file path where the JSONC will be written
 * @param config.variables - Variables to serialize as JSONC
 * @param config.options - JSONC formatting options (replacer, space)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns JSONC target definition without schema validation
 */
export function jsonc<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: JsoncTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): JsoncTargetDefinition<TVariables, TVariables>;

export function jsonc(config: any): any {
    return {type: "jsonc", ...config};
}

/**
 * Creates an HJSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the HJSON target
 * @param config.path - The output file path where the HJSON will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as HJSON, validated against schema
 * @param config.options - HJSON serialization options
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns HJSON target definition with schema validation
 */
export function hjson<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: HjsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): HjsonTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates an HJSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the HJSON target
 * @param config.path - The output file path where the HJSON will be written
 * @param config.variables - Variables to serialize as HJSON
 * @param config.options - HJSON serialization options
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns HJSON target definition without schema validation
 */
export function hjson<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: HjsonTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): HjsonTargetDefinition<TVariables, TVariables>;

export function hjson(config: any): any {
    return {type: "hjson", ...config};
}

/**
 * Creates a YAML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the YAML target
 * @param config.path - The output file path where the YAML will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as YAML, validated against schema
 * @param config.options - YAML dump options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns YAML target definition with schema validation
 */
export function yaml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: YamlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): YamlTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a YAML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the YAML target
 * @param config.path - The output file path where the YAML will be written
 * @param config.variables - Variables to serialize as YAML
 * @param config.options - YAML dump options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns YAML target definition without schema validation
 */
export function yaml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: YamlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): YamlTargetDefinition<TVariables, TVariables>;

export function yaml(config: any): any {
    return {type: "yaml", ...config};
}

/**
 * Creates a TOML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the TOML target
 * @param config.path - The output file path where the TOML will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as TOML, validated against schema
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns TOML target definition with schema validation
 */
export function toml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): TomlTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a TOML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the TOML target
 * @param config.path - The output file path where the TOML will be written
 * @param config.variables - Variables to serialize as TOML
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns TOML target definition without schema validation
 */
export function toml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): TomlTargetDefinition<TVariables, TVariables>;

export function toml(config: any): any {
    return {type: "toml", ...config};
}

/**
 * Creates an INI target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the INI target
 * @param config.path - The output file path where the INI will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as INI, validated against schema
 * @param config.options - INI encoding options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns INI target definition with schema validation
 */
export function ini<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: IniTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): IniTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates an INI target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the INI target
 * @param config.path - The output file path where the INI will be written
 * @param config.variables - Variables to serialize as INI
 * @param config.options - INI encoding options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns INI target definition without schema validation
 */
export function ini<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: IniTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): IniTargetDefinition<TVariables, TVariables>;

export function ini(config: any): any {
    return {type: "ini", ...config};
}

/**
 * Creates a Properties target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the Properties target
 * @param config.path - The output file path where the Properties will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as Properties, validated against schema
 * @param config.options - Properties formatting options (align, sort, whitespace, platform)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Properties target definition with schema validation
 */
export function properties<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: PropertiesTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): PropertiesTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a Properties target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the Properties target
 * @param config.path - The output file path where the Properties will be written
 * @param config.variables - Variables to serialize as Properties
 * @param config.options - Properties formatting options (align, sort, whitespace, platform)
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Properties target definition without schema validation
 */
export function properties<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: PropertiesTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): PropertiesTargetDefinition<TVariables, TVariables>;

export function properties(config: any): any {
    return {type: "properties", ...config};
}

/**
 * Creates an environment variable target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the environment variable target
 * @param config.path - The output file path where the .env file will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as environment variables, validated against schema
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Environment variable target definition with schema validation
 */
export function env<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): EnvTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates an environment variable target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the environment variable target
 * @param config.path - The output file path where the .env file will be written
 * @param config.variables - Variables to serialize as environment variables
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Environment variable target definition without schema validation
 */
export function env<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): EnvTargetDefinition<TVariables, TVariables>;

export function env(config: any): any {
    return {type: "env", ...config};
}

/**
 * Creates an XML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the XML target
 * @param config.path - The output file path where the XML will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as XML, validated against schema
 * @param config.options - XML builder options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns XML target definition with schema validation
 */
export function xml<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: XmlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): XmlTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates an XML target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the XML target
 * @param config.path - The output file path where the XML will be written
 * @param config.variables - Variables to serialize as XML
 * @param config.options - XML builder options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns XML target definition without schema validation
 */
export function xml<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    options?: XmlTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): XmlTargetDefinition<TVariables, TVariables>;

export function xml(config: any): any {
    return {type: "xml", ...config};
}

/**
 * Creates a CSV target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the CSV target
 * @param config.path - The output file path where the CSV will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Array of variables to serialize as CSV, validated against schema
 * @param config.options - CSV unparse options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns CSV target definition with schema validation
 */
export function csv<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    options?: CsvTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): CsvTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a CSV target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the CSV target
 * @param config.path - The output file path where the CSV will be written
 * @param config.variables - Array of variables to serialize as CSV
 * @param config.options - CSV unparse options for formatting control
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns CSV target definition without schema validation
 */
export function csv<TVariables extends Record<string, any>[]>(config: {
    path: string;
    variables: TVariables;
    options?: CsvTargetOptions;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): CsvTargetDefinition<TVariables, TVariables>;

export function csv(config: any): any {
    return {type: "csv", ...config};
}

/**
 * Creates a CSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the CSON target
 * @param config.path - The output file path where the CSON will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to serialize as CSON, validated against schema
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns CSON target definition with schema validation
 */
export function cson<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): CsonTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a CSON target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the CSON target
 * @param config.path - The output file path where the CSON will be written
 * @param config.variables - Variables to serialize as CSON
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns CSON target definition without schema validation
 */
export function cson<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): CsonTargetDefinition<TVariables, TVariables>;

export function cson(config: any): any {
    return {type: "cson", ...config};
}

/**
 * Creates a template target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the template target
 * @param config.path - The output file path where the rendered template will be written
 * @param config.schema - Zod schema for validating variables
 * @param config.variables - Variables to use in template rendering, validated against schema
 * @param config.engine - Template engine to use (nunjucks, handlebars, or mustache)
 * @param config.template - Template path to render with variables
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Template target definition with schema validation
 */
export function template<TSchema extends z.ZodType>(config: {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    engine: TemplateTargetEngine;
    template: string;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): TemplateTargetDefinition<TSchema, z.infer<TSchema>>;

/**
 * Creates a template target definition.
 * Supports both schema-validated and plain object configurations.
 * @param config - Configuration object for the template target
 * @param config.path - The output file path where the rendered template will be written
 * @param config.variables - Variables to use in template rendering
 * @param config.engine - Template engine to use (nunjucks, handlebars, or mustache)
 * @param config.template - Template path to render with variables
 * @param config.generate_meta - Whether to generate metadata alongside the target
 * @param config.condition - Condition to determine if target should be generated
 * @param config.backup - Whether to create a backup of the file before writing
 * @param config.backupPath - Optional path for backup files, defaults to ".axogen/backup/{{path}}"
 * @returns Template target definition without schema validation
 */
export function template<TVariables extends Record<string, any>>(config: {
    path: string;
    variables: TVariables;
    engine: TemplateTargetEngine;
    template: string;
    generate_meta?: boolean;
    condition?: boolean;
    backup?: boolean;
    backupPath?: string;
}): TemplateTargetDefinition<TVariables, TVariables>;

export function template(config: any): any {
    return {type: "template", ...config};
}
