import {Command} from "commander";
import {getVersion} from "./version";
import {loadConfig} from "./core/config";
import {buildDynamicCommands} from "./cli-helpers/builder";
import {createGenerateCommand} from "./cli-helpers/commands/generate";
import {pretty, configurePretty, LogLevel} from "./utils/pretty";
import type {AxogenConfig} from "./types";

async function createCLI(): Promise<Command> {
    const cli = new Command();

    cli.name("axogen")
        .description("TypeScript-native configuration and task management")
        .version(getVersion());

    // Global options
    cli.option("--verbose", "Enable verbose logging");
    cli.option("--quiet", "Suppress non-essential output");
    cli.option("--no-color", "Disable colored output");

    // Load config once
    let config: AxogenConfig;
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

    // Configure pretty printing based on global options
    cli.hook("preAction", (thisCommand) => {
        const opts = thisCommand.optsWithGlobals();
        configurePretty({
            verbose: opts.verbose || false,
            logLevel: opts.quiet
                ? LogLevel.WARN
                : opts.verbose
                  ? LogLevel.DEBUG
                  : LogLevel.INFO,
            colorEnabled:
                !opts.noColor && !process.env.NO_COLOR && process.stdout.isTTY,
        });
    });

    return cli;
}

// Run CLI
createCLI()
    .then((cli) => cli.parse())
    .catch((error) => {
        pretty.error(`Failed to initialize CLI: ${error}`);
        process.exit(1);
    });
