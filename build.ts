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
import {pretty} from "./src/utils/pretty";

// Read version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const version = packageJson.version;

async function main() {
    const startTime = Date.now();

    pretty.format.header("Building Axogen CLI and Library");
    console.log(); // Add some spacing

    setupDirectories();
    await typeCheck();

    const [libraryResult, cliResult] = await Promise.all([
        buildLibraryWithTsup(),
        buildCLI(),
    ]);

    if (!libraryResult || !cliResult.success) {
        if (!libraryResult) {
            pretty.error("Library build failed!");
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
    pretty.complete(`Build completed in ${duration}ms`);

    console.log(); // Add spacing
    pretty.format.divider("Next Steps");
    pretty.info(`Run ${pretty.text.accent("./bin/axogen --version")} to test`);
    pretty.info("Library built with tsup for better IDE support!");
}

function setupDirectories() {
    pretty.loading("Preparing directories...");

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
    pretty.success("Directories prepared");
}

async function typeCheck() {
    pretty.loading("Checking TypeScript...");

    try {
        // Use bun to type-check without emitting files
        const result = Bun.spawn(["bun", "tsc", "--noEmit"], {
            cwd: process.cwd(),
            stderr: "pipe",
            stdout: "pipe",
        });

        const errorOutput = await new Response(result.stderr).text();

        if (errorOutput.trim() !== "") {
            pretty.error("TypeScript errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        pretty.success("TypeScript check passed");
    } catch (error) {
        // Fallback: if tsc not available, warn but continue
        pretty.warn("TypeScript compiler not found, skipping type check");
        pretty.info(
            `Install typescript globally: ${pretty.text.accent("bun add -g typescript")}`
        );
    }
}

async function buildCLI() {
    pretty.loading("Compiling CLI with bun...");

    const result = await build({
        entrypoints: ["src/cli.ts"],
        outdir: "bin/build",
        target: "node",
        define: {
            __VERSION__: `"${version}"`,
        },
    });

    if (result.success) {
        pretty.success("CLI compiled successfully");
    }

    return result;
}

async function buildLibraryWithTsup() {
    pretty.loading("Building library with tsup...");

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
            pretty.error("tsup build failed!");
            if (errorOutput) console.error(errorOutput);
            if (output) console.log(output);
            return false;
        }

        pretty.success("Library built successfully with tsup");
        return true;
    } catch (error) {
        pretty.warn("tsup not available, falling back to bun build");
        pretty.info(`Install tsup: ${pretty.text.accent("bun add -D tsup")}`);

        // Fallback to original bun build method
        return await buildLibraryFallback();
    }
}

async function buildLibraryFallback() {
    pretty.loading("Building library with bun (fallback)...");

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
        pretty.success("Library built with bun");
        // Also generate types with tsc
        await generateTypes();
    }

    return result.success;
}

async function generateTypes() {
    pretty.loading("Generating TypeScript declarations...");

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
            pretty.error("TypeScript declaration generation errors found!");
            console.error(errorOutput);
            process.exit(1);
        }

        pretty.success("TypeScript declarations generated");
    } catch (error) {
        pretty.warn("Could not generate TypeScript declarations");
        pretty.info(
            `Install typescript: ${pretty.text.accent("bun add -D typescript")}`
        );
    }
}

function handleBuildFailure(result: Bun.BuildOutput) {
    pretty.error("Build failed!");

    if (result.logs.length > 0) {
        console.log();
        pretty.format.divider("Build Errors");

        const buildErrors = result.logs.map((logEntry) => ({
            field: "Build",
            message: logEntry.toString(),
            type: "invalid" as const,
        }));

        pretty.validation.errorGroup("Build errors occurred", buildErrors);
    }

    cleanup();
    process.exit(1);
}

async function createExecutable() {
    pretty.loading("Creating executable...");

    const builtCode = await Bun.file("bin/build/cli.js").text();
    const executableContent = `#!/usr/bin/env node
${builtCode}`;

    writeFileSync("bin/axogen", executableContent);
    chmodSync("bin/axogen", "755");

    pretty.file("Executable created at bin/axogen");
}

function cleanup() {
    if (existsSync("bin/build")) {
        rmSync("bin/build", {recursive: true});
    }
}

// Run the build
main().catch((error) => {
    pretty.error(`Unexpected error: ${error.message}`);
    process.exit(1);
});
