import {z} from "zod";

/**
 * Schema definition for environment variables
 * Maps environment variable names to their Zod validators
 * Compatible with Zod v4
 */
export type EnvSchema = Record<string, z.ZodType>;

/**
 * Inferred TypeScript types from environment schema
 * Extracts the TypeScript type from each Zod validator
 */
export type ParsedEnv<T extends EnvSchema> = {
    readonly [K in keyof T]: z.infer<T[K]>;
};

/**
 * Configuration for environment variable parsing
 */
export interface EnvConfig {
    /** Whether to exit process on validation failure (default: true) */
    exitOnError?: boolean;
    /** Whether to log success/error messages (default: false) */
    silent?: boolean;
}
