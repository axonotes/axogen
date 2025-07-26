---
title: Installation
description: How to install and set up Axogen for your project
sidebar_position: 3
---

# Installation

Look, installing stuff should be simple. And it is.

:::warning Documentation Status

The docs are currently not up to date as I'm focused on stabilizing core
features. For the most current information, you might need to check the source
code on GitHub or the examples in this blog post. Proper documentation will come
once the API is more stable!

:::

## What You Need

- Node.js 16+ (you probably already have this)
- TypeScript (not required, but why wouldn't you?)

## Install It

Pick your poison:

```bash npm2yarn
npm install @axonotes/axogen
```

## Make Sure It Worked

Check the version:

```bash
axogen --version
```

If you see a version number, you're golden. Want to test it out real quick?

```bash
# Create a minimal config using echo
echo 'import {defineConfig, createTypedEnv, z} from "@axonotes/axogen";
const env = createTypedEnv({
    NODE_ENV: z.string().default("development"),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
});
export default defineConfig({
    targets: {
        app: {
            path: "generated.env",
            type: "env",
            variables: {
                NODE_ENV: env.NODE_ENV,
                PORT: env.PORT,
                DATABASE_URL: env.DATABASE_URL,
            },
        },
    },
});' > axogen.config.ts

# Create a matching .env.axogen file using echo
echo 'NODE_ENV=development
PORT=3000
DATABASE_URL=https://your.database.url' > .env.axogen

# Generate your config with validation
axogen generate

# Clean up
rm axogen.config.ts .env.axogen generated.env
```

:::success That's it!

    Create a proper `axogen.config.ts` file and you're off to the races.
    Check out the [Getting Started](getting-started.md) guide to see how simple it really is.

:::
