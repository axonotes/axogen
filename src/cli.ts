import {Command} from "commander";
import {getVersion} from "./version";
import {loadConfig} from "./core/config";
import {buildDynamicCommands} from "./cli-helpers/builder";
import {createGenerateCommand} from "./cli-helpers/commands/generate";
import type {AxogenConfig} from "./types";

async function createCLI(): Promise<Command> {
    const cli = new Command();

    cli.name("axogen")
        .description("TypeScript-native configuration and task management")
        .version(getVersion());

    // Global options
    cli.option("--verbose", "Enable verbose logging");

    // Load config once
    let config: AxogenConfig;
    try {
        config = await loadConfig();
    } catch (error) {
        // If config fails to load, still allow basic commands
        console.warn(
            "⚠️  Could not load config:",
            error instanceof Error ? error.message : error
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
            console.log("ℹ️  No commands defined in config");
        });
    }

    cli.addCommand(runCommand);

    return cli;
}

// Run CLI
createCLI()
    .then((cli) => cli.parse())
    .catch((error) => {
        console.error("❌ Failed to initialize CLI:", error);
        process.exit(1);
    });
