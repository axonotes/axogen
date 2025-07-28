import {EnvVariableProcessor} from "../pre-processor.ts";

export class EnvGenerator {
    private processor = new EnvVariableProcessor();

    /** Generate .env file content from target configuration */
    generate(variables: Record<string, any>): string {
        const processedVariables = this.processor.process(variables);
        const flattened = this.flattenVariables(processedVariables);
        const sortedKeys = Object.keys(flattened).sort();

        const lines: string[] = [];
        for (const key of sortedKeys) {
            const value = flattened[key];
            const envLine = this.formatEnvVariable(key, value);
            if (envLine) {
                lines.push(envLine);
            }
        }

        return lines.join("\n");
    }

    /** Flatten nested objects and arrays into underscore-separated uppercase keys */
    private flattenVariables(
        obj: Record<string, any>,
        prefix: string = "",
        separator: string = "_"
    ): Record<string, any> {
        const flattened: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
            // Convert key to uppercase and sanitize
            const sanitizedKey = this.sanitizeKey(key);
            const newKey = prefix
                ? `${prefix}${separator}${sanitizedKey}`
                : sanitizedKey;

            if (value === null || value === undefined) {
                flattened[newKey] = value;
            } else if (Array.isArray(value)) {
                // Flatten arrays with indexed keys
                value.forEach((item, index) => {
                    if (typeof item === "object" && item !== null) {
                        // Recursively flatten object items
                        const nested = this.flattenVariables(
                            {[index]: item},
                            newKey,
                            separator
                        );
                        Object.assign(flattened, nested);
                    } else {
                        flattened[`${newKey}${separator}${index}`] = item;
                    }
                });
                // Also add array length for convenience
                flattened[`${newKey}${separator}LENGTH`] = value.length;
            } else if (typeof value === "object") {
                // Recursively flatten nested objects
                const nested = this.flattenVariables(value, newKey, separator);
                Object.assign(flattened, nested);
            } else {
                flattened[newKey] = value;
            }
        }

        return flattened;
    }

    /** Sanitize and format key for environment variable naming */
    private sanitizeKey(key: string): string {
        return (
            key
                // Convert to uppercase
                .toUpperCase()
                // Replace non-alphanumeric characters with underscores
                .replace(/[^A-Z0-9]/g, "_")
                // Remove consecutive underscores
                .replace(/_+/g, "_")
                // Remove leading/trailing underscores
                .replace(/^_+|_+$/g, "")
        );
    }

    /** Format a single environment variable */
    private formatEnvVariable(key: string, value: any): string | null {
        // Skip undefined values
        if (value === undefined) {
            return null;
        }

        // Convert value to string (primitives only now since we've processed)
        let stringValue: string;

        if (value === null) {
            stringValue = "";
        } else if (typeof value === "boolean") {
            stringValue = value ? "true" : "false";
        } else if (typeof value === "number") {
            stringValue = value.toString();
        } else if (typeof value === "string") {
            stringValue = value;
        } else {
            // Fallback for any remaining complex types
            stringValue = String(value);
        }

        // Escape quotes in values
        const escapedValue = this.escapeEnvValue(stringValue);

        return `${key}=${escapedValue}`;
    }

    /** Escape environment variable values that contain special characters */
    private escapeEnvValue(value: string): string {
        // If value contains spaces, quotes, or special chars, wrap in quotes
        if (this.needsQuoting(value)) {
            // Escape existing double quotes and backslashes
            const escaped = value
                .replace(/\\/g, "\\\\") // Escape backslashes first
                .replace(/"/g, '\\"') // Then escape quotes
                .replace(/\n/g, "\\n") // Escape newlines
                .replace(/\r/g, "\\r") // Escape carriage returns
                .replace(/\t/g, "\\t"); // Escape tabs
            return `"${escaped}"`;
        }

        return value;
    }

    /** Check if a value needs to be quoted */
    private needsQuoting(value: string): boolean {
        // Empty string needs quotes
        if (value === "") {
            return true;
        }

        // Check for characters that require quoting
        return /[\s"'`${}\\#\n\r\t]/.test(value);
    }
}
