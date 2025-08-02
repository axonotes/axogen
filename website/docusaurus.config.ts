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
                type: "application/ld+json",
            },
            innerHTML: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Axogen",
                description:
                    "TypeScript-native configuration system that unifies typed environment variables, code generation, and task management for any project",
                applicationCategory: "DeveloperApplication",
                operatingSystem: "Linux, macOS, Windows",
                softwareVersion: "0.5.1",
                datePublished: "2025-08-02",
                author: {
                    "@type": "Person",
                    name: "Oliver Seifert",
                    url: "https://github.com/imgajeed76",
                },
                publisher: {
                    "@type": "Organization",
                    name: "Axonotes",
                    url: "https://github.com/axonotes",
                },
                downloadUrl: "https://www.npmjs.com/package/@axonotes/axogen",
                installUrl:
                    "https://axonotes.github.io/axogen/docs/installation",
                codeRepository: "https://github.com/axonotes/axogen",
                programmingLanguage: "TypeScript",
                runtimePlatform: "Node.js",
                offers: {
                    "@type": "Offer",
                    price: "0",
                    priceCurrency: "USD",
                    availability: "https://schema.org/InStock",
                },
                keywords:
                    "typescript, configuration, environment variables, config management, zod validation, developer tools",
                screenshot: "https://axonotes.github.io/axogen/img/social.png",
            }),
        },
        {
            tagName: "script",
            attributes: {
                type: "application/ld+json",
            },
            innerHTML: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Axonotes",
                url: "https://axonotes.github.io/axogen/",
                logo: "https://axonotes.github.io/axogen/img/favicon.svg",
                sameAs: [
                    "https://github.com/axonotes",
                    "https://x.com/axonotes",
                    "https://www.npmjs.com/package/@axonotes/axogen",
                ],
            }),
        },
        // Canonical URL
        {
            tagName: "link",
            attributes: {
                rel: "canonical",
                href: "https://axonotes.github.io/axogen/",
            },
        },
    ],

    scripts: [
        {
            defer: true,
            "data-domain": "axonotes.github.io/axogen",
            src: "https://plausible.axonotes.ch/js/script.js",
        },
    ],

    presets: [
        [
            "classic",
            {
                docs: {
                    sidebarPath: "./sidebars.ts",
                    editUrl:
                        "https://github.com/axonotes/axogen/tree/main/website/docs",
                    remarkPlugins: [
                        [
                            require("@docusaurus/remark-plugin-npm2yarn"),
                            {sync: true},
                        ],
                    ],
                    showLastUpdateTime: true,
                    showLastUpdateAuthor: true,
                },
                blog: {
                    showReadingTime: true,
                    feedOptions: {
                        type: ["rss", "atom"],
                        xslt: true,
                        title: "Axogen Blog",
                        description:
                            "Latest updates and insights about TypeScript configuration management",
                        copyright: `Copyright © ${new Date().getFullYear()} Axonotes.`,
                        language: "en",
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
                    blogTitle: "Axogen Blog",
                    blogDescription:
                        "Learn about TypeScript configuration management, developer tools, and best practices",
                },
                theme: {
                    customCss: "./src/css/custom.css",
                },
                sitemap: {
                    lastmod: "date",
                    changefreq: "weekly",
                    priority: 0.5,
                    ignorePatterns: ["/tags/**"],
                    filename: "sitemap.xml",
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        metadata: [
            {
                name: "keywords",
                content:
                    "typescript configuration, environment variables, config management, dotenv alternative, zod validation, typescript env, config sync, developer tools, build tools, typescript config system",
            },
            {
                name: "description",
                content:
                    "Stop hunting through config files. Axogen is a TypeScript-native configuration system that eliminates config chaos with type-safe environment variables and automatic generation.",
            },
            {property: "og:type", content: "website"},
            {
                property: "og:title",
                content:
                    "Axogen - TypeScript Configuration System | Stop Config File Chaos",
            },
            {
                property: "og:description",
                content:
                    "Define once in TypeScript, generate everywhere. Type-safe environment variables with Zod validation for any project.",
            },
            {
                property: "og:image",
                content: "https://axonotes.github.io/axogen/img/social.png",
            },
            {property: "og:url", content: "https://axonotes.github.io/axogen/"},
            {name: "twitter:card", content: "summary_large_image"},
            {
                name: "twitter:title",
                content: "Axogen - TypeScript Configuration System",
            },
            {
                name: "twitter:description",
                content:
                    "Stop hunting through config files. Define once in TypeScript, generate everywhere with type-safe validation.",
            },
            {
                name: "twitter:image",
                content: "https://axonotes.github.io/axogen/img/social.png",
            },
            {name: "twitter:creator", content: "@axonotes"},
            {name: "author", content: "Oliver Seifert"},
            {name: "robots", content: "index, follow"},
            {name: "googlebot", content: "index, follow"},
        ],
        navbar: {
            title: "Axogen",
            logo: {
                alt: "Axogen - TypeScript Configuration System Logo",
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
                            label: "Getting Started",
                            to: "/docs/intro",
                        },
                        {
                            label: "Installation",
                            to: "/docs/installation",
                        },
                        {
                            label: "Configuration",
                            to: "/docs/basic-configuration",
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
                            label: "X (Twitter)",
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
                        {
                            label: "NPM Package",
                            href: "https://www.npmjs.com/package/@axonotes/axogen",
                        },
                        {
                            label: "Sponsor",
                            href: "https://github.com/sponsors/imgajeed76",
                        },
                    ],
                },
            ],
            copyright: `Copyright © ${new Date().getFullYear()} Axonotes. Built with Docusaurus.`,
        },
        image: "img/social.png",
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
