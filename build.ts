#!/usr/bin/env bun

import {build} from "bun";
import {
    chmodSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "fs";
import {logger} from "./src/utils/console/logger";
import {getTheme, themeManager} from "./src/utils/console/themes";

// Read version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const version = packageJson.version;

async function main() {
    const startTime = Date.now();

    logger.header("Building Axogen CLI and Library");
    console.log(); // Add some spacing

    setupDirectories();
    await typeCheck();

    const [libraryResult, cliResult] = await Promise.all([
        buildLibraryWithTsup(),
        buildCLI(),
    ]);

    if (!libraryResult || !cliResult.success) {
        if (!libraryResult) {
            logger.error("Library build failed!");
        }
        if (!cliResult.success) {
            handleBuildFailure(cliResult);
        }
        return;
    }

    await createExecutable();
    cleanup();

    const duration = Date.now() - startTime;
    console.log(); // Add spacing before final summary
    logger.success(`Build completed <muted>[${duration}ms]</muted>`);

    console.log(); // Add spacing
    logger.divider("Next Steps");
    logger.info(`Run <secondary>./bin/axogen --version</secondary> to test`);
    logger.divider();
    console.log(); // Add spacing
}

function setupDirectories() {
    logger.start("Preparing directories...");

    const dirs = ["bin", "bin/build", "dist"];

    // Clean existing bin directory
    if (existsSync("bin")) {
        rmSync("bin", {recursive: true});
    }

    // Clean existing dist directory
    if (existsSync("dist")) {
        rmSync("dist", {recursive: true});
    }

    // Create fresh directories
    dirs.forEach((dir) => mkdirSync(dir, {recursive: true}));
    logger.success("Directories prepared");
}

async function typeCheck() {
    logger.start("Checking TypeScript...");

    try {
        // Use bun to type-check without emitting files
        const result = Bun.spawn(["bun", "tsc", "--noEmit"], {
            cwd: process.cwd(),
            stderr: "pipe",
            stdout: "pipe",
        });

        const errorOutput = await new Response(result.stderr).text();

        if (errorOutput.trim() !== "") {
            logger.error("TypeScript errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        logger.success("TypeScript check passed");
    } catch (error) {
        // Fallback: if tsc not available, warn but continue
        logger.warn("TypeScript compiler not found, skipping type check");
        logger.info(
            `Install typescript globally: <secondary>bun add -g typescript</secondary>`
        );
    }
}

async function buildCLI() {
    logger.start("Compiling CLI with bun...");

    const result = await build({
        entrypoints: ["src/cli.ts"],
        outdir: "bin/build",
        target: "node",
        define: {
            __VERSION__: `"${version}"`,
        },
    });

    if (result.success) {
        logger.success("CLI compiled successfully");
    }

    return result;
}

async function buildLibraryWithTsup() {
    logger.start("Building library with tsup...");

    try {
        // Check if tsup is available
        const tsupCheck = Bun.spawn(["bun", "tsup", "--version"], {
            cwd: process.cwd(),
            stderr: "pipe",
            stdout: "pipe",
        });

        await tsupCheck.exited;

        if (tsupCheck.exitCode !== 0) {
            throw new Error("tsup not found");
        }

        // Run tsup build
        const result = Bun.spawn(
            [
                "bun",
                "tsup",
                "src/index.ts",
                "--format",
                "esm,cjs",
                "--dts",
                "--sourcemap",
                "--clean",
                "--outDir",
                "dist",
                "--define.__VERSION__",
                `"${version}"`,
                "--external",
                "typescript",
                "--cjs-interop",
                "--splitting",
            ],
            {
                cwd: process.cwd(),
                stderr: "pipe",
                stdout: "pipe",
            }
        );

        const output = await new Response(result.stdout).text();
        const errorOutput = await new Response(result.stderr).text();

        await result.exited;

        if (result.exitCode !== 0) {
            logger.error("tsup build failed!");
            if (errorOutput) console.error(errorOutput);
            if (output) console.log(output);
            return false;
        }

        logger.success("Library built successfully with tsup");
        return true;
    } catch (error) {
        logger.warn("tsup not available, falling back to bun build");
        logger.info(`Install tsup: <secondary>bun add -D tsup</secondary>`);

        // Fallback to original bun build method
        return await buildLibraryFallback();
    }
}

async function buildLibraryFallback() {
    logger.start("Building library with bun (fallback)...");

    const result = await build({
        entrypoints: ["src/index.ts"],
        outdir: "dist",
        target: "node",
        format: "esm",
        sourcemap: "linked",
        define: {
            __VERSION__: `"${version}"`,
        },
    });

    if (result.success) {
        logger.success("Library built with bun");
        // Also generate types with tsc
        await generateTypes();
    }

    return result.success;
}

async function generateTypes() {
    logger.start("Generating TypeScript declarations...");

    try {
        const result = Bun.spawn(
            ["bun", "tsc", "--project", "tsconfig.build.json"],
            {
                cwd: process.cwd(),
                stderr: "pipe",
                stdout: "pipe",
            }
        );

        await result.exited;

        const errorOutput = await new Response(result.stderr).text();

        if (errorOutput.trim() !== "") {
            logger.error("TypeScript declaration generation errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        logger.success("TypeScript declarations generated");
    } catch (error) {
        logger.warn("Could not generate TypeScript declarations");
        logger.info(
            `Install typescript: <secondary>bun add -D typescript</secondary>`
        );
    }
}

function handleBuildFailure(result: Bun.BuildOutput) {
    const theme = themeManager.theme;

    if (result.logs.length > 0) {
        // Group logs by level
        const errors = result.logs.filter((log) => log.level === "error");
        const warnings = result.logs.filter((log) => log.level === "warning");

        // Generate subtitle
        const summaryParts = [
            errors.length > 0 && `${errors.length} errors`,
            warnings.length > 0 && `${warnings.length} warnings`,
        ].filter(Boolean);

        const subtitle = `<muted>Found:</muted> ${result.logs.length} build issue${result.logs.length !== 1 ? "s" : ""} <muted>${summaryParts.join(" • ")}</muted>`;

        // Map logs to items
        const items = result.logs.map((log) => {
            const location = log.position
                ? `${log.position.file}:${log.position.line}:${log.position.column}`
                : "unknown";

            return {
                level: log.level,
                key: location,
                description: log.message,
                extra: log.name,
            };
        });

        logger.logIssues({
            title: "✗ Build failed!",
            subtitle,
            levels: {
                error: {color: "error"},
                warning: {color: "warning"},
            },
            items,
            footer: "Fix these issues and rebuild",
            footerIcon: "!",
            footerIconColor: "warning",
        });
    } else {
        // No specific logs, just show generic error
        logger.error("Build failed with no specific errors!");
    }

    cleanup();
    process.exit(1);
}

async function createExecutable() {
    logger.start("Creating executable...");

    const builtCode = await Bun.file("bin/build/cli.js").text();
    const executableContent = `#!/usr/bin/env node
${builtCode}`;

    writeFileSync("bin/axogen", executableContent);
    chmodSync("bin/axogen", "755");

    logger.file("Executable created", "bin/axogen");
}

function cleanup() {
    if (existsSync("bin/build")) {
        rmSync("bin/build", {recursive: true});
    }
}

// Run the build
main().catch((error) => {
    logger.error(`Unexpected error: ${error.message}`);
    process.exit(1);
});
