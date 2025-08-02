import type {ReactNode} from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";
import Head from "@docusaurus/Head";
import CodeBlock from "@theme/CodeBlock";

import styles from "./index.module.css";

function HomepageHeader() {
    const {siteConfig} = useDocusaurusContext();
    return (
        <header className={clsx("hero hero--primary", styles.heroBanner)}>
            <div className="container">
                <Heading as="h1" className="hero__title">
                    {siteConfig.title}
                </Heading>
                <p className="hero__subtitle">{siteConfig.tagline}</p>

                {/* Enhanced call-to-action section */}
                <div className={styles.buttons}>
                    <Link
                        className="button button--secondary button--lg"
                        to="/docs/intro"
                    >
                        Get Started →
                    </Link>
                    <Link
                        className="button button--outline button--lg"
                        to="https://github.com/axonotes/axogen"
                    >
                        ⭐ GitHub
                    </Link>
                </div>

                {/* Quick install command */}
                <div className="margin-top--lg">
                    <CodeBlock language="bash">
                        npm install @axonotes/axogen
                    </CodeBlock>
                </div>
            </div>
        </header>
    );
}

function HomepageFeatures() {
    const features = [
        {
            title: "TypeScript-Native",
            description:
                "Define your configuration once in TypeScript with full type safety and IntelliSense support. No more guessing what environment variables exist.",
            icon: "🔧",
        },
        {
            title: "Zod Validation",
            description:
                "Built-in runtime validation using Zod schemas. Catch configuration errors early with detailed error messages and type coercion.",
            icon: "✅",
        },
        {
            title: "Multiple Formats",
            description:
                "Generate .env, JSON, YAML, TOML, and custom template files from a single source. Keep everything in sync automatically.",
            icon: "📁",
        },
        {
            title: "Smart Commands",
            description:
                "Intelligent command system with TypeScript support. Run validated commands with proper output and beautiful themes.",
            icon: "⚡",
        },
        {
            title: "Lightning Fast",
            description:
                "Generate 11,000 config files (more than anyone ever needs) in 3 seconds. Built for speed without sacrificing developer experience.",
            icon: "🚀",
        },
        {
            title: "Language Agnostic",
            description:
                "Works with any project: Python APIs, Go microservices, Rust backends, Java apps, PHP websites. Universal config management.",
            icon: "🌍",
        },
    ];

    return (
        <section className="padding-vert--xl">
            <div className="container">
                <div className="row">
                    <div className="col col--12">
                        <Heading
                            as="h2"
                            className="text--center margin-bottom--lg"
                        >
                            Stop Hunting Through Config Files
                        </Heading>
                        <p className="text--center margin-bottom--xl">
                            Define once in TypeScript, generate everywhere.
                            Type-safe environment variables with validation.
                        </p>
                    </div>
                </div>
                <div className="row">
                    {features.map((feature, idx) => (
                        <div key={idx} className="col col--4 margin-bottom--lg">
                            <div className="card">
                                <div className="card__header">
                                    <div className="text--center">
                                        <span style={{fontSize: "2rem"}}>
                                            {feature.icon}
                                        </span>
                                    </div>
                                    <Heading as="h3" className="text--center">
                                        {feature.title}
                                    </Heading>
                                </div>
                                <div className="card__body">
                                    <p className="text--center">
                                        {feature.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function HomepageCodeExample() {
    const exampleCode = `import { defineConfig, loadEnv, env } from "@axonotes/axogen";
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

    return (
        <section
            className="padding-vert--xl"
            style={{backgroundColor: "var(--ifm-color-emphasis-100)"}}
        >
            <div className="container">
                <div className="row">
                    <div className="col col--12">
                        <Heading
                            as="h2"
                            className="text--center margin-bottom--lg"
                        >
                            Simple, Powerful Configuration
                        </Heading>
                        <p className="text--center margin-bottom--lg">
                            Replace scattered config files with type-safe
                            TypeScript configuration
                        </p>
                    </div>
                </div>
                <div className="row">
                    <div className="col col--8 col--offset-2">
                        <CodeBlock
                            language="typescript"
                            title="axogen.config.ts"
                            showLineNumbers
                        >
                            {exampleCode}
                        </CodeBlock>
                    </div>
                </div>
                <div className="row">
                    <div className="col col--12 text--center margin-top--lg">
                        <Link
                            className="button button--primary button--lg"
                            to="/docs/getting-started"
                        >
                            Try Axogen Now
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default function Home(): ReactNode {
    return (
        <Layout
            title="TypeScript Configuration System | Better than dotenv"
            description="Stop hunting through config files. Axogen is a TypeScript-native configuration system that eliminates config chaos with type-safe environment variables, Zod validation, and automatic generation."
        >
            <Head>
                {/* Enhanced meta tags for homepage */}
                <meta
                    name="keywords"
                    content="typescript configuration, environment variables, config management, dotenv alternative, zod validation, developer tools, typescript config, env files, configuration system, type-safe config, config generation, typescript native, config CLI, developer productivity"
                />
                <meta
                    property="og:title"
                    content="Axogen - TypeScript Configuration System | Better than dotenv"
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
                    content="Axogen - TypeScript Configuration System | Better than dotenv"
                />
                <meta
                    name="twitter:description"
                    content="Stop hunting through config files. Define once in TypeScript, generate everywhere."
                />

                {/* Additional structured data for homepage */}
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
