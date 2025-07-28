import * as z from "zod";

export type SchemaType = z.ZodType | Record<string, any>;

interface BaseTargetSchema<TSchema extends z.ZodType> {
    path: string;
    schema: TSchema;
    variables: z.infer<TSchema>;
    generate_meta?: boolean;
}

export interface EnvTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "env";
}

export interface JsonTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "json";
    indent?: number | string;
}

export interface YamlTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "yaml";
    options?: {
        indent?: number;
        lineWidth?: number;
        noRefs?: boolean;
    };
}

export interface TomlTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "toml";
}

export interface TemplateTarget<TSchema extends z.ZodType>
    extends BaseTargetSchema<TSchema> {
    type: "template";
    template: string;
    engine?: "nunjucks" | "handlebars" | "mustache";
}

interface BaseTargetNoSchema {
    path: string;
    variables: Record<string, any>;
    generate_meta?: boolean;
}

export interface EnvTargetNoSchema extends BaseTargetNoSchema {
    type: "env";
}

export interface JsonTargetNoSchema extends BaseTargetNoSchema {
    type: "json";
    indent?: number | string;
}

export interface YamlTargetNoSchema extends BaseTargetNoSchema {
    type: "yaml";
    options?: {
        indent?: number;
        lineWidth?: number;
        noRefs?: boolean;
    };
}

export interface TomlTargetNoSchema extends BaseTargetNoSchema {
    type: "toml";
}

export interface TemplateTargetNoSchema extends BaseTargetNoSchema {
    type: "template";
    template: string;
    engine?: "nunjucks" | "handlebars" | "mustache";
}

export type Target<TSchema extends SchemaType = Record<string, any>> =
    TSchema extends z.ZodType
        ?
              | EnvTarget<TSchema>
              | JsonTarget<TSchema>
              | YamlTarget<TSchema>
              | TomlTarget<TSchema>
              | TemplateTarget<TSchema>
        : TSchema extends Record<string, any>
          ?
                | EnvTargetNoSchema
                | JsonTargetNoSchema
                | YamlTargetNoSchema
                | TomlTargetNoSchema
                | TemplateTargetNoSchema
          : never;

export type Targets<T extends Record<string, SchemaType>> = {
    [K in keyof T]: Target<T[K]>;
};
