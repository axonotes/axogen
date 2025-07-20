# Getting Started

Let's be honest - most configuration tools make you write a novel before you can
generate a single file. Not here. You can start with just a few lines and grow
from there.

## The Absolute Minimum

Create an `axogen.config.ts` file:

```typescript
import {defineConfig} from "@axonotes/axogen";

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
});
```

Run it:

```bash
axogen generate
```

Boom. You've got an `app/.env` file. Not earth-shattering, but you're up and
running.

## Adding Environment Variables

Of course, hardcoded values aren't very useful. Let's make it read from your
actual environment:

```typescript
import {z, defineConfig, createTypedEnv} from "@axonotes/axogen";

const env = createTypedEnv({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string(),
});

export default defineConfig({
    targets: {
        app: {
            path: "app/.env",
            type: "env",
            variables: {
                PORT: env.PORT,
                DATABASE_URL: env.DATABASE_URL,
            },
        },
    },
});
```

Create a `.env.axogen` file with your values:

```bash
PORT=3000
DATABASE_URL=postgresql://localhost:5432/myapp
```

Now when you run `axogen generate`, it validates your environment variables and
generates the config. If `DATABASE_URL` is missing, it'll yell at you. No more
silent failures.

## Multiple Formats

Here's where it gets interesting. Need the same data in different formats? Easy:

```typescript
import {z, defineConfig, createTypedEnv} from "@axonotes/axogen";

const env = createTypedEnv({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string(),
});

export default defineConfig({
    targets: {
        app: {
            path: "app/.env",
            type: "env",
            variables: {
                PORT: env.PORT,
                DATABASE_URL: env.DATABASE_URL,
            },
        },
        config: {
            path: "config.json",
            type: "json",
            variables: {
                database: {
                    url: env.DATABASE_URL,
                },
                server: {
                    port: env.PORT,
                },
            },
        },
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

## Going Further

Want YAML for Kubernetes? TOML for your Rust service? Templates for complex
scenarios? It's all there:

```typescript
export default defineConfig({
    targets: {
        // Environment file
        app: {
            path: "app/.env",
            type: "env",
            variables: env,
        },

        // Kubernetes config
        k8s: {
            path: "k8s/config.yaml",
            type: "yaml",
            variables: {
                apiVersion: "v1",
                kind: "ConfigMap",
                data: {
                    DATABASE_URL: env.DATABASE_URL,
                    PORT: env.PORT.toString(),
                },
            },
        },

        // Custom template
        nginx: {
            path: "nginx.conf",
            type: "template",
            template: "nginx.conf.njk",
            variables: {
                port: env.PORT,
                upstream: env.DATABASE_URL,
            },
        },
    },
});
```

## Commands with Options

Need more control over your commands? Make them functions:

```typescript
import {defineCommand, z} from "@axonotes/axogen";

export default defineConfig({
    // ... targets
    commands: {
        // Simple string command
        start: "npm start",

        // Command with options
        migrate: defineCommand({
            options: {
                direction: z.enum(["up", "down"]).default("up"),
            } as Record<string, z.ZodType>,
            exec: async (ctx) => {
                console.log(`Running migration ${ctx.options.direction}`);
                // Your migration logic here
            },
        }),
    },
});
```

```bash
axogen run migrate --direction up
```

## CLI Reference

```bash
# Generate all targets
axogen generate

# Generate specific target
axogen generate --target app

# Run commands
axogen run start
axogen run migrate --direction up

# Watch mode (coming soon)
axogen generate --watch
```

## What's Next?

This is still early days (v0.2.0), so expect the API to evolve. But the core
idea is solid: one config, many outputs, fully typed, no surprises.

Start small, grow as needed. That's the way.
