import {Command} from "commander";
import type {ZodAxogenConfig} from "../../config/types";
import {targetGenerator} from "../../generators";
import {logger} from "../../utils/console/logger.ts";

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
            console.log();
            logger.start("Generating configuration files...");

            if (!config.targets || Object.keys(config.targets).length === 0) {
                logger.info("No targets defined in config");
                return;
            }

            const startTime = Date.now();

            // Determine which targets to generate
            const targetsToGenerate = options.target
                ? {[options.target]: config.targets[options.target]}
                : config.targets;

            if (options.target && !config.targets[options.target]) {
                logger.error(`✗ Target "${options.target}" not found`);
                console.log();
                logger.info("Available targets:");
                Object.keys(config.targets).forEach((name) =>
                    logger.bullet(name, 1)
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
                logger.success("Results:");

                results.forEach((result) => {
                    if (result.success) {
                        if (options.dryRun) {
                            logger.file(
                                `Would generate <b>${result.name}</b>`,
                                result.path
                            );
                        } else {
                            logger.file(
                                `Generated <b>${result.name}</b>`,
                                result.path
                            );
                        }
                    } else {
                        logger.logF(
                            `<error>✗</error> Failed to generate <b>${result.name}</b>: <error>${result.error || "Unknown error"}</error>`
                        );
                    }
                });

                const successCount = results.filter((r) => r.success).length;
                const errorCount = results.length - successCount;
                const duration = (Date.now() - startTime).toFixed(2);

                console.log(); // Add spacing before summary
                if (errorCount === 0) {
                    logger.logF(
                        `<success>Generation complete!</success> <muted>${successCount} file${successCount !== 1 ? "s" : ""}</muted> <subtle>[${duration}ms]</subtle>`
                    );
                } else {
                    logger.logF(
                        `<warning>Generation complete with errors!</warning> <muted>${successCount} success, ${errorCount} failed</muted> <subtle>[${duration}ms]</subtle>`
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
