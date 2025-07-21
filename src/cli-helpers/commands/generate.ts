import {Command} from "commander";
import type {AxogenConfig} from "../../types";
import {targetGenerator} from "../../generators";

export function createGenerateCommand(config: AxogenConfig): Command {
    return new Command("generate")
        .alias("gen")
        .description("Generate configuration files from targets")
        .option("--target <name>", "Generate specific target only")
        .option(
            "--dry-run",
            "Show what would be generated without writing files"
        )
        .action(async (options) => {
            console.log("🚀 Generating configuration files...");

            if (!config.targets || Object.keys(config.targets).length === 0) {
                console.log("ℹ️  No targets defined in config");
                return;
            }

            // Determine which targets to generate
            const targetsToGenerate = options.target
                ? {[options.target]: config.targets[options.target]}
                : config.targets;

            if (options.target && !config.targets[options.target]) {
                console.error(`❌ Target "${options.target}" not found`);
                console.log("\nAvailable targets:");
                Object.keys(config.targets).forEach((name) =>
                    console.log(`  ${name}`)
                );
                process.exit(1);
            }

            try {
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
                        const message = options.dryRun
                            ? `📄 Would generate: ${result.path}`
                            : `📄 Generated: ${result.path}`;
                        console.log(message);
                    } else {
                        errorCount++;
                        console.error(
                            `❌ Failed to generate ${result.name}: ${result.error}`
                        );
                    }
                }

                // Summary
                if (errorCount === 0) {
                    console.log(
                        `✅ Generation complete! (${successCount} files)`
                    );
                } else {
                    console.error(
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
}
