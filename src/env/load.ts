import {z} from "zod";
import {config, type DotenvConfigOptions} from "@dotenvx/dotenvx";
import {isGitIgnored} from "../git/ignore-checker.ts";
import {zodIssuesToErrors} from "../utils/helpers.ts";
import {logger} from "../utils/console/logger.ts";

interface LoadEnvConfig extends DotenvConfigOptions {
    /**
     * Whether to exit the process on validation error
     * @default true
     */
    exitOnError?: boolean;

    /**
     * Whether to suppress success messages
     * @default false
     */
    silent?: boolean;

    /**
     * Path to the .env file
     * @default ".env.axogen"
     */
    path?: string;

    /**
     * Whether to suppress dotenv messages
     * @default true
     */
    quiet?: boolean;

    /**
     * Encoding of the .env file
     * @default "utf8"
     */
    encoding?: BufferEncoding;
}

/**
 * Default configuration for environment parsing
 */
const DEFAULT_CONFIG: LoadEnvConfig = {
    path: ".env.axogen",
    quiet: true,
    encoding: "utf8",
    exitOnError: true,
    silent: false,
};

/**
 * Load and validate environment variables using dotenvx and a Zod schema.
 * IMPORTANT: Environment variables are injected into process.env BEFORE validation.
 * If validation fails, the program will exit (if configured to do so), but the variables
 * will already be available in process.env.
 * @param schema - Zod schema to validate environment variables against
 * @param envConfig - Configuration options for loading environment variables
 * @returns Validated environment variables matching the schema
 * @throws Error if validation fails or configuration is invalid
 */
export function loadEnv<TSchema extends z.ZodType>(
    schema: TSchema,
    envConfig: LoadEnvConfig = {}
): z.infer<TSchema> {
    const finalConfig: LoadEnvConfig = {
        ...DEFAULT_CONFIG,
        ...envConfig,
    };

    if (typeof finalConfig.path !== "string") {
        throw new Error("The 'path' option must be a string.");
    }

    if (!isGitIgnored(finalConfig.path) && !finalConfig.quiet) {
        logger.warn("The .env.axogen file is not ignored by git.");
    }

    config(finalConfig);

    try {
        const result = schema.parse(process.env);

        if (!finalConfig.silent) {
            logger.success("Environment variables validated successfully");
        }

        return result;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const validationErrors = zodIssuesToErrors(error.issues);

            if (!finalConfig.silent) {
                logger.validation(
                    `Environment variable validation failed for file: <subtle>${finalConfig.path}</subtle>`,
                    validationErrors
                );
            }

            if (finalConfig.exitOnError) {
                process.exit(1);
            }

            throw new Error("Environment variable validation failed");
        } else {
            if (!finalConfig.silent) {
                logger.error(`Failed to parse environment variables: ${error}`);
            }
            if (finalConfig.exitOnError) {
                process.exit(1);
            }
            throw error;
        }
    }
}
