import {Command} from "commander";
import {getVersion} from "./version.ts";
import {loadConfig} from "./core/config.ts";
import {targetGenerator} from "./generators";
import {commandRunner} from "./commands";
import type {CommandGlobalContext} from "./types";

const cli = new Command();

cli.name("axogen")
    .description("TypeScript-native configuration and task management")
    .version(getVersion());

// Global options
cli.option("-c, --config <path>", "Path to config file").option(
    "--verbose",
    "Enable verbose logging"
);

// Generate command
cli.command("generate")
    .alias("gen")
    .description("Generate configuration files from targets")
    .option("--target <name>", "Generate specific target only")
    .option("--dry-run", "Show what would be generated without writing files")
    .action(async (options) => {
        try {
            const config = await loadConfig(cli.opts().config);
            console.log("🚀 Generating configuration files...");

            if (!config.targets) {
                console.log("ℹ️  No targets defined in config");
                return;
            }

            // Determine which targets to generate
            const targetsToGenerate = options.target
                ? {[options.target]: config.targets[options.target]}
                : config.targets;

            if (options.target && !config.targets[options.target]) {
                console.log(`❌ Target "${options.target}" not found`);
                process.exit(1);
            }

            // Generate targets
            const results = await targetGenerator.generateMultiple(
                targetsToGenerate,
                {
                    dryRun: options.dryRun,
                    baseDir: process.cwd(),
                }
            );

            // Report results
            let successCount = 0;
            let errorCount = 0;

            for (const result of results) {
                if (result.success) {
                    successCount++;
                    if (options.dryRun) {
                        console.log(`📄 Would generate: ${result.path}`);
                    } else {
                        console.log(`📄 Generated: ${result.path}`);
                    }
                } else {
                    errorCount++;
                    console.log(
                        `❌ Failed to generate ${result.name}: ${result.error}`
                    );
                }
            }

            // Summary
            if (errorCount === 0) {
                console.log(`✅ Generation complete! (${successCount} files)`);
            } else {
                console.log(
                    `⚠️  Generation completed with errors: ${successCount} success, ${errorCount} failed`
                );
                process.exit(1);
            }
        } catch (error) {
            console.error(
                "❌ Failed to generate files:",
                error instanceof Error ? error.message : error
            );
            process.exit(1);
        }
    });

// Run command - NEW command system
cli.command("run <command-name>")
    .description("Run a custom command defined in the configuration")
    .allowUnknownOption(true)
    .allowExcessArguments(true)
    .action(async (commandName: string, options, command) => {
        try {
            const globalOpts = cli.opts();
            const config = await loadConfig(globalOpts.config);

            if (!config.commands) {
                console.log("ℹ️  No commands defined in config");
                return;
            }

            if (!config.commands[commandName]) {
                console.log(`❌ Command "${commandName}" not found`);
                console.log("\nAvailable commands:");
                Object.keys(config.commands).forEach((name) => {
                    console.log(`  ${name}`);
                });
                process.exit(1);
            }

            // Create global context
            const globalContext: CommandGlobalContext = {
                cwd: process.cwd(),
                env: process.env,
                verbose: globalOpts.verbose || false,
            };

            // Get remaining arguments (everything after the command name)
            const rawArgs = command.args;

            // Parse options from raw args (simple implementation)
            const {parsedOptions, remainingArgs} = parseCommandArgs(rawArgs);

            const result = await commandRunner.runCommand(commandName, {
                config,
                global: globalContext,
                args: remainingArgs,
                options: parsedOptions,
            });

            if (!result.success) {
                console.error(`❌ Command failed: ${result.error}`);
                process.exit(result.exitCode || 1);
            }

            if (globalContext.verbose) {
                console.log("✅ Command completed successfully");
            }
        } catch (error) {
            console.error(
                "❌ Failed to run command:",
                error instanceof Error ? error.message : error
            );
            process.exit(1);
        }
    });

// List commands
cli.command("list")
    .alias("ls")
    .description("List all available commands")
    .action(async () => {
        try {
            const config = await loadConfig(cli.opts().config);

            if (!config.commands || Object.keys(config.commands).length === 0) {
                console.log("ℹ️  No commands defined in config");
                return;
            }

            console.log("📋 Available commands:");
            console.log();

            for (const [name, command] of Object.entries(config.commands)) {
                const help = getCommandHelp(command);
                console.log(`  ${name}${help ? ` - ${help}` : ""}`);
            }
        } catch (error) {
            console.error(
                "❌ Failed to list commands:",
                error instanceof Error ? error.message : error
            );
            process.exit(1);
        }
    });

// Helper function to get command help
function getCommandHelp(command: any): string | undefined {
    if (typeof command === "string" || typeof command === "function") {
        return undefined;
    }

    if (command && typeof command === "object" && "help" in command) {
        return command.help;
    }

    return undefined;
}

// Simple argument parser for command options
function parseCommandArgs(args: string[]): {
    parsedOptions: Record<string, any>;
    remainingArgs: string[];
} {
    const parsedOptions: Record<string, any> = {};
    const remainingArgs: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith("--")) {
            const [key, value] = arg.slice(2).split("=");

            if (value !== undefined) {
                // --key=value format
                parsedOptions[key] = parseValue(value);
            } else if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
                // --key value format
                parsedOptions[key] = parseValue(args[i + 1]);
                i++; // Skip the value
            } else {
                // Boolean flag
                parsedOptions[key] = true;
            }
        } else if (arg.startsWith("-") && arg.length === 2) {
            const key = arg.slice(1);

            if (i + 1 < args.length && !args[i + 1].startsWith("-")) {
                // -k value format
                parsedOptions[key] = parseValue(args[i + 1]);
                i++; // Skip the value
            } else {
                // Boolean flag
                parsedOptions[key] = true;
            }
        } else {
            // Positional argument
            remainingArgs.push(arg);
        }
    }

    // remove first argument since it's the command name
    if (remainingArgs.length > 0 && remainingArgs[0] === args[0]) {
        remainingArgs.shift();
    }

    return {parsedOptions, remainingArgs};
}

// Parse string values to appropriate types
function parseValue(value: string): any {
    // Try to parse as number
    if (/^\d+$/.test(value)) {
        return parseInt(value, 10);
    }

    if (/^\d+\.\d+$/.test(value)) {
        return parseFloat(value);
    }

    // Try to parse as boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Try to parse as JSON array/object
    if (
        (value.startsWith("[") && value.endsWith("]")) ||
        (value.startsWith("{") && value.endsWith("}"))
    ) {
        try {
            return JSON.parse(value);
        } catch {
            // Fall through to string
        }
    }

    return value;
}

cli.parse();
