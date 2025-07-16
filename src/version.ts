declare const __VERSION__: string;

export function getVersion(): string {
    // In build: replaced by actual version
    // In development: fallback to reading package.json
    if (typeof __VERSION__ !== "undefined") {
        return __VERSION__;
    }

    // Fallback for development (when not built)
    try {
        const packageJson = require("../package.json");
        return packageJson.version;
    } catch {
        return "dev";
    }
}
