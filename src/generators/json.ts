import type {JsonTarget} from "../types";

export class JsonGenerator {
    /** Generate JSON file content from target configuration */
    generate(target: JsonTarget): string {
        const indent = target.indent ?? 2;

        try {
            // Process variables to ensure they're JSON serializable
            const processedVariables = this.processVariables(target.variables);

            let output: Record<string, any>;
            if (target.generate_meta) {
                // Add metadata header fields
                output = this.addMetadata(processedVariables, target);
            } else {
                output = processedVariables;
            }

            // Generate JSON with specified indentation
            return JSON.stringify(output, null, indent);
        } catch (error) {
            throw new Error(
                `Failed to generate JSON for target: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /** Add metadata fields to the JSON output */
    private addMetadata(variables: any, target: JsonTarget): any {
        const timestamp = new Date().toISOString();

        return {
            _meta: {
                generator: "axogen",
                generated_at: timestamp,
                warning:
                    "This file was generated automatically - do not edit manually",
                target_path: target.path,
                format: "json",
            },
            ...variables,
        };
    }

    /** Process variables to ensure JSON compatibility */
    private processVariables(variables: Record<string, any>): any {
        // Track circular references
        const seen = new WeakSet();
        return this.processValue(variables, seen);
    }

    /** Recursively process values to handle non-JSON types */
    private processValue(value: any, seen: WeakSet<object>): any {
        // Handle null and undefined
        if (value === null) {
            return null;
        }
        if (value === undefined) {
            return null; // JSON doesn't have undefined, convert to null
        }

        // Handle primitives
        if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value;
        }

        // Handle BigInt
        if (typeof value === "bigint") {
            return value.toString() + "n";
        }

        // Handle Symbol
        if (typeof value === "symbol") {
            return `[Symbol: ${value.description || ""}]`;
        }

        // Handle functions
        if (typeof value === "function") {
            return `[Function: ${value.name || "anonymous"}]`;
        }

        // Handle objects and arrays (check for circular references)
        if (typeof value === "object") {
            // Check for circular references
            if (seen.has(value)) {
                return "[Circular Reference]";
            }
            seen.add(value);

            try {
                // Handle special object types
                if (Array.isArray(value)) {
                    return value.map((item) => this.processValue(item, seen));
                }

                if (value instanceof Date) {
                    return value.toISOString();
                }

                if (value instanceof RegExp) {
                    return {
                        _type: "RegExp",
                        source: value.source,
                        flags: value.flags,
                    };
                }

                if (value instanceof Error) {
                    return {
                        _type: "Error",
                        name: value.name,
                        message: value.message,
                        stack: value.stack,
                    };
                }

                if (value instanceof Map) {
                    return {
                        _type: "Map",
                        entries: Array.from(value.entries()).map(([k, v]) => [
                            this.processValue(k, seen),
                            this.processValue(v, seen),
                        ]),
                    };
                }

                if (value instanceof Set) {
                    return {
                        _type: "Set",
                        values: Array.from(value).map((v) =>
                            this.processValue(v, seen)
                        ),
                    };
                }

                // Handle URL objects
                if (value instanceof URL) {
                    return value.toString();
                }

                // Handle Buffer (Node.js)
                if (typeof Buffer !== "undefined" && value instanceof Buffer) {
                    return {
                        _type: "Buffer",
                        data: value.toString("base64"),
                    };
                }

                // Handle ArrayBuffer
                if (value instanceof ArrayBuffer) {
                    return {
                        _type: "ArrayBuffer",
                        byteLength: value.byteLength,
                        data: "[Binary Data]",
                    };
                }

                // Handle typed arrays
                if (ArrayBuffer.isView(value)) {
                    return {
                        _type: value.constructor.name,
                        length: value.byteLength,
                        data: Array.from(value as any),
                    };
                }

                // Handle plain objects
                const processed: Record<string, any> = {};
                for (const [key, val] of Object.entries(value)) {
                    // Skip non-enumerable properties and functions in object traversal
                    try {
                        processed[key] = this.processValue(val, seen);
                    } catch (error) {
                        processed[key] = `[Error processing value: ${error}]`;
                    }
                }
                return processed;
            } finally {
                seen.delete(value);
            }
        }

        // Fallback for any other types
        try {
            return String(value);
        } catch (error) {
            return `[Unserializable: ${typeof value}]`;
        }
    }
}
