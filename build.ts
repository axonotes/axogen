#!/usr/bin/env bun

import {build} from "bun";
import {writeFileSync, chmodSync, mkdirSync, rmSync, existsSync} from "fs";

// Pretty console output
const log = {
    info: (msg: string) => console.log(`ℹ️ ${msg}`),
    success: (msg: string) => console.log(`--- Success: ${msg} ---`),
    error: (msg: string) => console.error(`❌ ${msg}`),
    step: (msg: string) => console.log(`🔨 ${msg}`),
    warn: (msg: string) => console.log(`⚠️  ${msg}`),
};

async function main() {
    const startTime = Date.now();

    log.step("Building axogen CLI...");

    setupDirectories();
    await typeCheck();

    const buildResult = await buildCLI();

    if (!buildResult.success) {
        handleBuildFailure(buildResult);
        return;
    }

    await createExecutable();

    cleanup();

    const duration = Date.now() - startTime;
    log.success(`Build completed in ${duration}ms`);
    log.info('Run "./bin/axogen --version" to test');
}

function setupDirectories() {
    const dirs = ["bin", "bin/build", "dist"];

    // Clean existing bin directory
    if (existsSync("bin")) {
        rmSync("bin", {recursive: true});
    }

    // Create fresh directories
    dirs.forEach((dir) => mkdirSync(dir, {recursive: true}));
    log.info("Directories prepared");
}

async function typeCheck() {
    log.step("Checking TypeScript...");

    try {
        // Use bun to type-check without emitting files
        const result = Bun.spawn(["bun", "tsc", "--noEmit"], {
            cwd: process.cwd(),
            stderr: "pipe",
            stdout: "pipe",
        });

        const errorOutput = await new Response(result.stdout).text();

        if (errorOutput.trim() !== "") {
            log.error("TypeScript errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        log.info("TypeScript check passed");
    } catch (error) {
        // Fallback: if tsc not available, warn but continue
        log.warn("TypeScript compiler not found, skipping type check");
        log.info("Install typescript globally: bun add -g typescript");
    }
}

async function buildCLI() {
    log.step("Compiling TypeScript...");

    return await build({
        entrypoints: ["src/cli.ts"],
        outdir: "bin/build",
        target: "node",
    });
}

function handleBuildFailure(result: Bun.BuildOutput) {
    log.error("Build failed!");

    if (result.logs.length > 0) {
        console.log("\nBuild errors:");
        result.logs.forEach((logEntry) => {
            console.error(`  ${logEntry}`);
        });
    }

    cleanup();
    process.exit(1);
}

async function createExecutable() {
    log.step("Creating executable...");

    const builtCode = await Bun.file("bin/build/cli.js").text();
    const executableContent = `#!/usr/bin/env node
${builtCode}`;

    writeFileSync("bin/axogen", executableContent);
    chmodSync("bin/axogen", "755");

    log.info("Executable created at bin/axogen");
}

function cleanup() {
    if (existsSync("bin/build")) {
        rmSync("bin/build", {recursive: true});
    }
}

// Run the build
main().catch((error) => {
    log.error(`Unexpected error: ${error.message}`);
    process.exit(1);
});
