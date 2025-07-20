# Axogen

TypeScript-native configuration system for monorepos and complex projects.

!!! warning "Early Development - v0.2.0"

    This is very early development. The API will change as I work on improving the developer experience. Fair warning!

## What is Axogen?

I built Axogen because I was tired of hunting through a dozen config files every
time I needed to change a database URL. You know the drill - update the `.env`,
then the Docker Compose, then the Kubernetes manifest, then remember that one
JSON file that also needs it. Miss one? Good luck debugging why staging is
broken.

Define your config once in TypeScript, generate multiple formats. That's it.

```typescript
import {z, defineConfig, createTypedEnv} from "@axonotes/axogen";

const env = createTypedEnv({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3000),
});

export default defineConfig({
    targets: {
        app: {
            path: "app/.env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                PORT: env.PORT,
            },
        },
        config: {
            path: "config.json",
            type: "json",
            variables: {
                database: {url: env.DATABASE_URL},
                server: {port: env.PORT},
            },
        },
    },
});
```

Create a `.env.axogen` file with your actual values:

```bash
DATABASE_URL=postgresql://localhost:5432/myapp
PORT=3000
```

Run it:

```bash
axogen generate
```

Your `app/.env` and `config.json` files are generated with validated values.
They're always in sync because there's only one source of truth.

## The Problem

In monorepos, configuration gets scattered everywhere:

```
project/
├── api/.env                    # DATABASE_URL=postgres://...
├── web/.env.local              # API_URL=http://localhost:3001
├── docker-compose.yml          # hardcoded DATABASE_URL again
├── k8s/configmap.yaml          # same DATABASE_URL, different format
└── terraform/main.tf           # DATABASE_URL as a variable
```

Change one value, update 5+ files. This is not only tedious but error-prone. You
end up with inconsistent configurations across your project that can lead to
runtime errors. Axogen solves this by allowing you to define your configuration
in one place using TypeScript, with type-safe environment variables and runtime
validation.

## Features

- **Type-safe environment variables** with runtime validation
- **Multiple output formats** - `.env`, JSON, YAML, TOML, templates
- **Custom commands** for common tasks
- **Template engine support** (Nunjucks, Handlebars, Mustache)
- **Watch mode** for development

## Installation

=== "npm"

    ```bash
    npm install @axonotes/axogen
    ```

=== "yarn"

    ```bash
    yarn add @axonotes/axogen
    ```

=== "pnpm"

    ```bash
    pnpm add @axonotes/axogen
    ```

=== "bun"

    ```bash
    bun add @axonotes/axogen
    ```

## Basic Usage

Create `axogen.config.ts`:

```typescript
import {z, defineConfig, createTypedEnv} from "@axonotes/axogen";

const env = createTypedEnv({
    DATABASE_URL: z.url(),
    PORT: z.coerce.number().default(3000),
});

export default defineConfig({
    targets: {
        app: {
            path: ".env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                PORT: env.PORT,
            },
        },
    },
    commands: {
        start: "npm start",
    },
});
```

Set your environment variables in `.env`:

```bash
DATABASE_URL=postgresql://localhost:5432/myapp
```

Generate configs:

```bash
axogen generate
```

Run commands (defined in `commands`):

```bash
axogen run start
```

## Background

I built this while working on
[AxonotesCore](https://github.com/axonotes/AxonotesCore). Keeping different
configs in sync was driving me crazy, so I made a tool to solve it.

I'm honestly surprised there isn't something like this already. If you know of a
similar tool, let me know!

## Roadmap

What I'm working on next:

1. Better commands syntax and type safety
2. Code quality improvements and tests
3. TypeScript/JavaScript file generation
4. Type exports for other languages (Go, Rust, etc.)
5. More output formats for common project setups

[Get Started →](installation.md)
