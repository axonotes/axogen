---
title: Basic Configuration
description: Core concepts and patterns in Axogen
keywords:
    [
        axogen configuration,
        defineConfig function,
        zod type safety,
        environment variable loading,
        conditional config generation,
        axogen backup system,
        typescript config patterns,
    ]
sidebar_position: 3
---

# Basic Configuration

Alright, you've got the basics working. Now let's talk about how this thing
actually works and why you might want to use it over whatever janky setup you
have now.

## The defineConfig Function

Everything starts with `defineConfig`. This is your entry point:

```typescript
import {defineConfig} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        /* your file outputs */
    },
    commands: {
        /* your custom commands */
    },
});
```

That's it. Targets are what files you want to generate. Commands are what
scripts you want to run. Simple.

## Type Safety with Zod

Here's the thing that makes Axogen different: everything is typed and validated.
You're not just hoping your config files are right - you _know_ they are.

```typescript
import {defineConfig, json} from "@axonotes/axogen";
import * as z from "zod";

export default defineConfig({
    targets: {
        config: json({
            path: "output/config.json",
            schema: z.object({
                name: z.string().describe("The service name"),
                version: z.string().describe("The service version"),
                port: z.number().min(1).max(65535).describe("Server port"),
            }),
            variables: {
                name: "MyService",
                version: "1.2.3",
                port: 3000,
            },
        }),
    },
});
```

Try to put a string where a number should go? TypeScript will yell at you. Try
to run it anyway? Zod will catch it at runtime with a helpful error message.

## The New API Style

Since v0.5.0, there are dedicated factory functions for each target type. This
gives you better IntelliSense and catches mistakes early:

```typescript
import {defineConfig, env, json, yaml} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        // New style - recommended
        environment: env({
            path: ".env.prod",
            variables: {
                NODE_ENV: "production",
                PORT: 8080,
            },
        }),

        config: json({
            path: "config.json",
            variables: {
                server: {port: 8080},
            },
        }),

        k8s: yaml({
            path: "deployment.yaml",
            variables: {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {name: "my-app"},
            },
        }),
    },
});
```

You can still use the old `type: "env"` syntax if you want, but why would you?

## Environment Variable Loading

The `loadEnv` function is where the magic happens. It reads your environment
file, validates it, and gives you typed variables:

```typescript
import {defineConfig, env, loadEnv} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        NODE_ENV: z.enum(["development", "production"]).default("development"),
        PORT: z.coerce.number().default(3000),
        DATABASE_URL: z.url(),
        API_KEY: z.string().min(10),
        DEBUG: z.coerce.boolean().default(false),
    })
);

export default defineConfig({
    targets: {
        app: env({
            path: "dist/.env",
            variables: envVars,
        }),
    },
});
```

By default, it looks for `.env.axogen`, but you can customize:

```typescript
const envVars = loadEnv(schema, {
    path: ".env.custom",
    verbose: true,
    override: true,
});
```

## Configuration Extension

Got a base config you want to extend? Easy:

```typescript
import {defineConfig, extendConfig, json} from "@axonotes/axogen";
import baseConfig from "./base.config.ts"; // export const baseConfig = defineConfig({});

export default extendConfig(baseConfig, {
    targets: {
        extra: json({
            path: "extra.json",
            variables: {extra: true},
        }),
    },
});
```

The extension will override the base where there are conflicts. Simple merge
logic.

## Conditional Generation

Sometimes you only want to generate certain configs under certain conditions:

```typescript
export default defineConfig({
    targets: {
        prodSecrets: env({
            path: "secrets/.env.prod",
            variables: {
                REAL_API_KEY: "super-secret-key",
                PROD_DATABASE_URL: "postgres://prod-server/db",
            },
            condition: process.env.NODE_ENV === "production",
        }),

        devConfig: json({
            path: "dev-config.json",
            variables: {debug: true},
            condition: process.env.NODE_ENV !== "production",
        }),
    },
});
```

The `condition` is just a boolean. Use it for whatever logic makes sense.

## Backup System

Worried about overwriting important files? Axogen can backup your targets before
generating:

```typescript
export default defineConfig({
    targets: {
        important: json({
            path: "important-config.json",
            variables: {data: "important stuff"},
            backup: true,
        }),
    },
});
```

Default backup folder is `.axogen/backup/{{path}}`. By default, it does max 5
backups and deletes older ones if this is exceeded.

But of course, you can customize this:

```typescript
export default defineConfig({
    targets: {
        important: json({
            path: "important-config.json",
            variables: {data: "important stuff"},
            backup: {
                enabled: true,
                folder: "my/custom/folder",
                maxBackups: 3,
                onConflict: "increment",
            },
        }),
    },
});
```

## What's Next?

Now you understand the core concepts. Time to dive deeper:

- [Target Types](04-target-types.md) - All the file formats you can generate
- [Commands System](05-commands.md) - Task automation and command management
- [File Loading](06-file-loading.md) - Loading existing configs with validation

The foundation is solid. Build whatever you need on top of it.
