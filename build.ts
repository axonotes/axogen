#!/usr/bin/env bun

import {build} from "bun";
import {
    writeFileSync,
    chmodSync,
    mkdirSync,
    rmSync,
    existsSync,
    readFileSync,
} from "fs";

// Read version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const version = packageJson.version;

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

    log.step("Building axogen CLI and library...");

    setupDirectories();
    await typeCheck();

    const [libraryResult, cliResult] = await Promise.all([
        buildLibraryWithTsup(),
        buildCLI(),
    ]);

    if (!libraryResult || !cliResult.success) {
        if (!libraryResult) {
            log.error("Library build failed!");
        }
        if (!cliResult.success) {
            handleBuildFailure(cliResult);
        }
        return;
    }

    await createExecutable();
    cleanup();

    const duration = Date.now() - startTime;
    log.success(`Build completed in ${duration}ms`);
    log.info('Run "./bin/axogen --version" to test');
    log.info("Library built with tsup for better IDE support!");
}

function setupDirectories() {
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

        const errorOutput = await new Response(result.stderr).text();

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
    log.step("Compiling CLI with bun...");

    return await build({
        entrypoints: ["src/cli.ts"],
        outdir: "bin/build",
        target: "node",
        define: {
            __VERSION__: `"${version}"`,
        },
    });
}

async function buildLibraryWithTsup() {
    log.step("Building library with tsup...");

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
            log.error("tsup build failed!");
            if (errorOutput) console.error(errorOutput);
            if (output) console.log(output);
            return false;
        }

        log.info("Library built successfully with tsup");
        return true;
    } catch (error) {
        log.error("tsup not available, falling back to bun build");
        log.info("Install tsup: bun add -D tsup");

        // Fallback to original bun build method
        return await buildLibraryFallback();
    }
}

async function buildLibraryFallback() {
    log.step("Building library with bun (fallback)...");

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
        // Also generate types with tsc
        await generateTypes();
    }

    return result.success;
}

async function generateTypes() {
    log.step("Generating TypeScript declarations...");

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
            log.error("TypeScript declaration generation errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        log.info("TypeScript declarations generated");
    } catch (error) {
        log.warn("Could not generate TypeScript declarations");
        log.info("Install typescript: bun add -D typescript");
    }
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
