import {z} from "zod";
import type {EnvSchema, ParsedEnv, EnvConfig} from "../types";
import {config} from "dotenv";
import {pretty} from "../utils/pretty";

config({
    path: ".env.axogen",
    quiet: true,
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
 * Updated for Zod v4 error handling with new pretty system
 */
function handleValidationError(
    error: z.ZodError,
    config: Required<EnvConfig>
): void {
    if (!config.silent) {
        const validationErrors = error.issues.map((issue) => {
            const field = issue.path.join(".");

            // Determine error type based on Zod error codes
            let type: "missing" | "invalid" | "type" = "invalid";
            if (issue.code === "invalid_type" && issue.input === undefined) {
                type = "missing";
            } else if (issue.code === "invalid_type") {
                type = "type";
            }

            // Create user-friendly error messages
            let message = issue.message;
            if (issue.code === "invalid_type") {
                const invalidTypeIssue = issue as any;
                if (
                    invalidTypeIssue.expected &&
                    invalidTypeIssue.received &&
                    type === "type"
                ) {
                    message = `expected ${invalidTypeIssue.expected}, got ${invalidTypeIssue.received}`;
                }
            } else if (issue.code === "too_small") {
                const tooSmallIssue = issue as any;
                if (tooSmallIssue.minimum !== undefined) {
                    message = `minimum value: ${tooSmallIssue.minimum}`;
                }
            } else if (issue.code === "too_big") {
                const tooBigIssue = issue as any;
                if (tooBigIssue.maximum !== undefined) {
                    message = `maximum value: ${tooBigIssue.maximum}`;
                }
            }

            return {
                field,
                message,
                type,
            };
        });

        pretty.validation.errorGroup(
            "Environment variable validation failed",
            validationErrors
        );

        console.log();
        pretty.info(
            `Check your ${pretty.text.accent(".env.axogen")} file and ensure all required variables are set with correct values.`
        );
        console.log();
    }

    if (config.exitOnError) {
        process.exit(1);
    } else {
        throw error;
    }
}

/**
 *
 *
 * @example
 * ```ts
 * import * as z from 'zod';
 * import { loadEnv } from '@axonotes/axogen';
 *
 * const env = loadEnv({
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
export function loadEnv<T extends EnvSchema>(
    schema: T,
    config: EnvConfig = {}
): ParsedEnv<T> {
    const finalConfig = {...DEFAULT_CONFIG, ...config};

    try {
        const zodSchema = z.object(schema);
        const result = zodSchema.parse(process.env);

        if (!finalConfig.silent) {
            pretty.success("Environment variables validated successfully");
        }

        return result as ParsedEnv<T>;
    } catch (error) {
        if (error instanceof z.ZodError) {
            handleValidationError(error, finalConfig);
            // This line is only reached if exitOnError is false
            throw error;
        } else {
            if (!finalConfig.silent) {
                pretty.error(`Failed to parse environment variables: ${error}`);
            }
            if (finalConfig.exitOnError) {
                process.exit(1);
            }
            throw error;
        }
    }
}

/**
 * DEPRECATED: Use `loadEnv` instead
 * @deprecated
 */
export function createTypedEnv<T extends EnvSchema>(
    schema: T,
    config: EnvConfig = {}
): ParsedEnv<T> {
    return loadEnv(schema, config);
}
