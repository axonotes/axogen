import {Command} from "commander";
import {getVersion} from "./version.ts";
import {loadConfig} from "./core/config.ts";

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

            const targetNames = options.target
                ? [options.target]
                : Object.keys(config.targets);

            for (const targetName of targetNames) {
                const target = config.targets[targetName];
                if (!target) {
                    console.log(`❌ Target "${targetName}" not found`);
                    continue;
                }

                if (options.dryRun) {
                    console.log(
                        `📄 Would generate: ${target.path} (${target.type})`
                    );
                } else {
                    console.log(`📄 Generated: ${target.path}`);
                    // TODO: Implement actual file generation
                }
            }

            console.log("✅ Generation complete!");
        } catch (error) {
            console.error(
                "❌ Failed to generate files:",
                error instanceof Error ? error.message : error
            );
            process.exit(1);
        }
    });

cli.parse();
