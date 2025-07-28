export class VariableProcessor {
    protected seen = new WeakSet();

    process(variables: Record<string, any>): any {
        this.seen = new WeakSet(); // Reset for each processing
        return this.processValue(variables);
    }

    protected processValue(value: any): any {
        // Handle null and undefined
        if (value === null || value === undefined) {
            return value;
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
            return this.handleBigInt(value);
        }

        // Handle Symbol
        if (typeof value === "symbol") {
            return `Symbol(${value.description || ""})`;
        }

        // Handle functions
        if (typeof value === "function") {
            return `[Function: ${value.name || "anonymous"}]`;
        }

        // Handle objects and arrays
        if (typeof value === "object") {
            return this.handleObject(value);
        }

        // Fallback
        return String(value);
    }

    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleObject(value: object): any {
        // Check for circular references
        if (this.seen.has(value)) {
            return "[Circular Reference]";
        }
        this.seen.add(value);

        try {
            // Handle arrays
            if (Array.isArray(value)) {
                return value.map((item) => this.processValue(item));
            }

            // Handle Date objects
            if (value instanceof Date) {
                return this.handleDate(value);
            }

            // Handle other special types
            if (value instanceof RegExp) return this.handleRegExp(value);
            if (value instanceof Error) return this.handleError(value);
            if (value instanceof Map) return this.handleMap(value);
            if (value instanceof Set) return this.handleSet(value);
            if (value instanceof URL) return this.handleURL(value);
            if (typeof Buffer !== "undefined" && value instanceof Buffer)
                return this.handleBuffer(value);

            // Handle plain objects
            const processed: Record<string, any> = {};
            for (const [key, val] of Object.entries(value)) {
                try {
                    const processedVal = this.processValue(val);
                    if (processedVal !== undefined) {
                        processed[key] = processedVal;
                    }
                } catch (error) {
                    processed[key] = `[Error: ${error}]`;
                }
            }
            return processed;
        } finally {
            this.seen.delete(value);
        }
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return {_type: "RegExp", source: value.source, flags: value.flags};
    }

    protected handleError(value: Error): any {
        return {_type: "Error", name: value.name, message: value.message};
    }

    protected handleMap(value: Map<any, any>): any {
        const obj: Record<string, any> = {};
        for (const [k, v] of value.entries()) {
            const key = typeof k === "string" ? k : String(k);
            obj[key] = this.processValue(v);
        }
        return obj;
    }

    protected handleSet(value: Set<any>): any {
        return Array.from(value).map((v) => this.processValue(v));
    }

    protected handleURL(value: URL): any {
        return value.toString();
    }

    protected handleBuffer(value: Buffer): any {
        return {_type: "Buffer", data: value.toString("base64")};
    }
}

// Specialized processors for different formats

export class JsonVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString() + "n";
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return {_type: "RegExp", source: value.source, flags: value.flags};
    }
}

export class Json5VariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString() + "n";
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return {_type: "RegExp", source: value.source, flags: value.flags};
    }

    protected handleURL(value: URL): any {
        return {
            href: value.href,
            origin: value.origin,
            pathname: value.pathname,
            search: value.search,
            hash: value.hash,
        };
    }
}

export class HjsonVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return value.toString();
    }
}

export class TomlVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        try {
            return Number(value);
        } catch {
            return value.toString() + "n";
        }
    }

    protected handleDate(value: Date): any {
        return value; // TOML supports dates natively
    }
}

export class IniVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return value.toString();
    }

    protected handleMap(value: Map<any, any>): any {
        // Flatten map for ini format
        const obj: Record<string, any> = {};
        for (const [k, v] of value.entries()) {
            const key = typeof k === "string" ? k : String(k);
            obj[key] = this.processValue(v);
        }
        return this.flattenObject(obj);
    }

    private flattenObject(
        obj: Record<string, any>,
        prefix = ""
    ): Record<string, any> {
        const flattened: Record<string, any> = {};

        for (const [key, value] of Object.entries(obj)) {
            const newKey = prefix ? `${prefix}.${key}` : key;

            if (value && typeof value === "object" && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            } else {
                flattened[newKey] = value;
            }
        }

        return flattened;
    }
}

export class PropertiesVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return value.toString(); // Convert to string representation
    }

    protected handleError(value: Error): any {
        return `${value.name}: ${value.message}`;
    }

    protected handleBuffer(value: Buffer): any {
        return value.toString("base64");
    }

    protected handleURL(value: URL): any {
        return value.toString();
    }
}

export class EnvVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }
}

export class XmlVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return {
            "@_type": "RegExp",
            source: value.source,
            flags: value.flags,
        };
    }

    protected handleMap(value: Map<any, any>): any {
        const obj: Record<string, any> = {};
        for (const [k, v] of value.entries()) {
            const key = typeof k === "string" ? k : String(k);
            obj[key] = this.processValue(v);
        }
        return obj;
    }

    protected handleURL(value: URL): any {
        return {
            "@_type": "URL",
            href: value.href,
            origin: value.origin,
            pathname: value.pathname,
        };
    }
}

export class CsvVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value.toISOString();
    }

    protected handleRegExp(value: RegExp): any {
        return value.toString();
    }

    protected handleMap(value: Map<any, any>): any {
        // Convert map to flat object for CSV
        const obj: Record<string, any> = {};
        for (const [k, v] of value.entries()) {
            const key = typeof k === "string" ? k : String(k);
            const processedValue = this.processValue(v);
            obj[key] =
                typeof processedValue === "object"
                    ? JSON.stringify(processedValue)
                    : processedValue;
        }
        return obj;
    }

    protected handleURL(value: URL): any {
        return value.toString();
    }

    // Override to flatten complex objects for CSV compatibility
    protected handleObject(value: object): any {
        // Check for circular references
        if (this.seen.has(value)) {
            return "[Circular Reference]";
        }
        this.seen.add(value);

        try {
            // Handle arrays - keep as arrays for CSV
            if (Array.isArray(value)) {
                return value.map((item) => this.processValue(item));
            }

            // Handle Date objects
            if (value instanceof Date) {
                return this.handleDate(value);
            }

            // Handle other special types
            if (value instanceof RegExp) return this.handleRegExp(value);
            if (value instanceof Error)
                return `${value.name}: ${value.message}`;
            if (value instanceof Map) return this.handleMap(value);
            if (value instanceof Set)
                return Array.from(value)
                    .map((v) => this.processValue(v))
                    .join(";");
            if (value instanceof URL) return this.handleURL(value);
            if (typeof Buffer !== "undefined" && value instanceof Buffer)
                return value.toString("base64");

            // Handle plain objects - flatten or stringify
            const processed: Record<string, any> = {};
            for (const [key, val] of Object.entries(value)) {
                try {
                    const processedVal = this.processValue(val);
                    if (processedVal !== undefined) {
                        processed[key] =
                            typeof processedVal === "object"
                                ? JSON.stringify(processedVal)
                                : processedVal;
                    }
                } catch (error) {
                    processed[key] = `[Error: ${error}]`;
                }
            }
            return processed;
        } finally {
            this.seen.delete(value);
        }
    }
}

export class CsonVariableProcessor extends VariableProcessor {
    protected handleBigInt(value: bigint): any {
        return value.toString();
    }

    protected handleDate(value: Date): any {
        return value; // CSON can handle Date objects
    }

    protected handleRegExp(value: RegExp): any {
        return value; // CSON can handle RegExp objects
    }

    protected handleURL(value: URL): any {
        return {
            href: value.href,
            origin: value.origin,
            pathname: value.pathname,
            search: value.search,
            hash: value.hash,
        };
    }
}
