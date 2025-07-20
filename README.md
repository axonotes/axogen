# Axogen

A TypeScript-native configuration system that unifies typed environment
variables, code generation, and task management.

## Background

I built Axogen out of frustration while working on
[AxonotesCore](https://github.com/axonotes/AxonotesCore). Keeping different
configs and environments in sync was a nightmare. What started as an internal
tool to solve this specific problem evolved into something more general.

Honestly, I'm surprised there isn't a simple, easy-to-use tool like this already
out there. If you know of one, please let me know!

**Note:** This is very early development (v0.2.0). The API will likely change as
I work on improving the developer experience to be even simpler while staying
comprehensive.

## The Problem

In monorepos or complex projects, you often end up with:

- `.env` files scattered everywhere
- JSON configs that need the same values
- Docker Compose files with hardcoded values
- Kubernetes manifests with duplicated configuration
- No type safety for environment variables
- Manual syncing between different config formats

Here's a real example from a typical monorepo:

```
project/
├── api/.env                    # DATABASE_URL=postgres://...
├── web/.env.local              # NEXT_PUBLIC_API_URL=http://...
├── docker-compose.yml          # hardcoded ports and URLs
├── k8s/configmap.yaml          # same values again
└── terraform/variables.tf     # and again...
```

Every time you change a database URL or add a service, you're hunting through
multiple files. Miss one? Good luck debugging why staging is broken.

## The Solution

With Axogen, you define everything once:

```typescript
// axogen.config.ts
import {z, defineConfig, createTypedEnv} from "@axonotes/axogen";

const env = createTypedEnv({
    DATABASE_URL: z.string().url(),
    API_PORT: z.coerce.number().default(3001),
    WEB_PORT: z.coerce.number().default(3000),
    NODE_ENV: z
        .enum(["development", "staging", "production"])
        .default("development"),
});

export default defineConfig({
    targets: {
        api: {
            path: "api/.env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                PORT: env.API_PORT,
                NODE_ENV: env.NODE_ENV,
            },
        },
        web: {
            path: "web/.env.local",
            type: "env",
            variables: {
                NEXT_PUBLIC_API_URL: `http://localhost:${env.API_PORT}`,
                NODE_ENV: env.NODE_ENV,
            },
        },
        docker: {
            path: "docker-compose.yml",
            type: "template",
            template: "templates/docker-compose.njk",
            variables: {
                apiPort: env.API_PORT,
                webPort: env.WEB_PORT,
                dbUrl: env.DATABASE_URL,
            },
        },
    },
    commands: {
        dev: "docker-compose up -d",
        build: "docker-compose build",
        deploy: "kubectl apply -f k8s/",
    },
});
```

Create a `.env.axogen` file with your actual values:

```bash
DATABASE_URL=postgresql://localhost:5432/myapp
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

Now one command generates all your configs:

```bash
axogen generate
```

Your API gets its `.env`, your web app gets its `.env.local`, and your Docker
Compose file gets generated from a template - all perfectly in sync.

## Quick Start

```bash
# Install
npm install @axonotes/axogen

# Create minimal config
echo 'import {defineConfig} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        app: {
            path: "app/.env",
            type: "env",
            variables: {
                NODE_ENV: "development",
                PORT: 3000,
            },
        },
    },
});' > axogen.config.ts

# Generate
axogen generate
```

## Features

- **Type-safe environment variables** with Zod validation
- **Multiple output formats** - `.env`, JSON, YAML, TOML, custom templates
- **Template engine support** (Nunjucks, Handlebars, Mustache)
- **Custom commands** for common development tasks
- **Watch mode** for development (coming soon)
- **Zero dependencies** in generated files

## Why Not Just Use...?

- **dotenv**: Only handles `.env` files, no type safety, no generation
- **config**: JavaScript only, no generation, complex setup
- **crossplane**: Great for Kubernetes, overkill for simple projects
- **Pulumi**: Infrastructure focus, not application config

Axogen fills the gap between simple environment management and complex
infrastructure tools.

## Contributing

This is still early development, so things will change. But if you want to help:

1. Try it out and report issues
2. Suggest API improvements
3. Contribute code (see [CONTRIBUTING.md](CONTRIBUTING.md))

## License

MIT

---

Built by [Oliver Seifert](https://github.com/oliverx0) while working on
[AxonotesCore](https://github.com/axonotes/AxonotesCore).
