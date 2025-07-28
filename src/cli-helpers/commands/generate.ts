import {Command} from "commander";
import type {ZodAxogenConfig} from "../../config/types";
import {targetGenerator} from "../../generators";
import {pretty} from "../../utils/pretty";

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
            pretty.loading("Generating configuration files...");

            if (!config.targets || Object.keys(config.targets).length === 0) {
                pretty.info("No targets defined in config");
                return;
            }

            // Determine which targets to generate
            const targetsToGenerate = options.target
                ? {[options.target]: config.targets[options.target]}
                : config.targets;

            if (options.target && !config.targets[options.target]) {
                pretty.error(`Target "${options.target}" not found`);
                console.log();
                pretty.info("Available targets:");
                Object.keys(config.targets).forEach((name) =>
                    pretty.format.bullet(name, 1)
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

                pretty.generation.results(results, {dryRun: options.dryRun});

                // Exit with error code if any targets failed
                const hasErrors = results.some((result) => !result.success);
                if (hasErrors) {
                    process.exit(1);
                }
            } catch (error) {
                pretty.error(
                    `Failed to generate files: ${error instanceof Error ? error.message : error}`
                );
                process.exit(1);
            }
        });
}
