import {Command} from "commander";
import {
    themes,
    type ThemeName,
    getTheme,
    themeManager,
} from "../../utils/console/themes.ts";
import {logger} from "../../utils/console/logger.ts";

export function createThemeCommand(): Command {
    const themeCmd = new Command("theme").description(
        "Manage color themes for the CLI"
    );

    // Enhanced list command with previews
    themeCmd
        .command("list")
        .alias("ls")
        .description("List all available themes with previews")
        .action(themeList);

    // Show current theme
    themeCmd
        .command("current")
        .description("Show current theme information")
        .action(() => {
            const current = themeManager.theme;
            logger.logF(
                `<muted>Current theme:</muted> <primary>${current.name}</primary>`
            );
            console.log();
            themeSnippet(current.name as ThemeName);
        });

    // Set theme for current session
    themeCmd
        .command("set <theme>")
        .description("Set theme for current session")
        .action((themeName: string) => {
            themeSet(themeName);
        });

    // Demo command - show what CLI looks like during actual usage
    themeCmd
        .command("demo [theme]")
        .description("Show how the Theme looks like")
        .action((themeName?: string) => {
            const theme = themeManager.theme;
            themeDemo(themeName || theme.name);
        });

    // Show help when no subcommand is provided
    themeCmd.action(() => {
        logger.info("Theme management commands:");
        console.log();
        logger.bullet("list|ls", 1);
        logger.bullet("current", 1);
        logger.bullet("set <subtle>\\<theme></subtle>", 1);
        logger.bullet("demo <subtle>[theme]</subtle>", 1);
    });

    return themeCmd;
}

function themeSnippet(themeName: ThemeName) {
    const originalTheme = themeManager.theme;
    themeManager.setTheme(themeName);

    logger.logF(`<primary>● ${themeManager.theme.name}</primary>`);
    logger.logF(`  <subtle>${themeManager.theme.description}</subtle>`);
    logger.logF(
        `  <success>Success</success> <error>Error</error> <warning>Warning</warning> <primary>Primary</primary> <secondary>Secondary</secondary>`
    );
    console.log();

    themeManager.setTheme(originalTheme.name);
}

function themeSet(themeName: string) {
    const themeNames = Object.keys(themes) as ThemeName[];

    if (!themeNames.includes(themeName as ThemeName)) {
        logger.error(`Theme "${themeName}" not found`);
        logger.info(`Available themes: ${themeNames.join(", ")}`);
        return;
    }

    themeManager.setTheme(themeName, true);
    logger.success(`Theme set to <primary>${themeName}</primary>`);

    // Show a quick preview
    logger.logF(`<subtle>${themeManager.theme.description}</subtle>`);
    logger.logF(
        `<success>Success</success> <error>Error</error> <warning>Warning</warning> <primary>Primary</primary> <secondary>Secondary</secondary>`
    );
}

function themeList() {
    const originalTheme = themeManager.theme;

    logger.header("AVAILABLE THEMES");
    console.log();

    const themeNames = Object.keys(themes) as ThemeName[];

    for (const themeName of themeNames) {
        themeSnippet(themeName);
    }

    logger.logF(
        `Set a theme: <secondary>axogen theme set \\<name></secondary>`
    );
    logger.logF(
        `Demo a theme: <secondary>axogen theme demo \\<name></secondary>`
    );

    themeManager.setTheme(originalTheme.name);
}

function themeDemo(themeName: string) {
    const originalTheme = themeManager.theme;

    const themeNames = Object.keys(themes) as ThemeName[];

    if (!themeNames.includes(themeName as ThemeName)) {
        logger.error(`Theme "${themeName}" not found`);
        logger.info(`Available themes: ${themeNames.join(", ")}`);
        return;
    }

    themeManager.setTheme(themeName);

    logger.header(`${themeName.toUpperCase()} THEME DEMO`);
    logger.info(themeManager.theme.description);
    console.log();

    // Show comprehensive demo
    logger.divider("Project Status");
    logger.start("Initializing project...");
    logger.info("Loading configuration files");
    logger.success("Configuration loaded successfully");
    logger.warn("Some dependencies need updates");
    logger.error("Build failed on TypeScript compilation");
    console.log();

    logger.divider("File Operations");
    logger.file("Created", "src/components/Header.tsx");
    logger.file("Updated", "package.json");
    logger.file("Generated", "dist/bundle.js");
    console.log();

    logger.divider("Command Execution");
    logger.command("npm run build");
    logger.prefix.command("BUILD", "Compiling TypeScript...");
    logger.prefix.command("BUILD", "Bundling assets...");
    logger.prefix.command("BUILD", "Optimizing for production...");
    console.log();

    logger.divider("Text Styling");
    logger.logF(
        `Colors: <success>Success</success> <error>Error</error> <warning>Warning</warning> <primary>Primary</primary> <secondary>Secondary</secondary>`
    );
    logger.logF(
        `Utilities: <d>Dimmed</d> <subtle>Subtle</subtle> <muted>Muted</muted>`
    );
    console.log();

    logger.logF(
        `Like this theme? Set it with: <secondary>axogen theme set ${themeName}</secondary>`
    );

    themeManager.setTheme(originalTheme.name);
}
