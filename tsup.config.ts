import {defineConfig} from "tsup";
import {readFileSync} from "fs";

// Read version from package.json
const packageJson = JSON.parse(readFileSync("package.json", "utf-8"));
const version = packageJson.version;

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
    define: {
        __VERSION__: `"${version}"`,
    },
    external: ["typescript"],
    splitting: false,
    treeshake: true,
    minify: false,
    target: "node18",
    metafile: true,
});
