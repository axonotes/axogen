/**
 * Main entry point for Axogen - a TypeScript-native configuration and task management library.
 * This module provides all public APIs and utilities for working with Axogen configurations,
 * commands, and target generation.
 */

import {createCLI} from "./cli-helpers";
import {logger} from "./utils/console/logger.ts";

/**
 * Runs the CLI with the provided arguments (or process.argv if not provided).
 * This function can be imported and called from other packages.
 * @param argv Optional array of command line arguments
 */
export async function runCLI(argv?: string[]): Promise<void> {
    try {
        const cli = await createCLI();
        await cli.parseAsync(argv || process.argv);
    } catch (error) {
        logger.error(`Failed to initialize CLI: ${error}`);
        process.exit(1);
    }
}

/** Core CLI helper functions for command execution */
export {exec, executeCommand, liveExec} from "./cli-helpers";

/** Configuration loading utilities */
export {loadConfig} from "./config/loader.ts";

/** Environment variable loading utilities */
export {loadEnv} from "./env/load.ts";

/** Secret handling utilities for secure configuration management */
export {unsafe} from "./utils/secrets";

/** Re-export all types for user convenience */
export type * from "./config/types";
export * from "./config/types";

/** Re-export loaders for convenience */
export * from "./loaders";

/** Re-export Zod for convenience */
export * as z from "zod";
