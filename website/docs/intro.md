---
title: Introduction
description:
    TypeScript-native configuration system for any project, any language
sidebar_position: 1
---

# Introduction

TypeScript-native configuration system for **any project, any language**.

:::warning Early Development - v0.3.x

This is early development. The API may change as we work on improving the
developer experience.

:::

:::warning Documentation Status

The docs are currently not up to date as I'm focused on stabilizing core
features. For the most current information, you might need to check the source
code on GitHub or the examples in this blog post. Proper documentation will come
once the API is more stable!

:::

## What is Axogen?

I built Axogen because I was tired of hunting through a dozen config files every
time I needed to change a database URL. You know the drill - update the `.env`,
then the Docker Compose, then the Kubernetes manifest, then remember that one
JSON file that also needs it. Miss one? Good luck debugging why staging is
broken.

Define your config once in TypeScript, generate multiple formats. That's it.

**Works with any language:** Python APIs, Go microservices, Rust backends, Java
apps, PHP websites - doesn't matter. If your project uses config files, Axogen
can help.

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
    commands: {
        start: `npm start --port ${env.PORT}`,
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

In any non-trivial project, configuration gets scattered everywhere:

```
project/
├── api/.env                    # DATABASE_URL=postgres://...
├── web/.env.local              # API_URL=http://localhost:3001
├── docker-compose.yml          # hardcoded DATABASE_URL again
├── k8s/configmap.yaml          # same DATABASE_URL, different format
├── nginx.conf                  # port numbers hardcoded
└── app.json                    # API URLs again
```

This happens in **every language and framework**. Change one value, update 5+
files. This is not only tedious but error-prone.

Axogen solves this by allowing you to define your configuration in one place
using TypeScript, with type-safe environment variables and runtime validation.

## Key Features

- **Type-safe environment variables** with runtime validation using Zod
- **Multiple output formats** - `.env`, JSON, YAML, TOML, templates
- **Intelligent command system** with help, validation, and custom logic
- **Console themes** for beautiful terminal output
- **Template engine support** (Nunjucks, Handlebars, Mustache)
- **Language-agnostic** - Works with Python, Go, Rust, Java, PHP, etc.
- **Blazing fast** - 10,000 config files in 2.2 seconds (I know that no one has
  that many, but still)

## Installation

```bash npm2yarn
npm install @axonotes/axogen
```

## Quick Example

```typescript
// axogen.config.ts
import {z, defineConfig, createTypedEnv, command} from "@axonotes/axogen";

const env = createTypedEnv({
    DATABASE_URL: z.url("Must be a valid database URL"),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
        .enum(["development", "staging", "production"])
        .default("development"),
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
        dev: command.define({
            help: "Start development server",
            exec: async () => {
                console.log(`🚀 Starting server on port ${env.PORT}`);
                // Your custom logic here
            },
        }),
    },
});
```

```bash
# .env.axogen
DATABASE_URL=postgresql://localhost:5432/myapp
PORT=3000
```

```bash
axogen generate    # Generate all config files
axogen run dev     # Run commands with validation
```

When validation fails, you get clear error messages:

```
❌ Environment variable validation failed

  Validation Errors:
    • DATABASE_URL: Must be a valid database URL
    • PORT: Expected number, received string

ℹ️  Check your .env.axogen file and ensure all required variables are set.
```

## What's Next?

Check out the [Installation](./installation) guide to get started.
