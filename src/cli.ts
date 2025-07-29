/**
 * Command-line interface setup and configuration for Axogen.
 * This module creates and configures the main CLI application with all available commands,
 * options, and hooks for logging, theming, and configuration loading.
 */

import {Command} from "commander";
import {getVersion} from "./version";
import {loadConfig} from "./config/loader.ts";
import {buildDynamicCommands} from "./cli-helpers/builder";
import {createGenerateCommand} from "./cli-helpers/commands/generate";
import {createThemeCommand} from "./cli-helpers/commands/theme";
import {pretty, configurePretty, LogLevel, setTheme} from "./utils/pretty";
import {themes, type ThemeName} from "./utils/themes";
import type {ZodAxogenConfig} from "./config/types";

/**
 * Creates and configures the main CLI application with all commands and options.
 * Sets up global options, pre-action hooks for configuration, and dynamic commands.
 * @returns Promise that resolves to the configured Command instance
 */
async function createCLI(): Promise<Command> {
    const cli = new Command();

    cli.name("axogen")
        .description("TypeScript-native configuration and task management")
        .version(getVersion());

    // Global options
    cli.option("--verbose", "Enable verbose logging");
    cli.option("--quiet", "Suppress non-essential output");
    cli.option("--no-color", "Disable colored output");
    cli.option(
        "--theme <name>",
        `Color theme to use (${Object.keys(themes).join(", ")})`,
        process.env.AXOGEN_THEME || "doom-one" // Default theme
    );

    // Configure pretty printing based on global options early
    cli.hook("preAction", (thisCommand) => {
        const opts = thisCommand.optsWithGlobals();

        // Validate and set theme
        if (opts.theme && !(opts.theme in themes)) {
            console.error(
                `❌ Invalid theme "${opts.theme}". Available themes: ${Object.keys(themes).join(", ")}`
            );
            process.exit(1);
        }

        configurePretty({
            verbose: opts.verbose || false,
            logLevel: opts.quiet
                ? LogLevel.WARN
                : opts.verbose
                  ? LogLevel.DEBUG
                  : LogLevel.INFO,
            colorEnabled:
                !opts.noColor && !process.env.NO_COLOR && process.stdout.isTTY,
            theme: opts.theme as ThemeName,
        });

        if (opts.theme) {
            setTheme(opts.theme as ThemeName);
        }
    });

    // Load config once
    let config: ZodAxogenConfig;
    try {
        config = await loadConfig();
    } catch (error) {
        // If config fails to load, still allow basic commands
        pretty.warn(
            `Could not load config: ${error instanceof Error ? error.message : error}`
        );
        config = {};
    }

    // Add built-in commands (pass config to them)
    cli.addCommand(createGenerateCommand(config));
    cli.addCommand(createThemeCommand());

    // Add dynamic commands from config to the "run" command
    const runCommand = new Command("run").description(
        "Run custom commands defined in configuration"
    );

    if (config.commands && Object.keys(config.commands).length > 0) {
        buildDynamicCommands(runCommand, config);
    } else {
        // Add a default action to show available commands or a helpful message
        runCommand.action(() => {
            pretty.info("No commands defined in config");
        });
    }

    cli.addCommand(runCommand);

    return cli;
}

// Run CLI
createCLI()
    .then((cli) => cli.parse())
    .catch((error) => {
        pretty.error(`Failed to initialize CLI: ${error}`);
        process.exit(1);
    });
