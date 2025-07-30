import {Command} from "commander";
import {themes, type ThemeName, getTheme} from "../../utils/themes";
import {
    configure,
    getConfig,
    logger,
    LogLevel,
    setTheme,
} from "../../utils/logger";

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
            const config = getConfig();
            const current = getTheme(config.theme);
            logger.info(`Current theme: ${logger.text.accent(current.name)}`);
            console.log();
            themeSnippet(current.name as ThemeName);
            console.log();
            console.log(`${logger.text.dimmed(current.description)}`);
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
            const config = getConfig();
            const theme = getTheme(themeName || config.theme);
            themeDemo(theme.name);
        });

    // Show help when no subcommand is provided
    themeCmd.action(() => {
        logger.info("Theme management commands:");
        console.log();
        logger.format.bullet("list|ls", 1);
        logger.format.bullet("current", 1);
        logger.format.bullet("set <theme>", 1);
        logger.format.bullet("demo [theme]", 1);
    });

    return themeCmd;
}

function themeSnippet(themeName: ThemeName) {
    const originalConfig = getConfig();
    configure({
        level: LogLevel.TRACE, // Set to TRACE for comprehensive demo
        theme: themeName,
    });
    const theme = getTheme(themeName);

    console.log(`${logger.text.accent("●")} ${logger.text.accent(themeName)}`);
    console.log(`  ${logger.text.muted(theme.description)}`);
    console.log(
        `  ${logger.text.success("✓")} ${logger.text.error("✗")} ${logger.text.warning("!")} ${logger.text.info("i")} ${logger.text.file("+")} ${logger.text.command(">")}`
    );
    console.log();

    configure(originalConfig);
}

function themeSet(themeName: string) {
    const originalConfig = getConfig();
    configure({
        level: LogLevel.TRACE, // Set to TRACE for comprehensive demo
    });

    const themeNames = Object.keys(themes) as ThemeName[];

    if (!themeNames.includes(themeName as ThemeName)) {
        logger.error(`Theme "${themeName}" not found`);
        logger.info(`Available themes: ${themeNames.join(", ")}`);
        return;
    }

    setTheme(themeName as ThemeName);
    logger.success(`Theme set to ${logger.text.accent(themeName)}`);

    // Show a quick preview
    const theme = themes[themeName as ThemeName];
    logger.info(theme.description);

    // Restore original config
    configure(originalConfig);
}

function themeList() {
    const originalConfig = getConfig();
    configure({
        level: LogLevel.TRACE, // Set to TRACE for comprehensive demo
    });

    logger.format.header("AVAILABLE THEMES");
    console.log();

    const themeNames = Object.keys(themes) as ThemeName[];

    for (const themeName of themeNames) {
        themeSnippet(themeName);
    }

    logger.info(
        `Set a theme: ${logger.text.command("axogen theme set <name>")}`
    );
    logger.info(
        `Demo a theme: ${logger.text.command("axogen theme demo <name>")}`
    );

    // Restore original config
    configure(originalConfig);
}

function themeDemo(themeName: string) {
    const originalConfig = getConfig();
    configure({
        level: LogLevel.TRACE, // Set to TRACE for comprehensive demo
    });

    const themeNames = Object.keys(themes) as ThemeName[];

    if (!themeNames.includes(themeName as ThemeName)) {
        logger.error(`Theme "${themeName}" not found`);
        logger.info(`Available themes: ${themeNames.join(", ")}`);
        return;
    }

    setTheme(themeName as ThemeName);
    const theme = themes[themeName as ThemeName];

    logger.format.header(`${themeName.toUpperCase()} THEME DEMO`);
    logger.info(theme.description);
    console.log();

    // Show comprehensive demo
    logger.format.divider("Project Status");
    logger.start("Initializing project...");
    logger.info("Loading configuration files");
    logger.success("Configuration loaded successfully");
    logger.warn("Some dependencies need updates");
    logger.error("Build failed on TypeScript compilation");
    logger.ready("Project ready for development");
    console.log();

    logger.format.divider("File Operations");
    logger.file("Created: src/components/Header.tsx");
    logger.file("Updated: package.json");
    logger.file("Generated: dist/bundle.js");
    console.log();

    logger.format.divider("Command Execution");
    logger.command("npm run build");
    console.log(`${logger.prefix.command("BUILD")}Compiling TypeScript...`);
    console.log(`${logger.prefix.command("BUILD")}Bundling assets...`);
    console.log(
        `${logger.prefix.command("BUILD")}Optimizing for production...`
    );
    console.log();

    logger.format.divider("Text Styling");
    logger.info(
        `Colors: ${logger.text.success("Success")} ${logger.text.error("Error")} ${logger.text.warning("Warning")} ${logger.text.accent("Accent")}`
    );
    logger.info(
        `Utilities: ${logger.text.file("Files")} ${logger.text.command("Commands")} ${logger.text.muted("Muted text")}`
    );
    console.log();

    logger.info(
        `Like this theme? Set it with: ${logger.text.command(`axogen theme set ${themeName}`)}`
    );

    // Restore original config
    configure(originalConfig);
}
