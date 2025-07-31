import * as z from "zod";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import {
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
} from "./loaderTypes";
import {resolve} from "node:path";
import * as fs from "node:fs";
import {logger} from "../utils/console/logger.ts";

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

export const SupportedLoadFileTypes = [
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
    "txt",

    // Alternative formats
    "cson",
];

export type SupportedLoadFileTypesType =
    (typeof SupportedLoadFileTypes)[number];

/**
 * Load a configuration file and validate it against an optional schema.
 *
 * @param filePath - The path to the configuration file.
 * @param type - The type of the file to load, which determines the parsing method.
 * @param schema - Optional Zod schema to validate the loaded data.
 * @returns A promise that resolves to the parsed and validated data.
 */
export function loadFile<TSchema extends z.ZodType>(
    filePath: string,
    type: SupportedLoadFileTypesType,
    schema: TSchema
): z.infer<TSchema>;

export function loadFile(
    filePath: string,
    type: SupportedLoadFileTypesType
): Record<string, unknown>;

export function loadFile<TSchema extends z.ZodType>(
    filePath: string,
    type: SupportedLoadFileTypesType,
    schema?: TSchema
): z.infer<TSchema> | Record<string, unknown> {
    const resolvedPath = resolve(filePath);

    if (!fs.existsSync(resolvedPath)) {
        throw new Error(`File not found: ${resolvedPath}`);
    }

    if (!SupportedLoadFileTypes.includes(type)) {
        throw new Error(
            `Unsupported file type: ${type}. Supported types are: ${SupportedLoadFileTypes.join(", ")}`
        );
    }

    let data: any = {};

    switch (type) {
        case "json":
            const jsonContent = fs.readFileSync(resolvedPath, "utf8");
            data = JSON.parse(jsonContent);
            break;

        case "json5":
            data = parseJson5File(resolvedPath);
            break;

        case "jsonc":
            data = parseJsoncFile(resolvedPath);
            break;

        case "hjson":
            data = parseHjsonFile(resolvedPath);
            break;

        case "yaml":
            data = parseYamlFile(resolvedPath);
            break;

        case "toml":
            data = parseTomlFile(resolvedPath);
            break;

        case "ini":
            data = parseIniFile(resolvedPath);
            break;

        case "properties":
            data = parsePropertiesFile(resolvedPath);
            break;

        case "env":
            data = parseEnvFile(resolvedPath);
            break;

        case "xml":
            data = parseXmlFile(resolvedPath);
            break;

        case "csv":
            data = parseCsvFile(resolvedPath);
            break;

        case "txt":
            data = parseTxtFile(resolvedPath);
            break;

        case "cson":
            data = parseCsonFile(resolvedPath);
            break;

        default:
            throw new Error(`Unimplemented file format: ${type}`);
    }

    if (schema) {
        try {
            return schema.parse(data);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const validationErrors = zodIssuesToErrors(error.issues);

                logger.validation(
                    `Loading validation failed for fiel: <subtle>${resolvedPath}</subtle>`,
                    validationErrors
                );
                console.log();

                throw new Error("Loading validation failed");
            }

            throw new Error(
                `Failed to load file ${filePath}: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    return data;
}
