import type {ReactNode} from "react";
import {useEffect} from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Head from "@docusaurus/Head";
import CodeBlock from "@theme/CodeBlock";
import {
    ArrowRight,
    Github,
    Code2,
    Shield,
    Files,
    Terminal,
    Zap,
    Globe,
} from "lucide-react";

import styles from "./index.module.css";

const FEATURES = [
    {
        title: "TypeScript-Native",
        description:
            "Define your configuration once in TypeScript with full type safety and IntelliSense support. No more guessing what environment variables exist.",
        icon: <Code2 size={32} />,
    },
    {
        title: "Zod Validation",
        description:
            "Built-in runtime validation using Zod schemas. Catch configuration errors early with detailed error messages and type coercion.",
        icon: <Shield size={32} />,
    },
    {
        title: "Multiple Formats",
        description:
            "Generate .env, JSON, YAML, TOML, and custom template files from a single source. Keep everything in sync automatically.",
        icon: <Files size={32} />,
    },
    {
        title: "Smart Commands",
        description:
            "Intelligent command system with TypeScript support. Run validated commands with proper output and beautiful themes.",
        icon: <Terminal size={32} />,
    },
    {
        title: "Lightning Fast",
        description:
            "Generate 11,000 config files (more than you ever need) in 3 seconds. Built for speed without sacrificing developer experience.",
        icon: <Zap size={32} />,
    },
    {
        title: "Language Agnostic",
        description:
            "Works with any project: Python APIs, Go microservices, Rust backends, Java apps, PHP websites. Universal config management.",
        icon: <Globe size={32} />,
    },
];

const EXAMPLE_CODE = `import { defineConfig, loadEnv, env, json } from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
  z.object({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z.enum(["development", "production"]).default("development"),
  })
);

export default defineConfig({
  targets: {
    app: env({
      path: "app/.env",
      variables: {
        DATABASE_URL: envVars.DATABASE_URL,
        PORT: envVars.PORT,
      },
    }),
    config: json({
      path: "config.json", 
      variables: {
        database: { url: envVars.DATABASE_URL },
        server: { port: envVars.PORT },
      },
    }),
  },
  commands: {
    start: \`npm start --port \${envVars.PORT}\`,
  },
});`;

function HomepageHeader() {
    useEffect(() => {
        document.body.setAttribute("data-page", "homepage");
        return () => {
            document.body.removeAttribute("data-page");
        };
    }, []);

    return (
        <header className={clsx(styles.heroBanner)}>
            <div className={styles.heroBackground}></div>
            <div className={styles.heroPattern}></div>
            <div className="container">
                <div className={styles.heroContent}>
                    <div className={styles.heroText}>
                        <Heading as="h1" className={styles.heroTitle}>
                            Stop Hunting Through{" "}
                            <span className={styles.heroTitleGradient}>
                                Config Files
                            </span>
                        </Heading>
                        <p className={styles.heroSubtitle}>
                            TypeScript-native configuration system for{" "}
                            <strong>any project, any language</strong>. Define
                            once, generate everywhere. Type-safe environment
                            variables with Zod validation.
                        </p>

                        <div className={styles.heroButtons}>
                            <Link
                                className={clsx("button", styles.primaryButton)}
                                to="/docs/intro"
                            >
                                <span>Get Started</span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link
                                className={clsx(
                                    "button",
                                    styles.secondaryButton
                                )}
                                to="https://github.com/axonotes/axogen"
                            >
                                <Github size={16} />
                                <span>GitHub</span>
                            </Link>
                        </div>
                    </div>

                    <div className={styles.heroDemo}>
                        <div className={styles.terminalWindow}>
                            <div className={styles.terminalHeader}>
                                <div className={styles.terminalButtons}>
                                    <span
                                        className={styles.terminalButton}
                                    ></span>
                                    <span
                                        className={styles.terminalButton}
                                    ></span>
                                    <span
                                        className={styles.terminalButton}
                                    ></span>
                                </div>
                            </div>
                            <div className={styles.terminalContent}>
                                <div className={styles.terminalLine}>
                                    <span className={styles.prompt}>❯</span>
                                    <span className={styles.command}>
                                        axogen generate
                                    </span>
                                </div>
                                <div className={styles.terminalOutput}>
                                    <div className={styles.validationLine}>
                                        Environment variables validated
                                        successfully
                                    </div>
                                    <div className={styles.generatingLine}>
                                        <span className={styles.arrow}>➤</span>
                                        <span className={styles.generatingText}>
                                            Generating configuration files...
                                        </span>
                                    </div>
                                    <div className={styles.resultsText}>
                                        Results:
                                    </div>
                                    <div className={styles.successLine}>
                                        <span className={styles.plus}>+</span>
                                        <span className={styles.generated}>
                                            Generated <strong>app</strong>
                                        </span>
                                    </div>
                                    <div className={styles.successLine}>
                                        <span className={styles.plus}>+</span>
                                        <span className={styles.generated}>
                                            Generated <strong>config</strong>
                                        </span>
                                    </div>
                                    <div className={styles.completeLine}>
                                        <span className={styles.completeText}>
                                            Generation complete!{" "}
                                        </span>
                                        <span className={styles.fileCount}>
                                            2 files
                                        </span>
                                        <span className={styles.timing}>
                                            {" "}
                                            [4.00ms]
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.statsSection}>
                    <div className={styles.stat}>
                        <div className={styles.statNumber}>11,000</div>
                        <div className={styles.statLabel}>
                            configs in 3 seconds
                        </div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statNumber}>100%</div>
                        <div className={styles.statLabel}>type-safe</div>
                    </div>
                    <div className={styles.stat}>
                        <div className={styles.statNumber}>0</div>
                        <div className={styles.statLabel}>
                            runtime dependencies
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}

function HomepageFeatures() {
    return (
        <section className={styles.featuresSection}>
            <div className="container">
                <div className={styles.sectionHeader}>
                    <Heading as="h2" className={styles.sectionTitle}>
                        Everything you need for config management
                    </Heading>
                    <p className={styles.sectionSubtitle}>
                        Define once in TypeScript, generate everywhere.
                        Type-safe environment variables with validation.
                    </p>
                </div>

                <div className={styles.featuresGrid}>
                    {FEATURES.map((feature, idx) => (
                        <div key={idx} className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                {feature.icon}
                            </div>
                            <Heading as="h3" className={styles.featureTitle}>
                                {feature.title}
                            </Heading>
                            <p className={styles.featureDescription}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HomepageCodeExample() {
    return (
        <section className={styles.codeSection}>
            <div className="container">
                <div className={styles.codeContent}>
                    <div className={styles.codeText}>
                        <Heading as="h2" className={styles.codeTitle}>
                            Simple, Powerful Configuration
                        </Heading>
                        <p className={styles.codeDescription}>
                            Replace scattered config files with type-safe
                            TypeScript configuration. Define your environment
                            variables once with validation, then generate
                            multiple formats automatically.
                        </p>
                        <div className={styles.codeFeatures}>
                            <div className={styles.codeFeature}>
                                Type-safe environment variables
                            </div>
                            <div className={styles.codeFeature}>
                                Runtime validation with Zod
                            </div>
                            <div className={styles.codeFeature}>
                                Multiple output formats
                            </div>
                            <div className={styles.codeFeature}>
                                Secret detection
                            </div>
                        </div>
                        <Link
                            className={clsx("button", styles.ctaButton)}
                            to="/docs/getting-started"
                        >
                            Try Axogen Now
                        </Link>
                    </div>
                    <div className={styles.codeBlock}>
                        <CodeBlock
                            language="typescript"
                            title="axogen.config.ts"
                            showLineNumbers
                            className={styles.codeBlockContent}
                        >
                            {EXAMPLE_CODE}
                        </CodeBlock>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home(): ReactNode {
    return (
        <Layout
            title="TypeScript Configuration System"
            description="Stop hunting through config files. Axogen is a TypeScript-native configuration system that eliminates config chaos with type-safe environment variables, Zod validation, and automatic generation."
        >
            <Head>
                <meta
                    name="keywords"
                    content="typescript configuration, environment variables, config management, dotenv alternative, zod validation, developer tools, typescript config, env files, configuration system, type-safe config, config generation, typescript native, config CLI, developer productivity"
                />
                <meta
                    property="og:title"
                    content="Axogen - TypeScript Configuration System"
                />
                <meta
                    property="og:description"
                    content="Stop hunting through config files. Define once in TypeScript, generate everywhere. Type-safe environment variables with Zod validation."
                />
                <meta
                    property="og:url"
                    content="https://axonotes.github.io/axogen/"
                />
                <meta
                    name="twitter:title"
                    content="Axogen - TypeScript Configuration System"
                />
                <meta
                    name="twitter:description"
                    content="Stop hunting through config files. Define once in TypeScript, generate everywhere."
                />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        name: "Axogen - TypeScript Configuration System",
                        description:
                            "TypeScript-native configuration system that eliminates config file chaos",
                        url: "https://axonotes.github.io/axogen/",
                        mainEntity: {
                            "@type": "SoftwareApplication",
                            name: "Axogen",
                            description:
                                "TypeScript-native configuration system for developers",
                            applicationCategory: "DeveloperApplication",
                            downloadUrl:
                                "https://www.npmjs.com/package/@axonotes/axogen",
                        },
                        breadcrumb: {
                            "@type": "BreadcrumbList",
                            itemListElement: [
                                {
                                    "@type": "ListItem",
                                    position: 1,
                                    name: "Home",
                                    item: "https://axonotes.github.io/axogen/",
                                },
                            ],
                        },
                    })}
                </script>
            </Head>

            <HomepageHeader />
            <main>
                <HomepageFeatures />
                <HomepageCodeExample />
            </main>
        </Layout>
    );
}
