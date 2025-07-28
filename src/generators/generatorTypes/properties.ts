import * as ini from "ini";
import {PropertiesVariableProcessor} from "../pre-processor.ts";
import type {PropertiesTargetOptions} from "../../config/types";

export class PropertiesGenerator {
    private processor = new PropertiesVariableProcessor();

    generate(
        variables: Record<string, any>,
        options: PropertiesTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);

        // Flatten the object for properties format
        const flattenedVariables = this.flattenObject(processedVariables);

        // Convert arrays to comma-separated strings
        const propertiesReady = this.prepareArrays(flattenedVariables);

        return ini.stringify(propertiesReady, {
            // Default options for properties format
            align: false,
            sort: true,
            whitespace: false,
            platform: "unix",

            // Fixed options for properties format
            section: undefined, // No sections
            bracketedArray: false, // No array[] syntax
            newline: false, // No extra newlines

            // User options override defaults
            ...options,
        });
    }

    private flattenObject(
        obj: any,
        prefix = "",
        separator = "."
    ): Record<string, any> {
        const flattened: Record<string, any> = {};

        for (const key in obj) {
            if (!obj.hasOwnProperty(key)) continue;

            const newKey = prefix ? `${prefix}${separator}${key}` : key;
            const value = obj[key];

            if (
                value !== null &&
                typeof value === "object" &&
                !Array.isArray(value)
            ) {
                // Recursively flatten nested objects
                Object.assign(
                    flattened,
                    this.flattenObject(value, newKey, separator)
                );
            } else {
                // Keep primitive values and arrays as-is for now
                flattened[newKey] = value;
            }
        }

        return flattened;
    }

    private prepareArrays(obj: Record<string, any>): Record<string, any> {
        const result: Record<string, any> = {};

        for (const key in obj) {
            const value = obj[key];

            if (Array.isArray(value)) {
                // Convert arrays to comma-separated strings
                result[key] = value.join(",");
            } else {
                result[key] = value;
            }
        }

        return result;
    }
}
