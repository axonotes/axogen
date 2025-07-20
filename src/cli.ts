import {Command} from "commander";
import {getVersion} from "./version.ts";
import {loadConfig} from "./core/config.ts";
import {targetGenerator} from "./generators";

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

cli.parse();
