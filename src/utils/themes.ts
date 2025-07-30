/**
 * Theme interface defining color scheme structure
 */
export interface Theme {
    name: string;
    description: string;
    colors: {
        // Status colors (semantic mapping)
        success: string; // Green variant
        error: string; // Red variant
        warning: string; // Yellow variant
        info: string; // Blue variant

        // Secondary colors
        accent: string; // Primary brand/highlight color
        muted: string; // Secondary text
        subtle: string; // Very subtle text

        // Special purpose
        file: string; // File operations (usually cyan/teal)
        command: string; // Command execution (usually orange/peach)
        debug: string; // Debug information

        // Text colors
        text: string; // Main text color
        dimmed: string; // Dimmed text

        // Background (for context)
        background: string; // Terminal background
    };
}

/**
 * Astrodark theme - Sophisticated dark theme with balanced vibrant colors
 */
export const astrodark: Theme = {
    name: "astrodark",
    description: "Sophisticated dark theme with balanced vibrant colors",
    colors: {
        success: "#75AD47", // Muted green - professional but clear
        error: "#F8747E", // Bright coral - attention-grabbing but not harsh
        warning: "#D09214", // Golden yellow - warm and noticeable
        info: "#50A4E9", // Bright blue - clear and informative

        accent: "#CC83E3", // Purple-pink - distinctive highlight
        muted: "#576176", // Dark gray - subtle secondary text
        subtle: "#ADB0BB", // Light gray - very subtle text

        file: "#00B298", // Teal - distinctive for file operations
        command: "#EFBD58", // Bright yellow - warm command indicator
        debug: "#8DC3F1", // Light blue - calm debug information

        text: "#CACCD3", // Light gray - primary text
        dimmed: "#ADB0BB", // Medium gray - dimmed text

        background: "#111317", // Very dark background
    },
};

/**
 * Aura theme - Vibrant neon-inspired dark theme
 */
export const aura: Theme = {
    name: "aura",
    description: "Vibrant neon-inspired dark theme with electric colors",
    colors: {
        success: "#61FFCA", // Bright cyan-green - electric success
        error: "#FF6767", // Bright red - clear error indication
        warning: "#FFCA85", // Warm orange-yellow - friendly warning
        info: "#A277FF", // Vibrant purple - distinctive info

        accent: "#A277FF", // Vibrant purple - primary highlight
        muted: "#6D6D6D", // Medium gray - subtle text
        subtle: "#6D6D6D", // Same as muted for this theme

        file: "#61FFCA", // Bright cyan - files stand out
        command: "#FFCA85", // Orange-yellow - warm command feel
        debug: "#A277FF", // Purple - consistent with info

        text: "#EDECEE", // Very light - high contrast
        dimmed: "#6D6D6D", // Gray - dimmed text

        background: "#110F18", // Deep dark purple-black
    },
};

/**
 * Doom One theme - Classic sophisticated dark theme
 */
export const doomOne: Theme = {
    name: "doom-one",
    description: "Classic sophisticated dark theme with muted vibrancy",
    colors: {
        success: "#98be65", // Olive green - natural success
        error: "#ff6c6b", // Coral red - warm but clear error
        warning: "#ecbe7b", // Warm yellow - friendly warning
        info: "#51afef", // Bright blue - clear information

        accent: "#c678dd", // Bright purple - distinctive highlight
        muted: "#5b6268", // Dark gray - subtle text
        subtle: "#3f444a", // Very dark gray - very subtle

        file: "#46d9ff", // Bright cyan - clear file indicator
        command: "#da8548", // Orange - warm command indicator
        debug: "#5699af", // Muted cyan - calm debug info

        text: "#bbc2cf", // Light gray - readable text
        dimmed: "#5b6268", // Dark gray - dimmed text

        background: "#1b2229", // Dark blue-gray background
    },
};

/**
 * Catppuccin Mocha theme - Soothing pastel theme
 */
export const catppuccinMocha: Theme = {
    name: "catppuccin-mocha",
    description: "Soothing pastel theme for comfortable long sessions",
    colors: {
        success: "#a6e3a1", // Green
        error: "#f38ba8", // Red
        warning: "#f9e2af", // Yellow
        info: "#89b4fa", // Blue

        accent: "#cba6f7", // Mauve
        muted: "#6c7086", // Surface2
        subtle: "#585b70", // Overlay1

        file: "#94e2d5", // Teal
        command: "#fab387", // Peach
        debug: "#b4befe", // Lavender

        text: "#cdd6f4", // Main text
        dimmed: "#a6adc8", // Subtext0

        background: "#1e1e2e", // Base
    },
};

/**
 * Available themes
 */
export const themes = {
    astrodark,
    aura,
    "doom-one": doomOne,
    "catppuccin-mocha": catppuccinMocha,
} as const;

export type ThemeName = keyof typeof themes;

/**
 * Default theme
 */
export const DEFAULT_THEME: ThemeName = "astrodark";

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
