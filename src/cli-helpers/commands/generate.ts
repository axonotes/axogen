import {Command} from "commander";
import type {ZodAxogenConfig} from "../../config/types";
import {targetGenerator} from "../../generators";
import {logger} from "../../utils/logger.ts";

export function createGenerateCommand(config: ZodAxogenConfig): Command {
    return new Command("generate")
        .alias("gen")
        .description("Generate configuration files from targets")
        .option("--target <name>", "Generate specific target only")
        .option(
            "--dry-run",
            "Show what would be generated without writing files"
        )
        .action(async (options) => {
            logger.start("Generating configuration files...");

            if (!config.targets || Object.keys(config.targets).length === 0) {
                logger.info("No targets defined in config");
                return;
            }

            // Determine which targets to generate
            const targetsToGenerate = options.target
                ? {[options.target]: config.targets[options.target]}
                : config.targets;

            if (options.target && !config.targets[options.target]) {
                logger.error(`Target "${options.target}" not found`);
                console.log();
                logger.info("Available targets:");
                Object.keys(config.targets).forEach((name) =>
                    logger.format.bullet(name, 1)
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

                console.log();
                console.log(logger.text.success("Results:"));

                results.forEach((result) => {
                    if (result.success) {
                        if (options.dryRun) {
                            logger.file(
                                `Would generate ${logger.text.file(result.name)} at ${logger.text.muted(result.path)}`
                            );
                        } else {
                            logger.file(
                                `Generated ${logger.text.file(result.name)} at ${logger.text.muted(result.path)}`
                            );
                        }
                    } else {
                        logger.error(
                            `${logger.text.normal("Failed to generate")} ${logger.text.error(result.name)}: ${logger.text.error(result.error || "Unknown error")}`
                        );
                    }
                });

                const successCount = results.filter((r) => r.success).length;
                const errorCount = results.length - successCount;

                console.log(); // Add spacing before summary
                if (errorCount === 0) {
                    logger.success(
                        `${logger.text.normal("Generation complete!")} ${logger.text.success(`(${successCount} file${successCount !== 1 ? "s" : ""})`)}`
                    );
                } else {
                    logger.warn(
                        `Generation complete with errors! ${successCount} success, ${errorCount} failed`
                    );
                }

                // Exit with error code if any targets failed
                const hasErrors = results.some((result) => !result.success);
                if (hasErrors) {
                    process.exit(1);
                }
            } catch (error) {
                logger.error(
                    `Failed to generate files: ${error instanceof Error ? error.message : error}`
                );
                process.exit(1);
            }
        });
}
