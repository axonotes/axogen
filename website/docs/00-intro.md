---
title: Introduction
description:
    TypeScript-native configuration system for any project, any language
sidebar_position: 0
---

# Introduction

TypeScript-native configuration system for **any project, any language**.

:::warning Not Production Ready

This is an early preview of Axogen. It works, but expect bugs and missing
features. Use it for fun, not for mission-critical systems. Feedback is welcome!

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
import {defineConfig, loadEnv, env, json} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        DATABASE_URL: z.url(),
        PORT: z.coerce.number().default(3000),
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
                database: {url: envVars.DATABASE_URL},
                server: {port: envVars.PORT},
            },
        }),
    },
    commands: {
        start: `npm start --port ${envVars.PORT}`,
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

![Axogen Generate Output](/docs/intro/axogen_gen.png)

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
import {defineConfig, loadEnv, env, cmd} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        DATABASE_URL: z.url("Must be a valid database URL"),
        PORT: z.coerce.number().default(3000),
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
    })
);

export default defineConfig({
    targets: {
        app: env({
            path: ".env",
            variables: {
                DATABASE_URL: envVars.DATABASE_URL,
                PORT: envVars.PORT,
            },
        }),
    },
    commands: {
        dev: cmd({
            help: "Start development server",
            exec: async () => {
                console.log(`🚀 Starting server on port ${envVars.PORT}`);
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

![Axogen Validation Error](/docs/intro/validation_error.png)

## What's Next?

Check out the [Installation](01-installation.md) guide to get started.
