---
title: Advanced Features
description: Real-world patterns and practical use cases
keywords:
    [
        advanced axogen,
        complex configuration,
        custom integrations,
        performance optimization,
        advanced typescript config,
        sophisticated patterns,
    ]
sidebar_position: 8
---

# Advanced Features

You've learned the basics. Now let's see how to handle a real scenario: a
Next.js app with multiple environments, Docker, and Kubernetes. This is what
most teams actually build.

## The Problem

You have a Next.js app with Prisma. You need:

- Different database URLs for dev/staging/prod
- Docker setup for local development
- Kubernetes manifests for production
- Environment variables that stay in sync
- No secrets accidentally committed

Right now you probably have environment files scattered everywhere, Docker
configs that don't match your app, and K8s manifests you copy-paste and forget
to update.

## The Better Way

Let's build this step by step. First, read your existing project info:

```typescript
// axogen.config.ts
import {defineConfig, loadFile, loadEnv} from "@axonotes/axogen";
import * as z from "zod";

// Read your existing package.json
const packageInfo = loadFile(
    "package.json",
    "json",
    z.object({
        name: z.string(),
        version: z.string(),
    })
);

// Load environment variables with validation
const envVars = loadEnv(
    z.object({
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
        PORT: z.coerce.number().default(3000),
        DATABASE_URL: z.string(),
        NEXTAUTH_SECRET: z.string(),
    })
);
```

:::info

Dont forget to create your `.env.axogen` file with your secrets:

```dotenv
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/mydatabase
NEXTAUTH_SECRET=your_secret_key
```

:::

Now define your base configuration:

```typescript
const baseVariables = {
    APP_NAME: packageInfo.name,
    APP_VERSION: packageInfo.version,
    PORT: envVars.PORT,
    NODE_ENV: envVars.NODE_ENV,
};
```

Create environment-specific configs:

```typescript
import {env, yaml, json} from "@axonotes/axogen";

const devConfig = defineConfig({
    targets: {
        // Local development environment
        localEnv: env({
            path: ".env.local",
            variables: {
                ...baseVariables,
                DATABASE_URL:
                    "postgres://postgres:password@localhost:5432/myapp_dev",
                NEXTAUTH_URL: "http://localhost:3000",
                NEXTAUTH_SECRET: "dev-secret-not-for-production",
                REDIS_URL: "redis://localhost:6379",
            },
        }),

        // Docker Compose for local services
        dockerCompose: yaml({
            path: "docker-compose.yml",
            variables: {
                version: "3.8",
                services: {
                    postgres: {
                        image: "postgres:15-alpine",
                        environment: {
                            POSTGRES_DB: `${packageInfo.name}_dev`,
                            POSTGRES_USER: "postgres",
                            POSTGRES_PASSWORD: "placeholder-password",
                        },
                        ports: ["5432:5432"],
                        volumes: ["postgres_data:/var/lib/postgresql/data"],
                    },
                    redis: {
                        image: "redis:7-alpine",
                        ports: ["6379:6379"],
                    },
                },
                volumes: {
                    postgres_data: {},
                },
            },
        }),
    },
});
```

Production is different - it uses real secrets and Kubernetes:

```typescript
const prodConfig = defineConfig({
    targets: {
        // Production environment file (should be gitignored)
        prodEnv: env({
            path: ".env.production",
            variables: {
                ...baseVariables,
                DATABASE_URL: envVars.DATABASE_URL, // Real production database
                NEXTAUTH_URL: "https://myapp.com",
                NEXTAUTH_SECRET: envVars.NEXTAUTH_SECRET, // Real secret
            },
            backup: true, // Backup before overwriting
        }),

        // Kubernetes deployment
        k8sDeployment: yaml({
            path: "k8s/deployment.yaml",
            variables: {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: packageInfo.name,
                    labels: {
                        app: packageInfo.name,
                        version: packageInfo.version,
                    },
                },
                spec: {
                    replicas: 3,
                    selector: {
                        matchLabels: {
                            app: packageInfo.name,
                        },
                    },
                    template: {
                        metadata: {
                            labels: {
                                app: packageInfo.name,
                                version: packageInfo.version,
                            },
                        },
                        spec: {
                            containers: [
                                {
                                    name: packageInfo.name,
                                    image: `${packageInfo.name}:${packageInfo.version}`,
                                    ports: [{containerPort: envVars.PORT}],
                                    env: [
                                        {name: "NODE_ENV", value: "production"},
                                        {
                                            name: "PORT",
                                            value: envVars.PORT.toString(),
                                        },
                                        {
                                            name: "DATABASE_URL",
                                            valueFrom: {
                                                secretKeyRef: {
                                                    name: `${packageInfo.name}-secrets`,
                                                    key: "database-url",
                                                },
                                            },
                                        },
                                        {
                                            name: "NEXTAUTH_SECRET",
                                            valueFrom: {
                                                secretKeyRef: {
                                                    name: `${packageInfo.name}-secrets`,
                                                    key: "nextauth-secret",
                                                },
                                            },
                                        },
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
        }),
    },
});
```

Add some useful commands:

```typescript
import {cmd, liveExec} from "@axonotes/axogen";

// Add to both configs
const commands = {
    setup: cmd({
        help: "Set up the development environment",
        exec: async (ctx) => {
            console.log("Setting up development environment...");
            await liveExec("docker-compose up -d");
            await liveExec("npx prisma db push");
            await liveExec("npx prisma db seed");
            console.log("Development environment ready!");
        },
    }),

    deploy: cmd({
        help: "Deploy to the current environment",
        options: {
            build: z.boolean().default(true).describe("Build before deploying"),
        },
        exec: async (ctx) => {
            console.log(
                `Deploying ${packageInfo.name} v${packageInfo.version}...`
            );

            if (ctx.options.build) {
                await liveExec("npm run build");
            }

            if (envVars.NODE_ENV === "production") {
                await liveExec("kubectl apply -f k8s/");
            } else {
                await liveExec("docker-compose up -d");
            }
        },
    }),
};
```

Finally, choose the right config:

```typescript
import {extendConfig} from "@axonotes/axogen";

const isProd = envVars.NODE_ENV === "production";

const finalConfig = isProd ? prodConfig : devConfig;

// Add commands to the final config
export default extendConfig(finalConfig, {
    commands,
});
```

:::info .gitignore

Make sure to add `.env.production` and `k8s/deployment.yaml` to your
`.gitignore` file to avoid errors. Or see if axogen notices it for you.

:::

## What You Get

Run `axogen generate` or `NODE_ENV=production axogen generate` and you get:

**In development:**

- `.env.local` with local database URLs
- `docker-compose.yml` with PostgreSQL and Redis
- Commands to set up everything

**In production:**

- `.env.production` with real secrets (safely backed up)
- `k8s/deployment.yaml` with proper resource names and secrets
- Same commands, different behavior

## The Real Benefits

**Before Axogen:**

```bash
# You had files like this scattered around:
.env.local                    # Hardcoded localhost URLs
.env.staging                  # Copy-paste with different URLs
.env.production              # Hopefully not in git...
docker-compose.yml           # Postgres password: "password"
k8s/deployment.yaml          # Hardcoded app name and version
k8s/staging-deployment.yaml  # 90% the same as prod
```

**With Axogen:**

```bash
# One source of truth:
axogen.config.ts      # All environments defined
.env.axogen          # Your actual secrets
package.json         # Already has name and version
```

**Environment changes:**

```bash
# Before: Edit 3-5 files manually
# After: Change one variable, regenerate
NODE_ENV=staging axogen generate
```

**New team member:**

```bash
# Before: "Check the wiki for setup instructions"
# After:
axogen generate
axogen run setup
```

**Production deployment:**

```bash
# Before: Hope you remembered to update the K8s manifests
# After: Everything stays in sync automatically
NODE_ENV=production axogen generate
axogen run deploy
```

## Why This Works

1. **Single source of truth** - Your package.json already has the app name and
   version
2. **Environment-aware** - Same config, different outputs based on NODE_ENV
3. **Type-safe** - Zod validates your environment variables
4. **Git-safe** - Secrets stay in `.env.axogen` (gitignored)
5. **Team-friendly** - New developers run two commands and they're ready

You didn't throw away your existing setup. You just made it smarter.

**That's the difference between tools and solutions.**
