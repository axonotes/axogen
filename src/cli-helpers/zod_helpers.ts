import * as z from "zod";
import type {
    ZodAdvancedCommand,
    ZodAnyCommand,
    ZodGroupCommand,
    ZodStringCommand,
} from "../config/types";

export function getCommandHelp(command: ZodAnyCommand): string | undefined {
    if (typeof command === "string" || typeof command === "function") {
        return undefined;
    }
    return command.help;
}

export function isStringCommand(
    command: ZodAnyCommand
): command is ZodStringCommand {
    return typeof command === "object" && command.type === "string";
}

export function isAdvancedCommand(
    command: ZodAnyCommand
): command is ZodAdvancedCommand {
    return typeof command === "object" && command.type === "advanced";
}

export function isGroupCommand(
    command: ZodAnyCommand
): command is ZodGroupCommand {
    return typeof command === "object" && command.type === "group";
}

// =============================================
// ZOD-BASED VALIDATION
// =============================================

export function validateOptionsWithZod(
    rawOptions: Record<string, any>,
    optionsSchema: Record<string, z.ZodType>
): any {
    // Preprocess: Convert comma-separated strings to arrays for array schemas
    const processedOptions = {...rawOptions};

    for (const [key, schema] of Object.entries(optionsSchema)) {
        const info = analyzeZodSchema(schema);
        if (
            info.baseType === "array" &&
            typeof processedOptions[key] === "string"
        ) {
            // Split comma-separated string into array
            processedOptions[key] = processedOptions[key]
                .split(",")
                .map((s: string) => s.trim());
        }
    }

    // Let Zod handle all type conversion, defaults, validation
    return z.object(optionsSchema).parse(processedOptions);
}

export function validateArgsWithZod(
    rawArgs: any[],
    argsSchema: Record<string, z.ZodType>
): any {
    const argNames = Object.keys(argsSchema);
    const argsObject: Record<string, any> = {};

    // Map positional args to schema keys
    for (let i = 0; i < argNames.length; i++) {
        const argName = argNames[i];
        const value = rawArgs[i];
        if (value !== undefined) {
            argsObject[argName] = value;
        }
    }

    try {
        // Let Zod handle all type conversion, defaults, validation
        return z.object(argsSchema).parse(argsObject);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new z.ZodError([
                ...error.issues.map((issue) => ({
                    ...issue,
                    path: ["args", ...issue.path],
                })),
            ]);
        }
        throw error;
    }
}

// =============================================
// SIMPLIFIED SCHEMA ANALYSIS
// =============================================

export interface ZodSchemaInfo {
    baseType: string;
    isOptional: boolean;
    description?: string;
}

export function analyzeZodSchema(schema: z.ZodType): ZodSchemaInfo {
    let currentSchema = schema;
    let isOptional = false;
    let description: string | undefined = undefined;

    // Traverse wrapper schemas only - stop at core types
    while (currentSchema) {
        // Extract description
        if (!description) {
            description = extractDescription(currentSchema);
        }

        // Check for optional/nullable markers
        const type = getZodType(currentSchema);

        if (type === "optional" || type === "nullable" || type === "default") {
            isOptional = true;
            // These are wrapper types - unwrap them
            if (canUnwrap(currentSchema)) {
                currentSchema = currentSchema.unwrap();
            } else {
                break;
            }
        } else {
            // This is a core type (array, string, number, etc.) - stop here!
            break;
        }
    }

    // Get final base type
    const baseType = getZodType(currentSchema);

    return {
        baseType,
        isOptional,
        description,
    };
}

export function getZodType(schema: z.ZodType): string {
    return schema._zod?.def?.type || "unknown";
}

export function extractDescription(schema: z.ZodType): string | undefined {
    try {
        const meta = schema.meta();
        if (meta && typeof meta.description === "string") {
            return meta.description;
        }
    } catch {
        // Schema doesn't support meta
    }
    return undefined;
}

export function canUnwrap(
    schema: z.ZodType
): schema is z.ZodType & {unwrap(): z.ZodType} {
    return typeof (schema as any).unwrap === "function";
}
