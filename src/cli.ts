/**
 * Command-line interface setup and configuration for Axogen.
 * This module creates and configures the main CLI application with all available commands,
 * options, and hooks for logging, theming, and configuration loading.
 */

import {pretty} from "./utils/pretty";
import {createCLI} from "./cli-helpers";

// Run CLI
createCLI()
    .then((cli) => cli.parse())
    .catch((error) => {
        pretty.error(`Failed to initialize CLI: ${error}`);
        process.exit(1);
    });
