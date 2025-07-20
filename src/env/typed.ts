import {z} from "zod";
import type {EnvSchema, ParsedEnv, EnvConfig} from "../types";
import {config} from "dotenv";

config({
    path: ".env",
});

/**
 * Default configuration for environment parsing
 */
const DEFAULT_CONFIG: Required<EnvConfig> = {
    exitOnError: true,
    silent: false,
};

/**
 * Formats and displays Zod validation errors in a user-friendly way
 * Updated for Zod v4 error handling
 */
function handleValidationError(
    error: z.ZodError,
    config: Required<EnvConfig>
): void {
    if (!config.silent) {
        console.error("❌ Environment variable validation failed:");

        // Group issues by type for better readability
        const missingErrors = error.issues.filter(
            (issue) =>
                issue.code === "invalid_type" &&
                "received" in issue &&
                issue.received === "undefined"
        );
        const typeErrors = error.issues.filter(
            (issue) =>
                !(
                    issue.code === "invalid_type" &&
                    "received" in issue &&
                    issue.received === "undefined"
                )
        );

        if (missingErrors.length > 0) {
            console.error("\n  Missing required variables:");
            missingErrors.forEach((issue) => {
                console.error(
                    `    - ${issue.path.join(".")}: ${issue.message}`
                );
            });
        }

        if (typeErrors.length > 0) {
            console.error("\n  Type validation errors:");
            typeErrors.forEach((issue) => {
                console.error(
                    `    - ${issue.path.join(".")}: ${issue.message}`
                );

                // Add more specific error context for Zod v4
                if (issue.code === "invalid_type") {
                    const invalidTypeIssue = issue as any;
                    if (
                        invalidTypeIssue.expected &&
                        invalidTypeIssue.received
                    ) {
                        console.error(
                            `      Expected: ${invalidTypeIssue.expected}, received: ${invalidTypeIssue.received}`
                        );
                    }
                } else if (issue.code === "too_small") {
                    const tooSmallIssue = issue as any;
                    if (tooSmallIssue.minimum !== undefined) {
                        console.error(
                            `      Minimum: ${tooSmallIssue.minimum}`
                        );
                    }
                } else if (issue.code === "too_big") {
                    const tooBigIssue = issue as any;
                    if (tooBigIssue.maximum !== undefined) {
                        console.error(`      Maximum: ${tooBigIssue.maximum}`);
                    }
                }
            });
        }

        console.error(
            "\n  💡 Tip: Check your .env file and ensure all required variables are set with correct values.\n"
        );
    }

    if (config.exitOnError) {
        process.exit(1);
    } else {
        throw error;
    }
}

/**
 * Creates a typed environment object from a Zod schema with runtime validation
 * Updated for Zod v4 with improved error handling and performance
 *
 * @example
 * ```ts
 * import { z } from 'zod';
 * import { createTypedEnv } from '@axonotes/axogen';
 *
 * const env = createTypedEnv({
 *   API_KEY: z.string({
 *     error: "API_KEY is required and must be a string"
 *   }),
 *   PORT: z.coerce.number().default(3000),
 *   NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
 *   DATABASE_URL: z.string().url({
 *     message: "DATABASE_URL must be a valid URL"
 *   }),
 * });
 *
 * // env.API_KEY is string
 * // env.PORT is number
 * // env.NODE_ENV is 'development' | 'test' | 'production'
 * // env.DATABASE_URL is string (validated as URL)
 * ```
 *
 * @param schema - Zod schema defining environment variables and their types
 * @param config - Optional configuration for error handling and behavior
 * @returns Typed environment object with runtime validation
 */
export function createTypedEnv<T extends EnvSchema>(
    schema: T,
    config: EnvConfig = {}
): ParsedEnv<T> {
    const finalConfig = {...DEFAULT_CONFIG, ...config};

    try {
        const zodSchema = z.object(schema);
        const result = zodSchema.parse(process.env);

        if (!finalConfig.silent) {
            console.log("✅ Environment variables validated successfully");
        }

        return result as ParsedEnv<T>;
    } catch (error) {
        if (error instanceof z.ZodError) {
            handleValidationError(error, finalConfig);
            // This line is only reached if exitOnError is false
            throw error;
        } else {
            if (!finalConfig.silent) {
                console.error(
                    "❌ Failed to parse environment variables:",
                    error
                );
            }
            if (finalConfig.exitOnError) {
                process.exit(1);
            }
            throw error;
        }
    }
}
