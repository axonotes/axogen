// utils/pretty.ts

import ansis from "ansis";
import {getTheme, type ThemeName, themes, listThemes} from "./themes";
import type {SecretsAnalysisResult} from "./secrets.ts";

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
    theme: ThemeName;
}

let config: PrettyConfig = {
    logLevel: LogLevel.INFO,
    verbose: false,
    colorEnabled: !process.env.NO_COLOR && process.stdout.isTTY,
    theme: (process.env.AXOGEN_THEME as ThemeName) || "doom-one",
};

// Get current theme
let currentTheme = getTheme(config.theme);

/**
 * Configure the pretty print system
 */
export function configurePretty(options: Partial<PrettyConfig>): void {
    config = {...config, ...options};

    // Update theme if changed
    if (options.theme) {
        currentTheme = getTheme(options.theme);
    }
}

/**
 * Change the current theme
 */
export function setTheme(themeName: ThemeName): void {
    config.theme = themeName;
    currentTheme = getTheme(themeName);
}

/**
 * Get current theme info
 */
export function getCurrentTheme() {
    return {
        name: currentTheme.name,
        description: currentTheme.description,
    };
}

/**
 * Export theme utilities
 */
export {listThemes, themes};

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
        console.log(
            `${colorize("✅", currentTheme.colors.success)} ${message}`
        );
    },

    /**
     * Error messages (red with X)
     */
    error: (message: string): void => {
        if (!shouldLog(LogLevel.ERROR)) return;
        console.error(
            `${colorize("❌", currentTheme.colors.error)} ${message}`
        );
    },

    /**
     * Warning messages (yellow with warning sign)
     */
    warn: (message: string): void => {
        if (!shouldLog(LogLevel.WARN)) return;
        const styledMessage = shouldUseColors()
            ? ansis.bold(colorize(message, currentTheme.colors.warning))
            : message;
        console.warn(
            `${colorize("⚠️ ", currentTheme.colors.warning)} ${styledMessage}`
        );
    },

    /**
     * Info messages (blue with info icon)
     */
    info: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        const styledMessage = shouldUseColors()
            ? ansis.bold(colorize(message, currentTheme.colors.info))
            : message;
        console.log(
            `${colorize("ℹ️ ", currentTheme.colors.info)} ${styledMessage}`
        );
    },

    /**
     * Debug messages (only shown in verbose/debug mode)
     */
    debug: (message: string): void => {
        if (!shouldLog(LogLevel.DEBUG)) return;
        console.log(
            `${colorize("🐛", currentTheme.colors.debug)} ${colorize(message, currentTheme.colors.dimmed)}`
        );
    },

    /**
     * Progress/loading messages (accent with rocket)
     */
    loading: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("🚀", currentTheme.colors.accent)} ${message}`);
    },

    /**
     * Completion messages (green with tada)
     */
    complete: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(
            `${colorize("🎉", currentTheme.colors.success)} ${message}`
        );
    },

    /**
     * File operation messages (file color with document)
     */
    file: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("📄", currentTheme.colors.file)} ${message}`);
    },

    /**
     * Configuration messages (accent with gear)
     */
    config: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(
            `${colorize("⚙️ ", currentTheme.colors.accent)} ${message}`
        );
    },

    /**
     * Command execution messages (command color with arrow)
     */
    command: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(
            `${colorize("▶️ ", currentTheme.colors.command)} ${message}`
        );
    },

    /**
     * Stop/termination messages (error color with stop sign)
     */
    stop: (message: string): void => {
        if (!shouldLog(LogLevel.INFO)) return;
        console.log(`${colorize("🛑", currentTheme.colors.error)} ${message}`);
    },

    /**
     * Raw colored text utilities
     */
    text: {
        success: (text: string): string =>
            colorize(text, currentTheme.colors.success),
        error: (text: string): string =>
            colorize(text, currentTheme.colors.error),
        warning: (text: string): string =>
            colorize(text, currentTheme.colors.warning),
        info: (text: string): string =>
            colorize(text, currentTheme.colors.info),
        accent: (text: string): string =>
            colorize(text, currentTheme.colors.accent),
        muted: (text: string): string =>
            colorize(text, currentTheme.colors.muted),
        subtle: (text: string): string =>
            colorize(text, currentTheme.colors.subtle),
        file: (text: string): string =>
            colorize(text, currentTheme.colors.file),
        command: (text: string): string =>
            colorize(text, currentTheme.colors.command),
        debug: (text: string): string =>
            colorize(text, currentTheme.colors.debug),
        dimmed: (text: string): string =>
            colorize(text, currentTheme.colors.dimmed),
        bold: (text: string): string =>
            shouldUseColors() ? ansis.bold(text) : text,
        dim: (text: string): string =>
            shouldUseColors() ? ansis.dim(text) : text,
        loading(text: string) {
            return `${colorize("🚀", currentTheme.colors.accent)} ${text}`;
        },
    },

    /**
     * Secrets detection utilities
     */
    secrets: {
        /**
         * Show secrets detection results with security-focused formatting
         */
        detected: (title: string, result: SecretsAnalysisResult): void => {
            if (!shouldLog(LogLevel.ERROR)) return;

            // Main security alert
            console.log(); // Breathing room
            console.error(
                `${colorize("🔒", currentTheme.colors.error)} ${colorize(title, currentTheme.colors.error)}`
            );

            // Concise summary line
            const riskSummary = [
                result.highConfidenceCount > 0 &&
                    `${result.highConfidenceCount} high risk`,
                result.mediumConfidenceCount > 0 &&
                    `${result.mediumConfidenceCount} medium risk`,
                result.lowConfidenceCount > 0 &&
                    `${result.lowConfidenceCount} low risk`,
            ]
                .filter(Boolean)
                .join(" • ");

            console.log(
                `  ${colorize("Found:", currentTheme.colors.muted)} ${result.totalCount} potential secret${result.totalCount !== 1 ? "s" : ""} (${riskSummary})`
            );
            console.log();

            // Group by confidence and show in descending order of severity
            const groups = [
                {
                    level: "high",
                    items: result.secretsFound.filter(
                        (s) => s.confidence === "high"
                    ),
                    color: currentTheme.colors.error,
                    icon: "🚨",
                },
                {
                    level: "medium",
                    items: result.secretsFound.filter(
                        (s) => s.confidence === "medium"
                    ),
                    color: currentTheme.colors.warning,
                    icon: "⚠️",
                },
                {
                    level: "low",
                    items: result.secretsFound.filter(
                        (s) => s.confidence === "low"
                    ),
                    color: currentTheme.colors.muted,
                    icon: "ℹ️",
                },
            ];

            groups.forEach((group) => {
                if (group.items.length === 0) return;

                console.log(
                    `  ${colorize(group.icon, group.color)} ${colorize(group.level.toUpperCase(), group.color)} (${group.items.length})`
                );
                group.items.forEach((secret) => {
                    const location = secret.path || secret.key;
                    const category = secret.category
                        ? ` [${secret.category}]`
                        : "";
                    console.log(
                        `    ${colorize("•", group.color)} ${colorize(location, currentTheme.colors.accent)}: ${secret.reason}${colorize(category, currentTheme.colors.muted)}`
                    );
                });
                console.log();
            });

            // Clean blocked message
            console.log(
                `  ${colorize("⛔ Generation blocked for security", currentTheme.colors.error)}`
            );
        },
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
                console.log(
                    `  ${colorize("Missing Required:", currentTheme.colors.error)}`
                );
                missing.forEach((error) => {
                    console.log(
                        `    ${colorize("•", currentTheme.colors.error)} ${error.field || error.message}`
                    );
                });
                if (typeErrors.length > 0 || invalid.length > 0) console.log();
            }

            if (typeErrors.length > 0) {
                console.log(
                    `  ${colorize("Type Errors:", currentTheme.colors.error)}`
                );
                typeErrors.forEach((error) => {
                    const field = error.field ? `${error.field}: ` : "";
                    console.log(
                        `    ${colorize("•", currentTheme.colors.error)} ${field}${error.message}`
                    );
                });
                if (invalid.length > 0) console.log();
            }

            if (invalid.length > 0) {
                console.log(
                    `  ${colorize("Validation Errors:", currentTheme.colors.error)}`
                );
                invalid.forEach((error) => {
                    const field = error.field ? `${error.field}: ` : "";
                    console.log(
                        `    ${colorize("•", currentTheme.colors.error)} ${field}${error.message}`
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
                `    ${colorize("•", currentTheme.colors.error)} Missing required: ${colorize(field, currentTheme.colors.accent)}`
            );
        },

        typeError: (
            field: string,
            expected: string,
            received: string
        ): void => {
            if (!shouldLog(LogLevel.ERROR)) return;
            console.log(
                `    ${colorize("•", currentTheme.colors.error)} ${colorize(field, currentTheme.colors.accent)}: expected ${expected}, got ${received}`
            );
        },

        invalid: (field: string, message: string): void => {
            if (!shouldLog(LogLevel.ERROR)) return;
            console.log(
                `    ${colorize("•", currentTheme.colors.error)} ${colorize(field, currentTheme.colors.accent)}: ${message}`
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
            console.log(`${colorize("Results:", currentTheme.colors.accent)}`);

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
     * Theme utilities
     */
    theme: {
        /**
         * List all available themes
         */
        list: (): void => {
            if (!shouldLog(LogLevel.INFO)) return;

            console.log(
                `${colorize("Available themes:", currentTheme.colors.accent)}`
            );
            console.log();

            const themeList = listThemes();
            const currentThemeName = getCurrentTheme().name;

            themeList.forEach((theme) => {
                const marker = theme.name === currentThemeName ? "●" : "○";
                const nameColor =
                    theme.name === currentThemeName
                        ? currentTheme.colors.accent
                        : currentTheme.colors.text;
                console.log(
                    `  ${colorize(marker, currentTheme.colors.accent)} ${colorize(theme.name, nameColor)} - ${theme.description}`
                );
            });
        },

        /**
         * Show current theme info
         */
        current: (): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const current = getCurrentTheme();
            pretty.info(
                `Current theme: ${pretty.text.accent(current.name)} - ${current.description}`
            );
        },

        /**
         * Preview theme colors
         */
        preview: (themeName?: ThemeName): void => {
            if (!shouldLog(LogLevel.INFO)) return;

            const theme = themeName ? getTheme(themeName) : currentTheme;

            console.log(
                `${colorize(`${theme.name} theme preview:`, theme.colors.accent)}`
            );
            console.log();
            console.log(
                `${colorize("✅", theme.colors.success)} Success messages`
            );
            console.log(`${colorize("❌", theme.colors.error)} Error messages`);
            console.log(
                `${colorize("⚠️ ", theme.colors.warning)} Warning messages`
            );
            console.log(`${colorize("ℹ️ ", theme.colors.info)} Info messages`);
            console.log(
                `${colorize("🚀", theme.colors.accent)} Loading/accent messages`
            );
            console.log(`${colorize("📄", theme.colors.file)} File operations`);
            console.log(
                `${colorize("▶️ ", theme.colors.command)} Command execution`
            );
            console.log(
                `${colorize("🐛", theme.colors.debug)} Debug information`
            );
            console.log();
            console.log(
                `Text colors: ${colorize("normal", theme.colors.text)} ${colorize("muted", theme.colors.muted)} ${colorize("subtle", theme.colors.subtle)}`
            );
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
                currentTheme.colors.accent
            );
            console.log(line);
            console.log(
                colorize(
                    `  ${title.toUpperCase()}  `,
                    currentTheme.colors.accent
                )
            );
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
                console.log(
                    colorize(
                        `${line} ${text} ${line}`,
                        currentTheme.colors.muted
                    )
                );
            } else {
                console.log(
                    colorize("─".repeat(40), currentTheme.colors.muted)
                );
            }
        },

        /**
         * Create a bullet list item
         */
        bullet: (text: string, indent: number = 0): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const spaces = "  ".repeat(indent);
            console.log(
                `${spaces}${colorize("•", currentTheme.colors.accent)} ${text}`
            );
        },

        /**
         * Create a numbered list item
         */
        numbered: (number: number, text: string, indent: number = 0): void => {
            if (!shouldLog(LogLevel.INFO)) return;
            const spaces = "  ".repeat(indent);
            console.log(
                `${spaces}${colorize(`${number}.`, currentTheme.colors.accent)} ${text}`
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
                `${colorize(key, currentTheme.colors.accent)}${colorize(separator, currentTheme.colors.muted)} ${value}`
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
                    `  ${colorize(paddedKey, currentTheme.colors.accent)} ${colorize("│", currentTheme.colors.muted)} ${value}`
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
            return `${colorize(`[${name}]`, currentTheme.colors.command)} `;
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
 * Export current theme colors for direct use if needed
 */
export const colors = new Proxy({} as any, {
    get: (target, prop) => {
        return currentTheme.colors[prop as keyof typeof currentTheme.colors];
    },
});

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
