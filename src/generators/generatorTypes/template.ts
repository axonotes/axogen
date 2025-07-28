import {readFile} from "node:fs/promises";
import * as nunjucks from "nunjucks";
import Handlebars from "handlebars";
import * as Mustache from "mustache";
import type {ZodTemplateTarget} from "../../config/types";
import {resolve} from "node:path";

export class TemplateGenerator {
    private nunjucksEnv: nunjucks.Environment;

    constructor() {
        // Configure Nunjucks environment
        this.nunjucksEnv = new nunjucks.Environment(
            new nunjucks.FileSystemLoader([process.cwd(), "templates", "."]),
            {
                autoescape: false, // Let users control escaping
                throwOnUndefined: false, // Don't throw on undefined variables
                trimBlocks: true,
                lstripBlocks: true,
            }
        );

        // Add custom filters/helpers
        this.setupNunjucksHelpers();
        this.setupHandlebarsHelpers();
    }

    /** Generate file content from template */
    async generate(
        target: ZodTemplateTarget,
        baseDir: string
    ): Promise<string> {
        try {
            target.template = resolve(baseDir, target.template);

            // Read template file
            const templateContent = await readFile(target.template, "utf-8");

            // Process variables to handle complex types
            const processedVariables = this.processVariables(target.variables);

            let templateContext: Record<string, any>;
            if (target.generate_meta) {
                // Add metadata to template context
                templateContext = this.addTemplateContext(
                    processedVariables,
                    target
                );
            } else {
                // Use variables directly without metadata
                templateContext = processedVariables;
            }

            // Process template based on engine
            const engine = target.engine ?? "nunjucks";

            let result: string;
            switch (engine) {
                case "nunjucks":
                    result = await this.processNunjucks(
                        templateContent,
                        templateContext,
                        target.template
                    );
                    break;
                case "handlebars":
                    result = this.processHandlebars(
                        templateContent,
                        templateContext
                    );
                    break;
                case "mustache":
                    result = this.processMustache(
                        templateContent,
                        templateContext
                    );
                    break;
                default:
                    throw new Error(`Unsupported template engine: ${engine}`);
            }

            return result;
        } catch (error) {
            throw new Error(
                `Failed to generate template for target: ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /** Add template context with metadata */
    private addTemplateContext(variables: any, target: ZodTemplateTarget): any {
        return {
            // Metadata available in templates
            _meta: {
                generator: "axogen",
                generated_at: new Date().toISOString(),
                target_path: target.path,
                template_path: target.template,
                template_engine: target.engine ?? "nunjucks",
            },
            // User variables
            ...variables,
        };
    }

    /** Process Nunjucks template using the actual library */
    private async processNunjucks(
        template: string,
        variables: Record<string, any>,
        templatePath: string
    ): Promise<string> {
        try {
            // Try to render from file first (for includes/extends)
            return this.nunjucksEnv.render(templatePath, variables);
        } catch {
            // Fall back to rendering from string
            return this.nunjucksEnv.renderString(template, variables);
        }
    }

    /** Process Handlebars template using the actual library */
    private processHandlebars(
        template: string,
        variables: Record<string, any>
    ): string {
        const compiledTemplate = Handlebars.compile(template, {
            noEscape: false, // Enable HTML escaping by default
            strict: false, // Don't throw on missing properties
        });

        return compiledTemplate(variables);
    }

    /** Process Mustache template using the actual library */
    private processMustache(
        template: string,
        variables: Record<string, any>
    ): string {
        return Mustache.default.render(template, variables);
    }

    /** Setup Nunjucks custom filters and functions */
    private setupNunjucksHelpers(): void {
        // Date formatting
        this.nunjucksEnv.addFilter(
            "dateformat",
            (date: any, format: string = "ISO") => {
                const d = new Date(date);
                if (format === "ISO") return d.toISOString();
                if (format === "date") return d.toDateString();
                if (format === "time") return d.toTimeString();
                return d.toString();
            }
        );

        // JSON formatting
        this.nunjucksEnv.addFilter("json", (obj: any, indent: number = 2) => {
            return JSON.stringify(obj, null, indent);
        });

        // Case transformations
        this.nunjucksEnv.addFilter("snake_case", (str: string) => {
            return str.replace(
                /[A-Z]/g,
                (letter) => `_${letter.toLowerCase()}`
            );
        });

        this.nunjucksEnv.addFilter("kebab_case", (str: string) => {
            return str.replace(
                /[A-Z]/g,
                (letter) => `-${letter.toLowerCase()}`
            );
        });

        this.nunjucksEnv.addFilter("camel_case", (str: string) => {
            return str.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase());
        });

        // Environment variable name formatting
        this.nunjucksEnv.addFilter("env_name", (str: string) => {
            return str
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .replace(/_+/g, "_");
        });
    }

    /** Setup Handlebars helpers */
    private setupHandlebarsHelpers(): void {
        // Date formatting helper
        Handlebars.registerHelper(
            "dateformat",
            (date: any, format: string = "ISO") => {
                const d = new Date(date);
                if (format === "ISO") return d.toISOString();
                if (format === "date") return d.toDateString();
                if (format === "time") return d.toTimeString();
                return d.toString();
            }
        );

        // JSON helper
        Handlebars.registerHelper("json", (obj: any, indent: number = 2) => {
            return new Handlebars.SafeString(JSON.stringify(obj, null, indent));
        });

        // Case transformation helpers
        Handlebars.registerHelper("snake_case", (str: string) => {
            return str.replace(
                /[A-Z]/g,
                (letter) => `_${letter.toLowerCase()}`
            );
        });

        Handlebars.registerHelper("kebab_case", (str: string) => {
            return str.replace(
                /[A-Z]/g,
                (letter) => `-${letter.toLowerCase()}`
            );
        });

        Handlebars.registerHelper("camel_case", (str: string) => {
            return str.replace(/[-_](.)/g, (_, letter) => letter.toUpperCase());
        });

        Handlebars.registerHelper("env_name", (str: string) => {
            return str
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "_")
                .replace(/_+/g, "_");
        });

        // Equality helper
        Handlebars.registerHelper("eq", (a: any, b: any) => a === b);

        // Comparison helpers
        Handlebars.registerHelper("gt", (a: any, b: any) => a > b);
        Handlebars.registerHelper("lt", (a: any, b: any) => a < b);
        Handlebars.registerHelper("gte", (a: any, b: any) => a >= b);
        Handlebars.registerHelper("lte", (a: any, b: any) => a <= b);
    }

    /** Process variables to handle complex types */
    private processVariables(variables: Record<string, any>): any {
        const seen = new WeakSet();
        return this.processValue(variables, seen);
    }

    /** Recursively process values for template compatibility */
    private processValue(value: any, seen: WeakSet<object>): any {
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
            return Number(value);
        }

        // Handle Symbol
        if (typeof value === "symbol") {
            return value.description || "Symbol";
        }

        // Handle functions - convert to string representation
        if (typeof value === "function") {
            return `[Function: ${value.name || "anonymous"}]`;
        }

        // Handle objects and arrays
        if (typeof value === "object") {
            // Check for circular references
            if (seen.has(value)) {
                return "[Circular Reference]";
            }
            seen.add(value);

            try {
                // Handle arrays
                if (Array.isArray(value)) {
                    return value.map((item) => this.processValue(item, seen));
                }

                // Handle Date objects
                if (value instanceof Date) {
                    return value; // Keep as Date object for template engines
                }

                // Handle RegExp
                if (value instanceof RegExp) {
                    return {
                        source: value.source,
                        flags: value.flags,
                        toString: () => value.toString(),
                    };
                }

                // Handle Error objects
                if (value instanceof Error) {
                    return {
                        name: value.name,
                        message: value.message,
                        stack: value.stack,
                    };
                }

                // Handle Map
                if (value instanceof Map) {
                    const obj: Record<string, any> = {};
                    for (const [k, v] of value.entries()) {
                        const key = typeof k === "string" ? k : String(k);
                        obj[key] = this.processValue(v, seen);
                    }
                    return obj;
                }

                // Handle Set
                if (value instanceof Set) {
                    return Array.from(value).map((v) =>
                        this.processValue(v, seen)
                    );
                }

                // Handle URL
                if (value instanceof URL) {
                    return {
                        href: value.href,
                        origin: value.origin,
                        pathname: value.pathname,
                        search: value.search,
                        hash: value.hash,
                        toString: () => value.toString(),
                    };
                }

                // Handle Buffer (Node.js)
                if (typeof Buffer !== "undefined" && value instanceof Buffer) {
                    return {
                        data: value.toString("base64"),
                        length: value.length,
                        encoding: "base64",
                    };
                }

                // Handle plain objects
                const processed: Record<string, any> = {};
                for (const [key, val] of Object.entries(value)) {
                    try {
                        processed[key] = this.processValue(val, seen);
                    } catch (error) {
                        processed[key] = `[Error: ${error}]`;
                    }
                }
                return processed;
            } finally {
                seen.delete(value);
            }
        }

        // Fallback
        return String(value);
    }
}
