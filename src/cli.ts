/**
 * Command-line interface setup and configuration for Axogen.
 * This module creates and configures the main CLI application with all available commands,
 * options, and hooks for logging, theming, and configuration loading.
 */

import {createCLI} from "./cli-helpers";
import {logger} from "./utils/console/logger.ts";

// Run CLI
createCLI()
    .then((cli) => cli.parse())
    .catch((error) => {
        logger.error(`Failed to initialize CLI: ${error}`);
        process.exit(1);
    });
