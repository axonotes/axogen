---
title: Getting Started
description: Your first Axogen configuration - no fluff, just results
keywords:
    [
        axogen getting started,
        typescript config tutorial,
        environment variables validation,
        config file generation,
        multiple output formats,
        axogen commands,
        zod schema validation,
    ]
sidebar_position: 2
---

# Getting Started

Let's be honest - most configuration tools make you write a novel before you can
generate a single file. Not here. You can start with just a few lines and grow
from there.

## The Absolute Minimum

Create an `axogen.config.ts` file:

```typescript
import {defineConfig, env} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        app: env({
            path: "app/.env",
            variables: {
                NODE_ENV: "development",
                PORT: 3000,
            },
        }),
    },
});
```

Run it:

```bash
axogen generate
```

Boom. You've got an `app/.env` file. Not earth-shattering, but you're up and
running.

![Axogen Generate Output](/docs/getting-started/axogen_gen.png)

## Adding Environment Variables

Of course, hardcoded values aren't very useful. Let's make it read from your
actual environment:

```typescript
import {defineConfig, env, loadEnv} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        PORT: z.coerce.number().default(3000),
        DATABASE_URL: z.string(),
    })
);

export default defineConfig({
    targets: {
        app: env({
            path: "app/.env",
            variables: {
                PORT: envVars.PORT,
                DATABASE_URL: envVars.DATABASE_URL,
            },
        }),
    },
});
```

Create a `.env.axogen` file with your values:

```bash
PORT=3000
DATABASE_URL=postgresql://localhost:5432/myapp
```

:::warning Don't commit your secrets!

Add `.env.axogen` to your `.gitignore` file! It's just like any other `.env`
file - you don't want to push your secrets to git.

:::

Now when you run `axogen generate`, it validates your environment variables and
generates the config. If `DATABASE_URL` is missing, it'll yell at you. No more
silent failures.

![Validation Error](/docs/getting-started/validation_error.png)

## Multiple Formats

Here's where it gets interesting. Need the same data in different formats? Easy:

```typescript
import {defineConfig, env, json, loadEnv} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        PORT: z.coerce.number().default(3000),
        DATABASE_URL: z.string(),
    })
);

export default defineConfig({
    targets: {
        app: env({
            path: "app/.env",
            variables: {
                PORT: envVars.PORT,
                DATABASE_URL: envVars.DATABASE_URL,
            },
        }),
        config: json({
            path: "config.json",
            variables: {
                database: {
                    url: envVars.DATABASE_URL,
                },
                server: {
                    port: envVars.PORT,
                },
            },
        }),
    },
});
```

One source of truth, multiple outputs. Your backend reads the `.env`, your
frontend build process reads the JSON. They're always in sync.

## Adding Commands

Sometimes you want to run things after generating configs:

```typescript
export default defineConfig({
    targets: {
        // ... your targets
    },
    commands: {
        start: "npm start",
        dev: "npm run dev",
    },
});
```

```bash
axogen run start
```

## CLI Reference

```bash
# Generate all targets
axogen generate

# Generate specific target
axogen generate --target app

# See what would be generated (without writing files)
axogen generate --dry-run

# Run commands
axogen run start

# Get help on any command
axogen run --help
axogen generate --help
```

## What's Next?

This is the foundation. Start small, grow as needed. Check out:

- [Basic Configuration](03-basic-configuration.md) - Core concepts and patterns
- [Target Types](04-target-types.md) - All the file formats you can generate
- [Commands System](05-commands.md) - Task management and automation

Configuration management doesn't have to suck. Your environment variables can
have types. Your scripts can be intelligent. Your deployments can be consistent.

That's the way.
