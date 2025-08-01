import {themes as prismThemes} from "prism-react-renderer";
import type {Config} from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
    title: "Axogen",
    tagline:
        "TypeScript-native configuration system that unifies typed environment variables, code generation, and task management for any project",
    favicon: "img/favicon.svg",

    // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
    future: {
        v4: true, // Improve compatibility with the upcoming Docusaurus v4
    },

    url: "https://axonotes.github.io",
    baseUrl: "/axogen/",

    organizationName: "axonotes",
    projectName: "axogen",

    onBrokenLinks: "throw",
    onBrokenMarkdownLinks: "warn",

    i18n: {
        defaultLocale: "en",
        locales: ["en"],
    },

    headTags: [
        {
            tagName: "script",
            attributes: {
                defer: true,
                "data-domain": "axonotes.github.io/axogen",
                src: "https://plausible.axonotes.ch/js/script.js",
            },
        },
    ],

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl:
                        "https://github.com/axonotes/axogen/tree/main/website/",
                    remarkPlugins: [
                        [
                            require("@docusaurus/remark-plugin-npm2yarn"),
                            {sync: true},
                        ],
                    ],
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                    },
                    onInlineTags: "warn",
                    onInlineAuthors: "warn",
                    onUntruncatedBlogPosts: "warn",
                    remarkPlugins: [
                        [
                            require("@docusaurus/remark-plugin-npm2yarn"),
                            {sync: true},
                        ],
                    ],
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        navbar: {
            title: "Axogen",
            logo: {
                alt: "Axogen Logo",
                src: "img/favicon.svg",
            },
            items: [
                {
                    type: "docSidebar",
                    sidebarId: "docsSidebar",
                    position: "left",
                    label: "Documentation",
                },
                {to: "/blog", label: "Blog", position: "left"},
                {to: "/docs/faq", label: "FAQ", position: "left"},
                {
                    href: "https://github.com/axonotes/axogen",
                    label: "GitHub",
                    position: "right",
                },
                {
                    href: "https://www.npmjs.com/package/@axonotes/axogen",
                    label: "NPM",
                    position: "right",
                },
            ],
        },
        footer: {
            style: "dark",
            links: [
                {
                    title: "Docs",
                    items: [
                        {
                            label: "Tutorial",
                            to: "/docs/intro",
                        },
                    ],
                },
                {
                    title: "Community",
                    items: [
                        {
                            label: "Discord",
                            href: "https://discord.gg/myBMaaDeQu",
                        },
                        {
                            label: "X",
                            href: "https://x.com/axonotes",
                        },
                    ],
                },
                {
                    title: "More",
                    items: [
                        {
                            label: "Blog",
                            to: "/blog",
                        },
                        {
                            label: "GitHub",
                            href: "https://github.com/axonotes/axogen",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Axonotes. Built with Docusaurus.`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: [
                "typescript",
                "javascript",
                "json",
                "rust",
                "go",
                "python",
                "java",
                "php",
                "toml",
                "yaml",
                "docker",
                "bash",
                "powershell",
                "sql",
                "nginx",
                "makefile",
                "ini",
                "diff",
            ],
        },
        colorMode: {
            defaultMode: "dark",
            disableSwitch: false,
            respectPrefersColorScheme: false,
        },
    } satisfies Preset.ThemeConfig,
};

export default config;
