import * as z from "zod";
import {pretty} from "../utils/pretty.ts";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import {parseTomlFile} from "./toml.ts";
import {parseJson5File} from "./json5.ts";
import {parseJsoncFile} from "./jsonc.ts";
import {parseHjsonFile} from "./hjson.ts";
import {parseYamlFile} from "./yaml.ts";
import {parseIniFile} from "./ini.ts";
import {parsePropertiesFile} from "./properties.ts";
import {parseEnvFile} from "./env.ts";
import {parseXmlFile} from "./xml.ts";
import {parseCsvFile} from "./csv.ts";
import {parseTxtFile, txtSchema} from "./txt.ts";
import {parseCsonFile} from "./cson.ts";
import {resolve} from "node:path";
import * as fs from "node:fs";

// Re-export parsers for easier imports
export {
    parseTomlFile,
    parseJson5File,
    parseJsoncFile,
    parseHjsonFile,
    parseYamlFile,
    parseIniFile,
    parsePropertiesFile,
    parseEnvFile,
    parseXmlFile,
    parseCsvFile,
    parseTxtFile,
    parseCsonFile,
    txtSchema,
};

/**
 * Supported file extensions for configuration files
 */
export const SupportedExtensions = [
    // Core formats
    ".json", // Native JSON.parse()
    ".json5", // json5 package - JSON with comments, trailing commas
    ".jsonc", // jsonc-parser package - JSON with comments
    ".hjson", // hjson package - Human JSON

    // Configuration formats
    ".yaml",
    ".yml", // js-yaml package
    ".toml", // @iarna/toml package
    ".ini",
    ".conf",
    ".cfg", // ini package
    ".properties", // Java properties
    ".env", // Environment files

    // Structured data
    ".xml", // fast-xml-parser package
    ".csv", // papaparse package - CSV to objects
    ".txt", // Plain text (string)

    // Alternative formats
    ".cson", // cson package - CoffeeScript Object Notation
];

export type SupportedExtensionsType = (typeof SupportedExtensions)[number];

/**
 * Valid file path type that includes supported extensions
 */
export type ValidFilePath = `${string}${SupportedExtensionsType}`;

/**
 * Load a configuration file and validate it against an optional schema.
 *
 * @param filePath - The path to the configuration file.
 * @param schema - Optional Zod schema to validate the loaded data.
 * @returns A promise that resolves to the parsed and validated data.
 */
export function loadFile<TSchema extends z.ZodType>(
    filePath: ValidFilePath,
    schema: TSchema
): z.infer<TSchema>;

export function loadFile(filePath: ValidFilePath): Record<string, unknown>;

export function loadFile<TSchema extends z.ZodType>(
    filePath: ValidFilePath,
    schema?: TSchema
): z.infer<TSchema> | Record<string, unknown> {
    const resolvedPath = resolve(filePath);
    const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();

    if (!SupportedExtensions.includes(ext)) {
        throw new Error(`Unsupported file extension: ${ext}`);
    }

    let data: any = {};

    switch (ext) {
        case ".json":
            const jsonContent = fs.readFileSync(resolvedPath, "utf8");
            data = JSON.parse(jsonContent);
            break;

        case ".json5":
            data = parseJson5File(resolvedPath);
            break;

        case ".jsonc":
            data = parseJsoncFile(resolvedPath);
            break;

        case ".hjson":
            data = parseHjsonFile(resolvedPath);
            break;

        case ".yaml":
        case ".yml":
            data = parseYamlFile(resolvedPath);
            break;

        case ".toml":
            data = parseTomlFile(resolvedPath);
            break;

        case ".ini":
        case ".conf":
        case ".cfg":
            data = parseIniFile(resolvedPath);
            break;

        case ".properties":
            data = parsePropertiesFile(resolvedPath);
            break;

        case ".env":
            data = parseEnvFile(resolvedPath);
            break;

        case ".xml":
            data = parseXmlFile(resolvedPath);
            break;

        case ".csv":
            data = parseCsvFile(resolvedPath);
            break;

        case ".txt":
            data = parseTxtFile(resolvedPath);
            break;

        case ".cson":
            data = parseCsonFile(resolvedPath);
            break;

        default:
            throw new Error(`Unimplemented file format: ${ext}`);
    }

    if (schema) {
        try {
            return schema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = zodIssuesToErrors(error.issues);

                pretty.validation.errorGroup(
                    `Loading validation failed in ${pretty.text.accent(filePath)}`,
                    validationErrors
                );
                console.log();

                throw new Error("Loading validation failed");
            }

            throw new Error(
                `Failed to load file ${pretty.text.accent(filePath)}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    return data;
}
