import chalk, {type ChalkInstance} from "chalk";
import {parseAndTransform, type TagTransformers} from "./formatter.ts";
import {setPersistentEnvVariable} from "../../env/helpers.ts";

/**
 * Simplified theme interface with auto-generated neutral scale
 */
export interface Theme {
    name: string;
    description: string;
    colors: {
        // Primary/Brand colors
        primary: string; // Main brand color for primary actions
        secondary: string; // Accent brand color

        // Semantic colors (status/meaning)
        success: string; // Green - positive states, successful actions
        warning: string; // Yellow - warnings, caution
        danger: string; // Red - errors, destructive actions

        // Neutral endpoints (system generates 0-900 scale)
        neutralLight: string; // Lightest neutral (usually white/near-white)
        neutralDark: string; // Darkest neutral (usually black/near-black)
    };
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) throw new Error(`Invalid hex color: ${hex}`);
    return [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
    ];
}

/**
 * Convert RGB to hex
 */
function rgbToHex(r: number, g: number, b: number): string {
    return (
        "#" +
        [r, g, b]
            .map((x) => {
                const hex = Math.round(x).toString(16);
                return hex.length === 1 ? "0" + hex : hex;
            })
            .join("")
    );
}

/**
 * Interpolate between two colors
 */
function interpolateColor(
    color1: string,
    color2: string,
    factor: number
): string {
    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);

    const r = r1 + factor * (r2 - r1);
    const g = g1 + factor * (g2 - g1);
    const b = b1 + factor * (b2 - b1);

    return rgbToHex(r, g, b);
}

/**
 * Generate neutral color scale from light to dark
 */
function generateNeutralScale(
    lightColor: string,
    darkColor: string
): Record<string, string> {
    // Define the scale points (0 = lightest, 900 = darkest)
    const scalePoints = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    const neutrals: Record<string, string> = {};

    scalePoints.forEach((point) => {
        const factor = point / 900; // Convert to 0-1 range
        neutrals[point.toString()] = interpolateColor(
            lightColor,
            darkColor,
            factor
        );
    });

    return neutrals;
}

/**
 * VSCode Dark theme - Based on VS Code's default dark theme
 */
export const vscode: Theme = {
    name: "vscode",
    description: "VS Code's default dark theme with balanced contrast",
    colors: {
        primary: "#007fd4", // VS Code blue for primary actions
        secondary: "#ff6b35", // Not actually used in VS Code, but good as accent
        success: "#0dbc79", // VS Code green for success states
        warning: "#ffcc02", // Warm yellow for warnings
        danger: "#f14c4c", // VS Code red for errors

        neutralLight: "#ffffff", // Pure white
        neutralDark: "#1e1e1e", // VS Code background
    },
};

/**
 * Astrodark theme - Sophisticated dark theme
 */
export const astrodark: Theme = {
    name: "astrodark",
    description: "Sophisticated dark theme with balanced vibrant colors",
    colors: {
        primary: "#CC83E3", // Purple-pink primary
        secondary: "#50A4E9", // Bright blue accent
        success: "#75AD47", // Muted green
        warning: "#D09214", // Golden yellow
        danger: "#F8747E", // Bright coral

        neutralLight: "#ffffff", // Pure white
        neutralDark: "#111317", // Dark background
    },
};

/**
 * Aura theme - Vibrant neon-inspired
 */
export const aura: Theme = {
    name: "aura",
    description: "Vibrant neon-inspired dark theme with electric colors",
    colors: {
        primary: "#A277FF", // Vibrant purple
        secondary: "#4D8AFF", // Bright blue
        success: "#61FFCA", // Bright cyan-green
        warning: "#FFCA85", // Orange-yellow
        danger: "#FF6767", // Bright red

        neutralLight: "#ffffff", // Pure white
        neutralDark: "#110F18", // Deep dark background
    },
};

/**
 * Doom One theme - Classic sophisticated
 */
export const doomOne: Theme = {
    name: "doom-one",
    description: "Classic sophisticated dark theme with muted vibrancy",
    colors: {
        primary: "#c678dd", // Bright purple
        secondary: "#51afef", // Bright blue
        success: "#98be65", // Olive green
        warning: "#ecbe7b", // Warm yellow
        danger: "#ff6c6b", // Coral red

        neutralLight: "#ffffff", // Pure white
        neutralDark: "#1b2229", // Dark background
    },
};

/**
 * Catppuccin Mocha theme - Soothing pastels
 */
export const catppuccinMocha: Theme = {
    name: "catppuccin-mocha",
    description: "Soothing pastel theme for comfortable long sessions",
    colors: {
        primary: "#cba6f7", // Mauve
        secondary: "#89b4fa", // Blue
        success: "#a6e3a1", // Green
        warning: "#f9e2af", // Yellow
        danger: "#f38ba8", // Red

        neutralLight: "#ffffff", // Pure white
        neutralDark: "#1e1e2e", // Base background
    },
};

/**
 * Available themes
 */
export const themes = {
    vscode,
    astrodark,
    aura,
    "doom-one": doomOne,
    "catppuccin-mocha": catppuccinMocha,
} as const;

export type ThemeName = keyof typeof themes;

/**
 * All possible color names in the theme
 */
export const themeColorNames = [
    "primary",
    "secondary",
    "success",
    "warning",
    "danger",
    "neutral_0",
    "neutral_100",
    "neutral_200",
    "neutral_300",
    "neutral_400",
    "neutral_500",
    "neutral_600",
    "neutral_700",
    "neutral_800",
    "neutral_900",
] as const;

export type ThemeColorName = (typeof themeColorNames)[number];

export const colorizeColorNames = [
    ...themeColorNames,
    "text",
    "textSecondary",
    "textMuted",
    "background",
    "backgroundLight",
    "border",
] as const;

export type ColorizeColorName = (typeof colorizeColorNames)[number];

/**
 * Tag mappings for inline color formatting (Bun-style)
 */
export const TAG_MAP = {
    // Style modifiers
    b: "bold",
    d: "dim",
    i: "italic",
    u: "underline",
    s: "strikethrough",

    // Semantic colors
    primary: "primary",
    secondary: "secondary",
    success: "success",
    warning: "warning",
    danger: "danger",
    error: "danger", // alias

    // Neutral shades
    muted: "neutral_400",
    subtle: "neutral_300",
    text: "neutral_700",
    "dim-text": "neutral_500",

    // Reset
    r: "reset",
} as const;

export type TagName = keyof typeof TAG_MAP;

/**
 * Default theme
 */
export const DEFAULT_THEME: ThemeName =
    (process.env.AXOGEN_THEME as ThemeName) || "vscode";

export const DEFAULT_ENABLE_COLOR =
    (process.env.AXOGEN_ENABLE_COLOR || "true").toLowerCase() === "true";

/**
 * Get theme by name with fallback to default
 */
export function getTheme(name?: string): Theme {
    if (!name || !(name in themes)) {
        return themes[DEFAULT_THEME];
    }
    return themes[name as ThemeName];
}

/**
 * List all available themes
 */
export function listThemes(): Array<{name: string; description: string}> {
    return Object.values(themes).map((theme) => ({
        name: theme.name,
        description: theme.description,
    }));
}

/**
 * Validate theme name
 */
export function isValidTheme(name: string): name is ThemeName {
    return name in themes;
}

/**
 * Theme manager for managing and switching themes
 */
export class ThemeManager {
    private currentTheme: Theme;
    private colorizer: Record<ColorizeColorName, ChalkInstance>;
    private neutralColors: Record<string, string>;
    private transformers: TagTransformers<TagName>;
    private enableColor: boolean = DEFAULT_ENABLE_COLOR;

    constructor() {
        this.currentTheme = getTheme(DEFAULT_THEME);
        this.neutralColors = generateNeutralScale(
            this.currentTheme.colors.neutralLight,
            this.currentTheme.colors.neutralDark
        );
        this.colorizer = this.createColorizer(this.currentTheme);
        this.transformers = this.createTransformers();
    }

    private createColorizer(theme: Theme): Record<string, ChalkInstance> {
        const colorizer: Record<string, ChalkInstance> = {};

        if (!this.enableColor) {
            // Use chalk.reset for everything if color is disabled
            colorizeColorNames.forEach((name) => {
                colorizer[name] = chalk.white.bgBlack;
            });
            return colorizer;
        }

        // Primary colors
        colorizer.primary = chalk.hex(theme.colors.primary);
        if (theme.colors.secondary) {
            colorizer.secondary = chalk.hex(theme.colors.secondary);
        }

        // Semantic colors
        colorizer.success = chalk.hex(theme.colors.success);
        colorizer.warning = chalk.hex(theme.colors.warning);
        colorizer.danger = chalk.hex(theme.colors.danger);

        // Generated neutral colors with underscore naming
        Object.entries(this.neutralColors).forEach(([level, color]) => {
            colorizer[`neutral_${level}`] = chalk.hex(color);
        });

        // Convenience aliases for common use cases
        colorizer.text = chalk.hex(this.neutralColors["200"]); // Primary text
        colorizer.textSecondary = chalk.hex(this.neutralColors["600"]); // Secondary text
        colorizer.textMuted = chalk.hex(this.neutralColors["400"]); // Muted text
        colorizer.background = chalk.hex(this.neutralColors["900"]); // Background
        colorizer.backgroundLight = chalk.hex(this.neutralColors["100"]); // Light background
        colorizer.border = chalk.hex(this.neutralColors["300"]); // Borders

        return colorizer;
    }

    private createTransformers(): TagTransformers<TagName> {
        return {
            b: (text) => this.colorizer.text.bold(text),
            d: (text) => this.colorizer.text.dim(text),
            i: (text) => this.colorizer.text.italic(text),
            u: (text) => this.colorizer.text.underline(text),
            s: (text) => this.colorizer.text.strikethrough(text),
            primary: (text) => this.colorizer.primary(text),
            secondary: (text) => this.colorizer.secondary(text),
            success: (text) => this.colorizer.success(text),
            warning: (text) => this.colorizer.warning(text),
            danger: (text) => this.colorizer.danger(text),
            error: (text) => this.colorizer.danger(text), // alias for danger
            muted: (text) => this.colorizer.textMuted(text),
            subtle: (text) => this.colorizer.textSecondary(text),
            text: (text) => this.colorizer.text(text),
            "dim-text": (text) => this.colorizer.textSecondary(text),
            r: (text) => chalk.reset(text),
        };
    }

    get colorize() {
        return this.colorizer;
    }

    get theme(): Theme {
        return this.currentTheme;
    }

    get neutrals(): Record<string, string> {
        return this.neutralColors;
    }

    setTheme(name: string, persistent: boolean = false): void {
        if (!isValidTheme(name)) {
            throw new Error(`Invalid theme name: ${name}`);
        }
        this.currentTheme = getTheme(name);
        this.updateAll();

        // Save the current theme to the global environment
        process.env.AXOGEN_THEME = this.currentTheme.name;
        if (!persistent) {
            return; // No need to save if not persistent
        }
        setPersistentEnvVariable("AXOGEN_THEME", this.currentTheme.name).catch(
            () => {
                console.warn("Failed to save theme to persistent environment");
            }
        );
    }

    colorOutput(enable: boolean, persistent: boolean = false): void {
        this.enableColor = enable;
        this.updateAll();

        // Save the color output setting to the global environment
        process.env.AXOGEN_ENABLE_COLOR = String(enable);
        if (!persistent) {
            return; // No need to save if not persistent
        }
        setPersistentEnvVariable("AXOGEN_ENABLE_COLOR", String(enable)).catch(
            () => {
                console.warn(
                    "Failed to save color output setting to persistent environment"
                );
            }
        );
    }

    private updateAll(): void {
        this.neutralColors = generateNeutralScale(
            this.currentTheme.colors.neutralLight,
            this.currentTheme.colors.neutralDark
        );
        this.colorizer = this.createColorizer(this.currentTheme);
        this.transformers = this.createTransformers();
    }

    /**
     * Get a specific color from the current theme
     */
    getColor(colorName: ThemeColorName): string {
        const theme = this.currentTheme;

        if (colorName.startsWith("neutral_")) {
            const level = colorName.split("_")[1];
            return this.neutralColors[level] || theme.colors.neutralLight;
        }

        return theme.colors[colorName as keyof typeof theme.colors] as string;
    }

    /**
     * Get the full generated neutral scale
     */
    getNeutralScale(): Record<string, string> {
        return {...this.neutralColors};
    }

    format(xml: string): string {
        return parseAndTransform(xml, this.transformers);
    }
}

export const themeManager = new ThemeManager();
