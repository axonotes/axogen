// utils/pretty.ts

import ansis from "ansis";

/**
 * Catppuccin Mocha-inspired color palette
 * Carefully chosen for excellent contrast and harmony
 */
const colors = {
    // Status colors (most important)
    success: "#a6e3a1", // Green - completions, success
    error: "#f38ba8", // Red - failures, errors
    warning: "#f9e2af", // Yellow - warnings, cautions
    info: "#89b4fa", // Blue - information, files

    // Secondary colors
    accent: "#cba6f7", // Mauve - highlights, brands
    muted: "#6c7086", // Surface2 - secondary text
    subtle: "#585b70", // Overlay1 - very subtle text

    // Special purpose
    file: "#94e2d5", // Teal - file operations
    command: "#fab387", // Peach - command execution
    debug: "#b4befe", // Lavender - debug information

    // Neutral tones
    text: "#cdd6f4", // Main text color
    dimmed: "#a6adc8", // Subtext0 - dimmed text
} as const;

/**
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

/**
 * Global configuration for the pretty print system
 */
interface PrettyConfig {
    logLevel: LogLevel;
    verbose: boolean;
    colorEnabled: boolean;
}

let config: PrettyConfig = {
    logLevel: LogLevel.INFO,
    verbose: false,
    colorEnabled: !process.env.NO_COLOR && process.stdout.isTTY,
};

/**
 * Configure the pretty print system
 */
export function configurePretty(options: Partial<PrettyConfig>): void {
    config = {...config, ...options};
}

/**
 * Check if we should output colors
 */
function shouldUseColors(): boolean {
    return config.colorEnabled;
}

/**
 * Apply color to text with fallback for non-color terminals
 */
function colorize(text: string, color: string): string {
    if (!shouldUseColors()) return text;
    return ansis.hex(color)(text);
}

/**
 * Check if message should be logged based on level
 */
function shouldLog(level: LogLevel): boolean {
    return level <= config.logLevel;
}

/**
 * Core pretty print utilities - Type A (Simple/Minimal)
 */
export const pretty = {
    /**
     * Success messages (green with checkmark)
     */
    success: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("✅", colors.success)} ${message}`);
    },

    /**
     * Error messages (red with X)
     */
    error: (message: string): void => {
        if (!shouldLog(LogLevel.ERROR)) return;
        console.error(`${colorize("❌", colors.error)} ${message}`);
    },

    /**
     * Warning messages (yellow with warning sign)
     */
    warn: (message: string): void => {
        if (!shouldLog(LogLevel.WARN)) return;
        console.warn(`${colorize("⚠️ ", colors.warning)} ${message}`);
    },

    /**
     * Info messages (blue with info icon)
     */
    info: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("ℹ️ ", colors.info)} ${message}`);
    },

    /**
     * Debug messages (only shown in verbose/debug mode)
     */
    debug: (message: string): void => {
        if (!shouldLog(LogLevel.DEBUG)) return;
        console.log(
            `${colorize("🐛", colors.debug)} ${colorize(message, colors.dimmed)}`
        );
    },

    /**
     * Progress/loading messages (cyan with rocket)
     */
    loading: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("🚀", colors.accent)} ${message}`);
    },

    /**
     * Completion messages (green with tada)
     */
    complete: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("🎉", colors.success)} ${message}`);
    },

    /**
     * File operation messages (teal with document)
     */
    file: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("📄", colors.file)} ${message}`);
    },

    /**
     * Configuration messages (purple with gear)
     */
    config: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("⚙️ ", colors.accent)} ${message}`);
    },

    /**
     * Command execution messages (peach with arrow)
     */
    command: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("▶️ ", colors.command)} ${message}`);
    },

    /**
     * Stop/termination messages (red with stop sign)
     */
    stop: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("🛑", colors.error)} ${message}`);
    },

    /**
     * Raw colored text utilities
     */
    text: {
        success: (text: string): string => colorize(text, colors.success),
        error: (text: string): string => colorize(text, colors.error),
        warning: (text: string): string => colorize(text, colors.warning),
        info: (text: string): string => colorize(text, colors.info),
        accent: (text: string): string => colorize(text, colors.accent),
        muted: (text: string): string => colorize(text, colors.muted),
        subtle: (text: string): string => colorize(text, colors.subtle),
        file: (text: string): string => colorize(text, colors.file),
        command: (text: string): string => colorize(text, colors.command),
        debug: (text: string): string => colorize(text, colors.debug),
        dimmed: (text: string): string => colorize(text, colors.dimmed),
        bold: (text: string): string =>
            shouldUseColors() ? ansis.bold(text) : text,
        dim: (text: string): string =>
            shouldUseColors() ? ansis.dim(text) : text,
    },

    /**
     * Validation error utilities - Type B (Structured with breathing room)
     */
    validation: {
        /**
         * Show a group of validation errors with proper spacing
         */
        errorGroup: (
            title: string,
            errors: Array<{
                field?: string;
                message: string;
                type?: "missing" | "invalid" | "type";
            }>
        ): void => {
            if (!shouldLog(LogLevel.ERROR)) return;

            pretty.error(title);
            console.log(); // Breathing room

            // Group errors by type
            const missing = errors.filter((e) => e.type === "missing");
            const typeErrors = errors.filter((e) => e.type === "type");
            const invalid = errors.filter(
                (e) => e.type === "invalid" || !e.type
            );

            if (missing.length > 0) {
                console.log(`  ${colorize("Missing Required:", colors.error)}`);
                missing.forEach((error) => {
                    console.log(
                        `    ${colorize("•", colors.error)} ${error.field || error.message}`
                    );
                });
                if (typeErrors.length > 0 || invalid.length > 0) console.log();
            }

            if (typeErrors.length > 0) {
                console.log(`  ${colorize("Type Errors:", colors.error)}`);
                typeErrors.forEach((error) => {
                    const field = error.field ? `${error.field}: ` : "";
                    console.log(
                        `    ${colorize("•", colors.error)} ${field}${error.message}`
                    );
                });
                if (invalid.length > 0) console.log();
            }

            if (invalid.length > 0) {
                console.log(
                    `  ${colorize("Validation Errors:", colors.error)}`
                );
                invalid.forEach((error) => {
                    const field = error.field ? `${error.field}: ` : "";
                    console.log(
                        `    ${colorize("•", colors.error)} ${field}${error.message}`
                    );
                });
            }
        },

        /**
         * Individual validation error helpers
         */
        missing: (field: string): void => {
            if (!shouldLog(LogLevel.ERROR)) return;
            console.log(
                `    ${colorize("•", colors.error)} Missing required: ${colorize(field, colors.accent)}`
            );
        },

        typeError: (
            field: string,
            expected: string,
            received: string
        ): void => {
            if (!shouldLog(LogLevel.ERROR)) return;
            console.log(
                `    ${colorize("•", colors.error)} ${colorize(field, colors.accent)}: expected ${expected}, got ${received}`
            );
        },

        invalid: (field: string, message: string): void => {
            if (!shouldLog(LogLevel.ERROR)) return;
            console.log(
                `    ${colorize("•", colors.error)} ${colorize(field, colors.accent)}: ${message}`
            );
        },
    },

    /**
     * Process result utilities - Type C (Grouped by outcome)
     */
    process: {
        /**
         * Show mixed results grouped by success/failure
         */
        mixed: (
            results: Array<{
                type: "success" | "error" | "warning";
                message: string;
            }>
        ): void => {
            if (!shouldLog(LogLevel.INFO)) return;

            const successes = results.filter((r) => r.type === "success");
            const errors = results.filter((r) => r.type === "error");
            const warnings = results.filter((r) => r.type === "warning");

            // Show successes first
            successes.forEach((result) => pretty.success(result.message));

            // Then warnings
            warnings.forEach((result) => pretty.warn(result.message));

            // Then errors
            errors.forEach((result) => pretty.error(result.message));

            // Summary line with breathing room
            if (results.length > 3) {
                console.log();
                if (errors.length === 0) {
                    pretty.complete(
                        `All ${successes.length} tasks completed successfully`
                    );
                } else {
                    pretty.warn(
                        `Completed with ${errors.length} error${errors.length !== 1 ? "s" : ""}, ${successes.length} success${successes.length !== 1 ? "es" : ""}`
                    );
                }
            }
        },
    },

    /**
     * Generation result utilities - Type D (Process with sections)
     */
    generation: {
        /**
         * Show file generation results with clear sections
         */
        results: (
            results: Array<{
                name: string;
                path: string;
                success: boolean;
                error?: string;
            }>,
            options?: {dryRun?: boolean}
        ): void => {
            if (!shouldLog(LogLevel.INFO)) return;

            const successes = results.filter((r) => r.success);
            const failures = results.filter((r) => !r.success);

            console.log(); // Breathing room
            console.log(`${colorize("Results:", colors.accent)}`);

            // Show results
            results.forEach((result) => {
                if (result.success) {
                    const message = options?.dryRun
                        ? `Would generate: ${result.path}`
                        : `Generated: ${result.path}`;
                    pretty.file(message);
                } else {
                    pretty.error(`Failed: ${result.name} - ${result.error}`);
                }
            });

            // Summary
            console.log();
            if (failures.length === 0) {
                pretty.complete(
                    `Generation complete! (${successes.length} file${successes.length !== 1 ? "s" : ""})`
                );
            } else {
                pretty.warn(
                    `Generation completed with errors: ${successes.length} success, ${failures.length} failed`
                );
            }
        },
    },

    /**
     * Formatting utilities
     */
    format: {
        /**
         * Create a header with divider - Type D style
         */
        header: (title: string): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const line = colorize(
                "═".repeat(Math.max(title.length + 4, 40)),
                colors.accent
            );
            console.log(line);
            console.log(colorize(`  ${title.toUpperCase()}  `, colors.accent));
            console.log(line);
        },

        /**
         * Create a section divider
         */
        divider: (text?: string): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            if (text) {
                const padding = Math.max(0, Math.floor((40 - text.length) / 2));
                const line = "─".repeat(padding);
                console.log(colorize(`${line} ${text} ${line}`, colors.muted));
            } else {
                console.log(colorize("─".repeat(40), colors.muted));
            }
        },

        /**
         * Create a bullet list item
         */
        bullet: (text: string, indent: number = 0): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const spaces = "  ".repeat(indent);
            console.log(`${spaces}${colorize("•", colors.accent)} ${text}`);
        },

        /**
         * Create a numbered list item
         */
        numbered: (number: number, text: string, indent: number = 0): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const spaces = "  ".repeat(indent);
            console.log(
                `${spaces}${colorize(`${number}.`, colors.accent)} ${text}`
            );
        },

        /**
         * Create a key-value pair
         */
        keyValue: (
            key: string,
            value: string,
            separator: string = ":"
        ): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            console.log(
                `${colorize(key, colors.accent)}${colorize(separator, colors.muted)} ${value}`
            );
        },

        /**
         * Create a table-like output
         */
        table: (rows: Array<{key: string; value: string}>): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const maxKeyLength = Math.max(...rows.map((row) => row.key.length));
            rows.forEach(({key, value}) => {
                const paddedKey = key.padEnd(maxKeyLength);
                console.log(
                    `  ${colorize(paddedKey, colors.accent)} ${colorize("│", colors.muted)} ${value}`
                );
            });
        },
    },

    /**
     * Command prefix utilities for live output
     */
    prefix: {
        /**
         * Create a command prefix for live output
         */
        command: (name: string): string => {
            if (!shouldUseColors()) return `[${name}] `;
            return `${colorize(`[${name}]`, colors.command)} `;
        },
    },
};

/**
 * Simple context utilities - for when you want minimal output (Type A)
 */
export const simple = {
    success: pretty.success,
    error: pretty.error,
    warn: pretty.warn,
    info: pretty.info,
    debug: pretty.debug,
};

/**
 * Export colors for direct use if needed
 */
export {colors};

/**
 * Legacy compatibility
 */
export const log = {
    success: pretty.success,
    error: pretty.error,
    warn: pretty.warn,
    info: pretty.info,
    debug: pretty.debug,
};
