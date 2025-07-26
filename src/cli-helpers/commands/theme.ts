// cli-helpers/commands/theme.ts

import {Command} from "commander";
import {
    pretty,
    setTheme,
    configurePretty,
    getCurrentTheme,
} from "../../utils/pretty";
import {themes, type ThemeName, getTheme} from "../../utils/themes";

/**
 * Create a realistic demo preview of a theme
 */
function createThemeDemo(themeName: ThemeName, compact: boolean = false): void {
    const originalTheme = pretty.text.accent(""); // Get current theme
    setTheme(themeName);

    if (compact) {
        // Compact preview for list command
        console.log(
            `${pretty.text.accent("●")} ${pretty.text.accent(themeName)}`
        );
        console.log(
            `  ${pretty.text.success("✅ Success")} ${pretty.text.error("❌ Error")} ${pretty.text.warning("⚠️  Warning")} ${pretty.text.info("ℹ️  Info")}`
        );
        console.log(
            `  ${pretty.text.file("📄 Files")} ${pretty.text.command("▶️  Commands")} ${pretty.text.accent("🚀 Accent")}`
        );
    } else {
        // Full demo preview
        const theme = getTheme(themeName);

        // Header
        console.log();
        pretty.format.header(`${themeName.toUpperCase()} THEME DEMO`);
        console.log();

        // Simulate a realistic build process
        pretty.loading("Building project...");
        pretty.success("TypeScript compiled");
        pretty.success("Assets bundled");
        pretty.file("Generated: dist/index.js");
        pretty.file("Generated: dist/types.d.ts");

        console.log();

        // Simulate command execution with prefixes
        console.log(`${pretty.text.info("🚀 Running:")} npm test`);
        console.log(`${pretty.prefix.command("NPM")}Running test suite...`);
        console.log(`${pretty.prefix.command("NPM")}✓ utils.test.ts (5 tests)`);
        console.log(`${pretty.prefix.command("NPM")}✗ api.test.ts (2 failed)`);
        pretty.warn("Some tests failed");

        console.log();

        // Simulate validation errors (Type B - structured)
        pretty.validation.errorGroup("Configuration validation failed", [
            {
                field: "API_KEY",
                message: "Required field missing",
                type: "missing",
            },
            {
                field: "PORT",
                message: "expected number, got string",
                type: "type",
            },
            {
                field: "TIMEOUT",
                message: "value too large (max: 30000)",
                type: "invalid",
            },
        ]);

        console.log();
        pretty.info(
            `💡 Check your ${pretty.text.accent(".env")} file and fix the issues above`
        );

        console.log();

        // Simulate mixed results (Type C - grouped)
        const results = [
            {type: "success" as const, message: "Database connected"},
            {type: "success" as const, message: "Redis cache ready"},
            {type: "warning" as const, message: "Using fallback configuration"},
            {type: "error" as const, message: "Failed to load plugins"},
        ];
        pretty.process.mixed(results);

        console.log();

        // Show generation results (Type D - sectioned)
        console.log(`${pretty.text.accent("Results:")}`);
        pretty.file("Generated: config.json");
        pretty.file("Generated: .env.example");
        pretty.error("Failed: secrets.yaml (permission denied)");
        console.log();
        pretty.complete("Generation complete! (2/3 files)");

        console.log();

        // Show color palette
        pretty.format.divider("Color Palette");
        console.log(
            `${pretty.text.success("Success")} ${pretty.text.error("Error")} ${pretty.text.warning("Warning")} ${pretty.text.info("Info")} ${pretty.text.accent("Accent")}`
        );
        console.log(
            `${pretty.text.file("File")} ${pretty.text.command("Command")} ${pretty.text.debug("Debug")} ${pretty.text.muted("Muted")} ${pretty.text.dimmed("Dimmed")}`
        );

        console.log();
        console.log(
            `Theme: ${pretty.text.accent(theme.name)} - ${theme.description}`
        );
        console.log(
            `Background: ${pretty.text.dimmed(theme.colors.background)}`
        );
    }
}

/**
 * Show all themes with mini previews for easy comparison
 */
function showThemeList(): void {
    const currentThemeName = getCurrentTheme().name;

    pretty.format.header("AVAILABLE THEMES");
    console.log();

    const themeList = Object.keys(themes) as ThemeName[];

    themeList.forEach((themeName, index) => {
        const theme = getTheme(themeName);
        const isCurrentTheme = themeName === currentThemeName;

        if (index > 0) console.log(); // Spacing between themes

        // Temporarily switch to this theme for the demo
        const originalConfig = {...(pretty as any)}; // Store original
        createThemeDemo(themeName, true);

        // Show description
        console.log(`  ${pretty.text.dimmed(theme.description)}`);

        if (isCurrentTheme) {
            console.log(`  ${pretty.text.accent("← Currently active")}`);
        }
    });

    console.log();
    pretty.format.divider();
    pretty.info(`Current theme: ${pretty.text.accent(currentThemeName)}`);
    pretty.info(
        `Preview a theme: ${pretty.text.command("axogen theme preview <theme>")}`
    );
    pretty.info(
        `Set theme: ${pretty.text.command("axogen theme set <theme>")}`
    );
    console.log();
    pretty.info(
        `💡 Set default with: ${pretty.text.accent("export AXOGEN_THEME=astrodark")}`
    );
}

/**
 * Show a comprehensive preview of a specific theme
 */
function showThemePreview(themeName: ThemeName): void {
    createThemeDemo(themeName, false);

    console.log();
    pretty.format.divider();
    pretty.info(
        `To use this theme: ${pretty.text.command(`axogen --theme ${themeName} <command>`)}`
    );
    pretty.info(
        `Set as default: ${pretty.text.command(`export AXOGEN_THEME=${themeName}`)}`
    );
}

/**
 * Compare multiple themes side by side
 */
function compareThemes(themeNames: ThemeName[]): void {
    pretty.format.header("THEME COMPARISON");
    console.log();

    // Show each theme's key colors in a compact format
    themeNames.forEach((themeName) => {
        const originalTheme = getCurrentTheme().name;
        setTheme(themeName);

        console.log(`${pretty.text.bold(themeName.toUpperCase())}`);
        console.log(
            `  Build: ${pretty.text.success("✅ Success")} ${pretty.text.error("❌ Error")} ${pretty.text.warning("⚠️  Warning")} ${pretty.text.loading("🚀 Loading")}`
        );
        console.log(
            `  Files: ${pretty.text.file("📄 Generated")} ${pretty.text.command("▶️  Commands")} ${pretty.text.info("ℹ️  Info")} ${pretty.text.debug("🐛 Debug")}`
        );
        console.log();

        // Restore original theme
        setTheme(originalTheme as ThemeName);
    });

    pretty.info("Use 'axogen theme preview <name>' for a full demonstration");
}

export function createThemeCommand(): Command {
    const themeCmd = new Command("theme").description(
        "Manage color themes for the CLI"
    );

    // Enhanced list command with previews
    themeCmd
        .command("list")
        .alias("ls")
        .description("List all available themes with previews")
        .action(() => {
            showThemeList();
        });

    // Show current theme
    themeCmd
        .command("current")
        .description("Show current theme information")
        .action(() => {
            const current = getCurrentTheme();
            pretty.info(`Current theme: ${pretty.text.accent(current.name)}`);
            console.log();
            createThemeDemo(current.name as ThemeName, true);
            console.log();
            console.log(`${pretty.text.dimmed(current.description)}`);
        });

    // Enhanced preview command with realistic demo
    themeCmd
        .command("preview <theme>")
        .description("Preview a theme with realistic CLI output Examples")
        .action((themeName: string) => {
            if (!(themeName in themes)) {
                pretty.error(`Invalid theme "${themeName}"`);
                console.log();
                showThemeList();
                process.exit(1);
            }

            showThemePreview(themeName as ThemeName);
        });

    // Set theme for current session
    themeCmd
        .command("set <theme>")
        .description("Set theme for current session")
        .action((themeName: string) => {
            if (!(themeName in themes)) {
                pretty.error(`Invalid theme "${themeName}"`);
                console.log();
                showThemeList();
                process.exit(1);
            }

            setTheme(themeName as ThemeName);
            pretty.success(`Theme changed to ${pretty.text.accent(themeName)}`);
            console.log();
            createThemeDemo(themeName as ThemeName, true);
            console.log();
            pretty.info(
                `Use this theme: ${pretty.text.command(`axogen --theme ${themeName} <command>`)}`
            );
            pretty.info(
                `Set as default: ${pretty.text.command(`export AXOGEN_THEME=${themeName}`)}`
            );
        });

    // Compare multiple themes
    themeCmd
        .command("compare [themes...]")
        .description("Compare multiple themes side by side")
        .action((themeNames: string[]) => {
            if (themeNames.length === 0) {
                // Compare all themes if none specified
                compareThemes(Object.keys(themes) as ThemeName[]);
            } else {
                // Validate theme names
                const validThemes: ThemeName[] = [];
                const invalidThemes: string[] = [];

                themeNames.forEach((name) => {
                    if (name in themes) {
                        validThemes.push(name as ThemeName);
                    } else {
                        invalidThemes.push(name);
                    }
                });

                if (invalidThemes.length > 0) {
                    pretty.error(`Invalid themes: ${invalidThemes.join(", ")}`);
                    console.log();
                    showThemeList();
                    process.exit(1);
                }

                if (validThemes.length < 2) {
                    pretty.warn("Need at least 2 themes to compare");
                    compareThemes(Object.keys(themes) as ThemeName[]);
                } else {
                    compareThemes(validThemes);
                }
            }
        });

    // Demo command - show what CLI looks like during actual usage
    themeCmd
        .command("demo [theme]")
        .description(
            "Run a comprehensive demo showing real CLI usage scenarios"
        )
        .action((themeName?: string) => {
            const theme = themeName
                ? (themeName as ThemeName)
                : (getCurrentTheme().name as ThemeName);

            if (themeName && !(themeName in themes)) {
                pretty.error(`Invalid theme "${themeName}"`);
                console.log();
                showThemeList();
                process.exit(1);
            }

            // Run an extended demo that simulates real CLI usage
            pretty.format.header(
                `AXOGEN CLI DEMO - ${theme.toUpperCase()} THEME`
            );
            console.log();

            // Simulate a full project setup and build
            createThemeDemo(theme, false);

            console.log();
            pretty.format.divider("Want to try it?");
            pretty.info(
                `Use this theme: ${pretty.text.command(`axogen --theme ${theme} generate`)}`
            );
            pretty.info(
                `Set permanently: ${pretty.text.command(`export AXOGEN_THEME=${theme}`)}`
            );
        });

    // Show help when no subcommand is provided
    themeCmd.action(() => {
        pretty.info("Theme management commands:");
        console.log();
        pretty.format.table([
            {key: "list", value: "List all themes with previews"},
            {key: "current", value: "Show current theme"},
            {
                key: "preview <theme>",
                value: "Full preview with realistic Examples",
            },
            {key: "set <theme>", value: "Set theme for current session"},
            {
                key: "compare [themes...]",
                value: "Compare multiple themes side by side",
            },
            {key: "demo [theme]", value: "Comprehensive demo of CLI usage"},
        ]);
        console.log();
        pretty.info(
            `💡 Tip: Try ${pretty.text.command("axogen theme list")} to see all themes with previews!`
        );
        console.log();
        pretty.info(
            `Set default theme: ${pretty.text.accent("export AXOGEN_THEME=astrodark")}`
        );
        pretty.info(
            `Use theme once: ${pretty.text.accent("axogen --theme aura <command>")}`
        );
    });

    return themeCmd;
}
