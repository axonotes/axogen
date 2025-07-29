/**
 * Version utilities for Axogen.
 * Provides version information that works in both development and production builds.
 */

declare const __VERSION__: string;

/**
 * Get the current version of Axogen.
 * In production builds, uses the injected version string.
 * In development, falls back to reading package.json or returns "dev".
 * @returns The version string
 */
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
