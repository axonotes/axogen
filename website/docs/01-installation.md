---
title: Installation
description: How to install and set up Axogen v0.5.0
keywords:
    [
        install axogen,
        npm install axogen,
        typescript configuration setup,
        node.js configuration tool,
        bun installation,
        axogen setup guide,
    ]
sidebar_position: 1
---

# Installation

Look, installing stuff should be simple. And it is.

## What You Need

- Node.js 18+ or Bun 1.2+ (you probably already have this)
- TypeScript 5+ (not required, but why wouldn't you?)

## Install It

Pick your poison:

```bash npm2yarn
npm install @axonotes/axogen@latest
```

## Make Sure It Worked

Check the version:

```bash
axogen --version
```

If you see `0.5.0` or later, you're golden. Want to test it out real quick?

```bash
# Create a minimal config
echo 'import { defineConfig, env } from "@axonotes/axogen";

export default defineConfig({
    targets: {
        test: env({
            path: "test.env",
            variables: {
                NODE_ENV: "development",
                PORT: 3000,
            },
        }),
    },
});' > axogen.config.ts

# Generate it
axogen generate

# Clean up the mess
rm axogen.config.ts test.env
```

:::success That's it!

Create a proper `axogen.config.ts` file and you're off to the races. Check out
[Getting Started](02-getting-started.md) to see how stupidly simple this really
is.

:::

## Stuck?

- [GitHub repo](https://github.com/axonotes/axogen) has examples
- [Discord server](https://discord.gg/myBMaaDeQu) for when you want to complain
- [GitHub Issues](https://github.com/axonotes/axogen/issues) for actual bugs
