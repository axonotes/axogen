---
title: Microservices Architecture
description:
    Why Axogen is essential for managing configuration across multiple services
keywords:
    [
        microservices configuration,
        service mesh config,
        distributed systems,
        configuration drift,
        service discovery,
        environment synchronization,
        microservices deployment,
        axogen microservices,
    ]
sidebar_position: 1
---

# Microservices Architecture

You start with two services, maybe three. "We'll just copy the .env files
around, how hard can it be?"

Six months later you have eight services and you're spending more time hunting
down config bugs than building features. Change a database URL? That's five
files to update. New team member? Good luck explaining which service needs which
environment variables and why half the example files are wrong.

## Is This For You?

You probably need this if:

✅ You have **3+ services** and config changes are becoming painful  
✅ You run **multiple environments** and keeping URLs in sync sucks  
✅ **New developers** take forever to get everything running locally  
✅ You've been bitten by **service URLs pointing to the wrong environment**  
✅ Your **Docker Compose** and actual service configs drift out of sync  
✅ You waste time on **"works on my machine"** config issues

Skip this if:

❌ You have a single service - just use regular `.env` files  
❌ Your config never changes - you don't need this overhead  
❌ You're still prototyping - wait until you have real deployment pain

## The Mess You're Probably Living With

This look familiar?

```
project/
├── auth-service/
│   ├── .env                     # DATABASE_URL=postgres://localhost:5432/auth
│   ├── .env.staging             # DATABASE_URL=postgres://staging-db/auth
│   └── .env.production          # DATABASE_URL=postgres://prod-db/auth
├── order-service/
│   ├── .env                     # DATABASE_URL=postgres://localhost:5432/orders
│   ├── .env.staging             # AUTH_SERVICE_URL=http://auth-staging:3001
│   └── .env.production          # AUTH_SERVICE_URL=https://auth.company.com
├── payment-service/
│   ├── .env                     # ORDER_SERVICE_URL=http://localhost:3002
│   ├── .env.staging             # STRIPE_KEY=sk_test_...
│   └── .env.production          # STRIPE_KEY=sk_live_...
├── notification-service/
│   └── .env                     # REDIS_URL=redis://localhost:6379
└── docker-compose.yml           # Hardcoded ports and service names AGAIN
```

Change the Redis URL? You're editing five files and hoping you didn't miss one.
Deploy to staging? You're manually updating URLs in four different files and
praying staging doesn't break because you typo'd a hostname.

## The Better Way

Instead of scattered config files, you define everything once. Here's what a
real microservices setup looks like:

```typescript
// axogen.config.ts
import {
    defineConfig,
    loadEnv,
    env,
    yaml,
    cmd,
    liveExec,
} from "@axonotes/axogen";
import * as z from "zod";

// Single source of truth for all environment variables
const envVars = loadEnv(
    z.object({
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),

        // Database configuration
        DB_HOST: z.string().default("localhost"),
        DB_PORT: z.coerce.number().default(5432),
        DB_USER: z.string().default("postgres"),
        DB_PASSWORD: z.string(),

        // Service URLs (environment-specific)
        AUTH_SERVICE_URL: z.url(),
        ORDER_SERVICE_URL: z.url(),
        PAYMENT_SERVICE_URL: z.url(),

        // External services
        REDIS_URL: z.url(),
        STRIPE_SECRET_KEY: z.string(),
        JWT_SECRET: z.string().min(32),
    })
);

// Service definitions with their specific needs
const services = [
    {
        name: "auth",
        port: 3001,
        database: "auth_db",
        needs: ["JWT_SECRET", "REDIS_URL"],
    },
    {
        name: "orders",
        port: 3002,
        database: "orders_db",
        needs: ["AUTH_SERVICE_URL", "REDIS_URL"],
    },
    {
        name: "payments",
        port: 3003,
        database: "payments_db",
        needs: ["ORDER_SERVICE_URL", "STRIPE_SECRET_KEY"],
    },
    {
        name: "notifications",
        port: 3004,
        database: "notifications_db",
        needs: ["AUTH_SERVICE_URL", "REDIS_URL"],
    },
];

export default defineConfig({
    targets: {
        // Generate .env file for each service
        ...Object.fromEntries(
            services.map((service) => [
                `${service.name}-env`,
                env({
                    path: `${service.name}-service/.env`,
                    variables: {
                        NODE_ENV: envVars.NODE_ENV,
                        PORT: service.port,
                        DATABASE_URL: `postgres://${envVars.DB_USER}:${envVars.DB_PASSWORD}@${envVars.DB_HOST}:${envVars.DB_PORT}/${service.database}`,

                        // Only include variables this service actually needs
                        ...(service.needs.includes("JWT_SECRET") && {
                            JWT_SECRET: envVars.JWT_SECRET,
                        }),
                        ...(service.needs.includes("REDIS_URL") && {
                            REDIS_URL: envVars.REDIS_URL,
                        }),
                        ...(service.needs.includes("AUTH_SERVICE_URL") && {
                            AUTH_SERVICE_URL: envVars.AUTH_SERVICE_URL,
                        }),
                        ...(service.needs.includes("ORDER_SERVICE_URL") && {
                            ORDER_SERVICE_URL: envVars.ORDER_SERVICE_URL,
                        }),
                        ...(service.needs.includes("STRIPE_SECRET_KEY") && {
                            STRIPE_SECRET_KEY: envVars.STRIPE_SECRET_KEY,
                        }),
                    },
                }),
            ])
        ),

        // Generate coordinated Docker Compose for local development
        dockerCompose: yaml({
            path: "docker-compose.yml",
            variables: {
                version: "3.8",
                services: {
                    // Database services
                    postgres: {
                        image: "postgres:15-alpine",
                        environment: {
                            POSTGRES_USER: envVars.DB_USER,
                            POSTGRES_PASSWORD: envVars.DB_PASSWORD,
                            POSTGRES_MULTIPLE_DATABASES: services
                                .map((s) => s.database)
                                .join(","),
                        },
                        ports: [`${envVars.DB_PORT}:5432`],
                        volumes: ["postgres_data:/var/lib/postgresql/data"],
                    },

                    redis: {
                        image: "redis:7-alpine",
                        ports: ["6379:6379"],
                    },

                    // Application services
                    ...Object.fromEntries(
                        services.map((service) => [
                            service.name,
                            {
                                build: `./${service.name}-service`,
                                ports: [`${service.port}:${service.port}`],
                                depends_on: ["postgres", "redis"],
                                environment: {
                                    NODE_ENV: "development",
                                },
                                env_file: `./${service.name}-service/.env`,
                            },
                        ])
                    ),
                },
                volumes: {
                    postgres_data: {},
                },
            },
        }),

        // Generate example file for new developers
        envExample: env({
            path: ".env.example",
            variables: {
                NODE_ENV: "development",

                // Database
                DB_HOST: "localhost",
                DB_PORT: "5432",
                DB_USER: "postgres",
                DB_PASSWORD: "placeholder-put-your-db-password-here",

                // Development service URLs
                AUTH_SERVICE_URL: "http://localhost:3001",
                ORDER_SERVICE_URL: "http://localhost:3002",
                PAYMENT_SERVICE_URL: "http://localhost:3003",

                // External services
                REDIS_URL: "redis://localhost:6379",
                STRIPE_SECRET_KEY: "sk_test_your_test_key_here",
                JWT_SECRET: "placeholder-put-your-32-character-jwt-secret-here",
            },
        }),

        // Kubernetes manifests for production
        k8sConfigMap: yaml({
            path: "k8s/configmap.yaml",
            variables: {
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: {
                    name: "microservices-config",
                },
                data: {
                    NODE_ENV: envVars.NODE_ENV,
                    REDIS_URL: envVars.REDIS_URL,
                    AUTH_SERVICE_URL: envVars.AUTH_SERVICE_URL,
                    ORDER_SERVICE_URL: envVars.ORDER_SERVICE_URL,
                    PAYMENT_SERVICE_URL: envVars.PAYMENT_SERVICE_URL,
                },
            },
            condition: envVars.NODE_ENV === "production",
        }),
    },

    commands: {
        setup: cmd({
            help: "Set up the entire microservices development environment",
            exec: async () => {
                console.log("🚀 Setting up microservices environment...");

                // Start infrastructure
                await liveExec("docker-compose up -d postgres redis");

                // Wait for database to be ready
                console.log("⏳ Waiting for database to be ready...");
                await liveExec("sleep 5");

                // Create databases for each service
                for (const service of services) {
                    console.log(`📦 Creating database: ${service.database}`);
                    await liveExec(
                        `docker exec postgres createdb -U ${envVars.DB_USER} ${service.database} || true`
                    );
                }

                console.log(
                    "✅ Environment ready! Run 'axogen run dev' to start all services"
                );
            },
        }),

        dev: cmd({
            help: "Start all services in development mode",
            exec: async () => {
                console.log("🚀 Starting all microservices...");
                await liveExec("docker-compose up --build");
            },
        }),

        deploy: cmd({
            help: "Deploy all services to the current environment",
            options: {
                environment: z
                    .enum(["staging", "production"])
                    .describe("Target environment"),
            },
            exec: async (ctx) => {
                const env = ctx.options.environment || envVars.NODE_ENV;
                console.log(`🚀 Deploying to ${env}...`);

                if (env === "production") {
                    await liveExec("kubectl apply -f k8s/");
                } else {
                    console.log("Staging deployment logic here...");
                }
            },
        }),

        logs: cmd({
            help: "View logs from all services",
            args: {
                service: z
                    .string()
                    .optional()
                    .describe("Specific service to view logs for"),
            },
            exec: async (ctx) => {
                if (ctx.args.service) {
                    await liveExec(
                        `docker-compose logs -f ${ctx.args.service}`
                    );
                } else {
                    await liveExec("docker-compose logs -f");
                }
            },
        }),
    },
});
```

Create your `.env.axogen` file with actual values:

```bash
# .env.axogen
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=mypassword123

# Service URLs (environment-aware)
AUTH_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003

# External services
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_abcd1234
JWT_SECRET=my-super-secret-jwt-key-32-chars
```

## What You Actually Get

Run `axogen generate` and you get:

```
project/
├── auth-service/.env          # ✅ Perfectly configured for auth service
├── orders-service/.env        # ✅ Has auth service URL automatically
├── payments-service/.env      # ✅ Has order service URL automatically
├── notifications-service/.env # ✅ Has auth service URL automatically
├── docker-compose.yml         # ✅ All services coordinated
├── k8s/configmap.yaml         # ✅ Production configuration (if NODE_ENV=production)
└── .env.example               # ✅ Perfect onboarding for new developers
```

Every file is in perfect sync. Change the Redis URL once, regenerate, and all
services get the updated URL.

## Real Workflow Examples

### New Team Member Shows Up

**Before:** "Oh hey, so first you need to clone this, then copy these .env
files... actually let me just send you a Slack message with all the URLs you
need to change... no wait, that's outdated, use these ones instead..."

Two hours later they're still asking which database they should use for the
orders service.

**With Axogen:**

```bash
git clone the-project
cp .env.example .env.axogen  # Fill in your actual values
axogen generate              # Generate all service configs
axogen run setup             # Set up databases and infrastructure
axogen run dev               # Start everything
```

### Deploying to Staging

**The old way:**

```bash
# Shit, did I update all the staging URLs?
# *opens 6 different .env files*
# *manually changes localhost to staging-something.com*
# *misses one*
# *staging breaks*
# *spends 30 minutes figuring out which URL is wrong*
```

**The new way:**

```bash
NODE_ENV=staging axogen generate  # All configs updated consistently
axogen run deploy --environment staging
```

## Useful Patterns

### Environment-Aware Service URLs

Don't hardcode "localhost" everywhere:

```typescript
const getServiceUrl = (serviceName: string, port: number) => {
    switch (envVars.NODE_ENV) {
        case "development":
            return `http://localhost:${port}`;
        case "staging":
            return `https://${serviceName}-staging.company.com`;
        case "production":
            return `https://${serviceName}.company.com`;
        default:
            throw new Error(`Unknown environment: ${envVars.NODE_ENV}`);
    }
};

// Use in your service configs
variables: {
    AUTH_SERVICE_URL: getServiceUrl("auth", 3001),
    ORDER_SERVICE_URL: getServiceUrl("orders", 3002),
}
```

### Service Health Checks

```typescript
commands: {
    health: cmd({
        help: "Check health of all services",
        exec: async () => {
            const healthChecks = services.map(async (service) => {
                try {
                    const response = await fetch(
                        `http://localhost:${service.port}/health`
                    );
                    console.log(
                        `✅ ${service.name}: ${response.status === 200 ? "healthy" : "unhealthy"}`
                    );
                } catch (error) {
                    console.log(`❌ ${service.name}: unreachable`);
                }
            });

            await Promise.all(healthChecks);
        },
    }),
}
```

## Security Notes

The secret detection actually helps here. You can't accidentally commit your
prod API keys because Axogen will refuse to generate files with secrets unless
they're gitignored.

Use conditional generation for safe development secrets:

```typescript
variables: {
    JWT_SECRET: envVars.NODE_ENV === "development"
        ? unsafe("dev-jwt-secret-123", "Development JWT secret")
        : envVars.JWT_SECRET,
}
```

## The Bottom Line

Microservices don't have to be a config management nightmare. You can have
predictable, validated configuration that doesn't break when you deploy or when
new people join your team.

That's what good tooling does - it gets out of your way so you can build
features instead of debugging why the staging environment is pointing to
localhost.
