import {createConsola, type LogLevel as ConsolaLogLevel} from "consola";
import {getTheme, type ThemeName, type Theme} from "./themes";

/**
 * Our app's log levels (mapped to consola levels)
 */
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 4,
    TRACE = 5,
}

/**
 * Configuration for the logger
 */
interface LoggerConfig {
    level: LogLevel;
    theme: ThemeName;
    colorEnabled: boolean;
    verbose: boolean;
}

/**
 * Error types for structured error reporting
 */
export interface ValidationError {
    field?: string;
    message: string;
    type?: "missing" | "type" | "invalid";
}

export interface SecurityIssue {
    path?: string;
    key?: string;
    reason: string;
    confidence: "high" | "medium" | "low";
    category?: string;
}

export interface SecurityResult {
    totalCount: number;
    highConfidenceCount: number;
    mediumConfidenceCount: number;
    lowConfidenceCount: number;
    secretsFound: SecurityIssue[];
}

export interface LogIssuesConfig {
    title: string;
    titleIcon: string;
    subtitle: string; // already formatted
    levels: Record<
        string,
        {
            color: string;
            icon: string; // the icon before e.g. MISSING
        }
    >;
    items: {
        level: string;
        icon: string; // the icon before the item (same color as level color)
        key: string; // accent color
        description: string; // normal color
        extra?: string; // the thing in the brackets, muted color
    }[];
    footer: string;
    footerIcon: string;
    footerIconColor: string;
}

const colorize = (text: string, color: string, colorEnabled: boolean) =>
    colorEnabled ? `\x1b[38;2;${hexToRgb(color)}m${text}\x1b[0m` : text;

/**
 * Custom consola reporter that applies our theme colors
 */
function createThemedReporter(theme: Theme, colorEnabled: boolean) {
    return {
        log(logObj: any) {
            // Extract message from logObj properly
            let message = "";
            if (logObj.args && Array.isArray(logObj.args)) {
                message = logObj.args
                    .map((arg: any) =>
                        typeof arg === "string"
                            ? arg
                            : typeof arg === "object"
                              ? JSON.stringify(arg)
                              : String(arg)
                    )
                    .join(" ");
            } else if (logObj.message) {
                message = logObj.message;
            }

            if (!colorEnabled) {
                // Fallback to basic console for no-color environments
                switch (logObj.type) {
                    case "error":
                    case "fatal":
                        console.error(`✗ ${message}`);
                        break;
                    case "warn":
                        console.warn(`! ${message}`);
                        break;
                    case "success":
                        console.log(`✓ ${message}`);
                        break;
                    case "info":
                        console.log(`i ${message}`);
                        break;
                    case "debug":
                        console.log(`• ${message}`);
                        break;
                    case "start":
                        console.log(`▶ ${message}`);
                        break;
                    case "ready":
                        console.log(`✓ ${message}`);
                        break;
                    case "file":
                        console.log(`+ ${message}`);
                        break;
                    case "command":
                        console.log(`> ${message}`);
                        break;
                    default:
                        console.log(message);
                }
                return;
            }

            let icon = "";
            let color = theme.colors.text;

            switch (logObj.type) {
                case "error":
                case "fatal":
                    icon = "✗";
                    color = theme.colors.error;
                    break;
                case "warn":
                    icon = "!";
                    color = theme.colors.warning;
                    break;
                case "success":
                    icon = "✓";
                    color = theme.colors.success;
                    break;
                case "info":
                    icon = "i";
                    color = theme.colors.info;
                    break;
                case "debug":
                    icon = "•";
                    color = theme.colors.debug;
                    break;
                case "start":
                    icon = "▶";
                    color = theme.colors.accent;
                    break;
                case "ready":
                    icon = "✓";
                    color = theme.colors.success;
                    break;
                case "file":
                    icon = "+";
                    color = theme.colors.file;
                    break;
                case "command":
                    icon = ">";
                    color = theme.colors.command;
                    break;
                default:
                    color = theme.colors.text;
            }

            const formattedMessage = icon ? `${icon} ${message}` : message;
            console.log(colorize(formattedMessage, color, config.colorEnabled));
        },
    };
}

/**
 * Convert hex color to RGB values for ANSI escape codes
 */
function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r};${g};${b}`;
}

/**
 * Global logger configuration
 */
let config: LoggerConfig = {
    level: LogLevel.INFO,
    theme: (process.env.AXOGEN_THEME as ThemeName) || "doom-one",
    colorEnabled: !process.env.NO_COLOR && process.stdout.isTTY,
    verbose: false,
};

/**
 * Current consola instance
 */
let consola = createConsolaInstance();

/**
 * Create a new consola instance with current config
 */
function createConsolaInstance() {
    const theme = getTheme(config.theme);
    return createConsola({
        level: config.level as ConsolaLogLevel,
        reporters: [createThemedReporter(theme, config.colorEnabled)],
    });
}

/**
 * Configure the logger
 */
export function configure(options: Partial<LoggerConfig>): void {
    config = {...config, ...options};
    consola = createConsolaInstance();
}

/**
 * Get the current logger configuration
 */
export function getConfig(): LoggerConfig {
    return {...config};
}

/**
 * Set the current theme
 */
export function setTheme(themeName: ThemeName): void {
    config.theme = themeName;
    consola = createConsolaInstance();
}

/**
 * Get current theme info
 */
export function getCurrentTheme() {
    const theme = getTheme(config.theme);
    return {
        name: theme.name,
        description: theme.description,
    };
}

/**
 * Main logger API - Clean and simple
 */
export const logger = {
    // Basic logging (maps to consola built-ins)
    success: (message: string) => consola.success(message),
    error: (message: string) => consola.error(message),
    warn: (message: string) => consola.warn(message),
    info: (message: string) => consola.info(message),
    debug: (message: string) => consola.debug(message),
    trace: (message: string) => consola.trace(message),

    // Process states (consola built-ins)
    start: (message: string) => consola.start(message),
    ready: (message: string) => consola.ready(message),
    fail: (message: string) => consola.fail(message),

    // Custom log types - use direct console with theming
    file: (message: string) => {
        const theme = getTheme(config.theme);
        console.log(
            `${colorize("+", theme.colors.file, config.colorEnabled)} ${message}`
        );
    },

    command: (message: string) => {
        const theme = getTheme(config.theme);
        console.log(
            `${colorize(">", theme.colors.command, config.colorEnabled)} ${message}`
        );
    },

    /**
     * Unified logger for all types of issues
     */
    logIssues: (logConfig: LogIssuesConfig) => {
        const theme = getTheme(config.theme);

        console.log(); // Breathing room

        // Title line
        console.log(
            `${colorize(`${logConfig.titleIcon} ${logConfig.title}`, theme.colors.error, config.colorEnabled)}`
        );

        // Subtitle line
        console.log(`  ${logConfig.subtitle}`);
        console.log();

        // Group items by level
        const groupedItems = logConfig.items.reduce(
            (groups, item) => {
                if (!groups[item.level]) {
                    groups[item.level] = [];
                }
                groups[item.level].push(item);
                return groups;
            },
            {} as Record<string, typeof logConfig.items>
        );

        // Display groups
        Object.entries(groupedItems).forEach(([levelName, items]) => {
            const levelConfig = logConfig.levels[levelName];
            if (!levelConfig) return;

            // Level header
            console.log(
                `  ${colorize(levelConfig.icon, levelConfig.color, config.colorEnabled)} ${colorize(levelName.toUpperCase(), levelConfig.color, config.colorEnabled)} ${colorize(items.length.toString(), theme.colors.muted, config.colorEnabled)}`
            );

            // Level items
            items.forEach((item) => {
                const itemIcon = colorize(
                    item.icon,
                    levelConfig.color,
                    config.colorEnabled
                );
                const key = colorize(
                    item.key,
                    theme.colors.accent,
                    config.colorEnabled
                );
                const description = item.description;
                const extra = item.extra
                    ? colorize(
                          ` [${item.extra}]`,
                          theme.colors.muted,
                          config.colorEnabled
                      )
                    : "";

                console.log(`    ${itemIcon} ${key}: ${description}${extra}`);
            });
            console.log();
        });

        // Footer
        console.log(
            `  ${colorize(logConfig.footerIcon, logConfig.footerIconColor, config.colorEnabled)} ${logConfig.footer}`
        );
    },

    /**
     * Log validation errors in a clean, grouped format similar to security scan
     */
    validation: (title: string, errors: ValidationError[]) => {
        const theme = getTheme(config.theme);

        // Group errors by type
        const missing = errors.filter((e) => e.type === "missing");
        const typeErrors = errors.filter((e) => e.type === "type");
        const invalid = errors.filter((e) => e.type === "invalid" || !e.type);

        // Generate subtitle
        const summaryParts = [
            missing.length > 0 && `${missing.length} missing`,
            typeErrors.length > 0 &&
                `${typeErrors.length} type error${typeErrors.length !== 1 ? "s" : ""}`,
            invalid.length > 0 &&
                `${invalid.length} invalid value${invalid.length !== 1 ? "s" : ""}`,
        ].filter(Boolean);

        const subtitle = `${colorize("Found:", theme.colors.muted, config.colorEnabled)} ${errors.length} validation error${errors.length !== 1 ? "s" : ""} ${colorize(summaryParts.join(" • "), theme.colors.muted, config.colorEnabled)}`;

        // Map to items
        const items = errors.map((error) => ({
            level:
                error.type === "missing"
                    ? "missing"
                    : error.type === "type"
                      ? "type-error"
                      : "invalid",
            icon: "•",
            key: error.field || "field",
            description: error.message,
            extra: undefined,
        }));

        logger.logIssues({
            title,
            titleIcon: "✗",
            subtitle,
            levels: {
                missing: {color: theme.colors.error, icon: ""},
                "type-error": {color: theme.colors.error, icon: ""},
                invalid: {color: theme.colors.error, icon: ""},
            },
            items,
            footer: "Fix these issues before continuing",
            footerIcon: "!",
            footerIconColor: theme.colors.warning,
        });
    },

    /**
     * Log security issues with appropriate severity grouping
     */
    security: (title: string, result: SecurityResult) => {
        const theme = getTheme(config.theme);

        // Generate subtitle
        const summaryParts = [
            result.highConfidenceCount > 0 &&
                `${result.highConfidenceCount} high risk`,
            result.mediumConfidenceCount > 0 &&
                `${result.mediumConfidenceCount} medium risk`,
            result.lowConfidenceCount > 0 &&
                `${result.lowConfidenceCount} low risk`,
        ].filter(Boolean);

        const subtitle = `${colorize("Found:", theme.colors.muted, config.colorEnabled)} ${result.totalCount} potential secret${result.totalCount !== 1 ? "s" : ""} ${colorize(summaryParts.join(" • "), theme.colors.muted, config.colorEnabled)}`;

        // Map to items
        const items = result.secretsFound.map((issue) => ({
            level: issue.confidence,
            icon: "•",
            key: issue.path || issue.key || "unknown",
            description: issue.reason,
            extra: issue.category,
        }));

        logger.logIssues({
            title,
            titleIcon: "⚠",
            subtitle,
            levels: {
                high: {color: theme.colors.error, icon: ""},
                medium: {color: theme.colors.warning, icon: ""},
                low: {color: theme.colors.muted, icon: ""},
            },
            items,
            footer: "Generation blocked for security",
            footerIcon: "✗",
            footerIconColor: theme.colors.error,
        });
    },

    /**
     * Simple utilities for formatting
     */
    format: {
        header: (title: string) => {
            const theme = getTheme(config.theme);

            const line = colorize(
                "═".repeat(Math.max(title.length + 4, 40)),
                theme.colors.accent,
                config.colorEnabled
            );
            console.log(line);
            console.log(
                colorize(
                    `  ${title.toUpperCase()}  `,
                    theme.colors.accent,
                    config.colorEnabled
                )
            );
            console.log(line);
        },

        divider: (text?: string) => {
            const barLength = 40;
            const theme = getTheme(config.theme);

            if (text) {
                // Minus 2 for padding
                const remaining = barLength - 2 - text.length;
                const padding = Math.max(0, Math.floor(remaining / 2));
                const line = "─".repeat(padding);
                const equalizer = remaining % 2 === 0 ? "" : "─";
                console.log(
                    colorize(
                        `${line} ${text} ${line}${equalizer}`,
                        theme.colors.muted,
                        config.colorEnabled
                    )
                );
            } else {
                console.log(
                    colorize(
                        "─".repeat(barLength),
                        theme.colors.muted,
                        config.colorEnabled
                    )
                );
            }
        },

        bullet: (text: string, level: number = 1) => {
            const theme = getTheme(config.theme);

            const indent = "  ".repeat(level);
            console.log(
                `${indent}${colorize("•", theme.colors.muted, config.colorEnabled)} ${text}`
            );
        },
    },

    /**
     * Command prefix for live output
     */
    prefix: {
        command: (name: string): string => {
            const theme = getTheme(config.theme);

            return `${colorize(`[${name}]`, theme.colors.command, config.colorEnabled)} `;
        },
    },

    /**
     * Text colorization utilities
     */
    text: {
        success: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.success)}m${text}\x1b[0m`
                : text;
        },
        error: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.error)}m${text}\x1b[0m`
                : text;
        },
        warning: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.warning)}m${text}\x1b[0m`
                : text;
        },
        info: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.info)}m${text}\x1b[0m`
                : text;
        },
        accent: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.accent)}m${text}\x1b[0m`
                : text;
        },
        muted: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.muted)}m${text}\x1b[0m`
                : text;
        },
        subtle: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.subtle)}m${text}\x1b[0m`
                : text;
        },
        file: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.file)}m${text}\x1b[0m`
                : text;
        },
        command: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.command)}m${text}\x1b[0m`
                : text;
        },
        debug: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.debug)}m${text}\x1b[0m`
                : text;
        },
        normal: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.text)}m${text}\x1b[0m`
                : text;
        },
        dimmed: (text: string): string => {
            const theme = getTheme(config.theme);
            return config.colorEnabled
                ? `\x1b[38;2;${hexToRgb(theme.colors.dimmed)}m${text}\x1b[0m`
                : text;
        },
    },
};
