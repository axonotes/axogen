import {type TagName, themeManager} from "./themes.ts";

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
    subtitle: string; // already formatted
    levels: Record<
        string,
        {
            color: TagName;
        }
    >;
    items: {
        level: string;
        key: string; // accent color
        description: string; // normal color
        extra?: string; // the thing in the brackets, muted color
    }[];
    footer: string;
    footerIcon: string;
    footerIconColor: TagName;
}

function format(xml: string): string {
    return themeManager.format(xml);
}

function logF(xml: string): void {
    console.log(format(xml));
}

/**
 * Main logger API - Clean and simple
 */
export const logger = {
    logF: (xml: string): void => logF(xml),
    format: (xml: string): string => format(xml),

    // Basic logging (maps to consola built-ins)
    success: (message: string) => logF(`<success>${message}</success>`),
    error: (message: string) => logF(`<error>${message}</error>`),
    warn: (message: string) => logF(`<warning>${message}</warning>`),
    info: (message: string) => logF(`  <primary>${message}</primary>`),
    debug: (message: string) => console.debug(message),
    trace: (message: string) => console.trace(message),

    // Custom log types - use direct console with theming
    file: (message: string, path?: string) => {
        logF(
            `  <primary>+</primary> ${message} <subtle>${path ? `[${path}]` : ""}</subtle>`
        );
    },

    command: (message: string) => {
        logF(`<secondary>></secondary> ${message}`);
    },

    start: (message: string) => {
        logF(`<primary>➤</primary> ${message}`);
    },

    /**
     * Unified logger for all types of issues
     */
    logIssues: (logConfig: LogIssuesConfig) => {
        console.log(); // Breathing room

        // Title line
        logF(`<error>${logConfig.title}</error>`);

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
            logF(
                `  <${levelConfig.color}>${levelName.toUpperCase()}</${levelConfig.color}> <subtle>${items.length}</subtle>`
            );

            // Level items
            items.forEach((item) => {
                const itemIcon = `<${levelConfig.color}>•</${levelConfig.color}>`;
                const key = `<primary>${item.key}</primary>`;
                const description = item.description;
                const extra = `<subtle>${item.extra ? ` [${item.extra}]` : ""}</subtle>`;
                logF(`    ${itemIcon} ${key}: ${description}${extra}`);
            });
            console.log();
        });

        // Footer
        logF(
            `  <${logConfig.footerIconColor}>${logConfig.footerIcon}</${logConfig.footerIconColor}>${logConfig.footerIcon ? " " : ""}${logConfig.footer}`
        );
        console.log();
    },

    /**
     * Log validation errors in a clean, grouped format similar to security scan
     */
    validation: (title: string, errors: ValidationError[]) => {
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

        const subtitle = format(
            `<subtle>Found:</subtle> ${errors.length} validation error${errors.length !== 1 ? "s" : ""} <subtle>${summaryParts.join(" • ")}</subtle>`
        );

        // Map to items
        const items = errors.map((error) => ({
            level:
                error.type === "missing"
                    ? "missing"
                    : error.type === "type"
                      ? "type-error"
                      : "invalid",
            key: error.field || "field",
            description: error.message,
            extra: undefined,
        }));

        logger.logIssues({
            title: `✗ ${title}`,
            subtitle,
            levels: {
                missing: {color: "error"},
                "type-error": {color: "error"},
                invalid: {color: "error"},
            },
            items,
            footer: "Fix these issues before continuing",
            footerIcon: "!",
            footerIconColor: "warning",
        });
    },

    /**
     * Log security issues with appropriate severity grouping
     */
    security: (title: string, result: SecurityResult) => {
        // Generate subtitle
        const summaryParts = [
            result.highConfidenceCount > 0 &&
                `${result.highConfidenceCount} high risk`,
            result.mediumConfidenceCount > 0 &&
                `${result.mediumConfidenceCount} medium risk`,
            result.lowConfidenceCount > 0 &&
                `${result.lowConfidenceCount} low risk`,
        ].filter(Boolean);

        const subtitle = format(
            `<subtle>Found:</subtle> ${result.totalCount} potential secret${result.totalCount !== 1 ? "s" : ""} <subtle>${summaryParts.join(" • ")}</subtle>`
        );

        // Map to items
        const items = result.secretsFound.map((issue) => ({
            level: issue.confidence,
            key: issue.path || issue.key || "unknown",
            description: issue.reason,
            extra: issue.category,
        }));

        logger.logIssues({
            title: `⚠ ${title}`,
            subtitle,
            levels: {
                high: {color: "error"},
                medium: {color: "warning"},
                low: {color: "muted"},
            },
            items,
            footer: "Generation blocked for security",
            footerIcon: "✗",
            footerIconColor: "error",
        });
    },

    header: (title: string) => {
        logF(
            `<secondary>${"═".repeat(Math.max(title.length + 4, 40))}</secondary>`
        );
        logF(`<secondary>  ${title.toUpperCase()}  </secondary>`);
        logF(
            `<secondary>${"═".repeat(Math.max(title.length + 4, 40))}</secondary>`
        );
    },

    divider: (text?: string) => {
        const barLength = 40;

        if (text) {
            // Minus 2 for padding
            const remaining = barLength - 2 - text.length;
            const padding = Math.max(0, Math.floor(remaining / 2));
            const line = "─".repeat(padding);
            const equalizer = remaining % 2 === 0 ? "" : "─";
            logF(`<subtle>${line} ${text} ${line}${equalizer}</subtle>`);
        } else {
            logF(`<subtle>${"─".repeat(barLength)}</subtle>`);
        }
    },

    bullet: (text: string, level: number = 1) => {
        const indent = "  ".repeat(level);
        logF(`<subtle>${indent}•</subtle> ${text}`);
    },

    list: (items: string[], level: number = 1) => {
        const indent = "  ".repeat(level);
        items.forEach((item) => {
            logF(`<subtle>${indent}•</subtle> ${item}`);
        });
    },

    /**
     * Command prefix for live output
     */
    prefix: {
        command: (name: string, message: string) => {
            logF(`<secondary>[${name}]</secondary> ${message}`);
        },
    },
};
