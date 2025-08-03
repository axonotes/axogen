---
title: Next.js/React Team Development
description: Environment validation and team coordination for Next.js projects
keywords:
    [
        nextjs team development,
        environment variables validation,
        nextjs team onboarding,
        nextauth configuration,
        nextjs environment setup,
        team coordination nextjs,
        axogen nextjs,
    ]
sidebar_position: 2
---

# Next.js/React Team Development

Let's be honest: if you're building a Next.js app by yourself, you probably
don't need this. Environment variables in Next.js work fine out of the box, and
you can manage your `.env.local` file just fine.

But if you're working with a team, you've probably hit these problems:

Someone deploys to production with `NEXTAUTH_URL=http://localhost:3000` and
authentication breaks. A new developer joins and spends half a day figuring out
why OAuth isn't working (spoiler: they're missing environment variables that
aren't in the example file). Your staging environment is using test Stripe keys
when it should be using staging keys.

These aren't Next.js problems. They're team coordination problems.

## When This Actually Helps

You probably need this if:

✅ **You have a team** - Solo developers can manage `.env` files just fine  
✅ **Multiple environments** - dev/staging/production with different URLs and
keys  
✅ **New team members** regularly join and need to get up and running  
✅ **You've been bitten by deployment config errors** - wrong URLs, test keys in
production  
✅ **Your `.env.example` file is always out of date** - because someone forgot
to update it

Skip this if:

❌ You're working alone - just use regular `.env.local` files  
❌ You only have one environment that never changes  
❌ Your team is stable and everyone knows the setup by heart

## What Actually Goes Wrong

The classic Next.js team development problems:

**The OAuth Mystery:** New developer joins, copies `.env.example` to
`.env.local`, but OAuth doesn't work. Turns out the example file is missing
three environment variables that got added last month. No one remembers to
update example files.

**The Deployment Surprise:** Everything works locally, deploy to staging, and
authentication breaks. `NEXTAUTH_URL` is still pointing to `localhost:3000`.
This happens more often than you'd think.

**The Stripe Incident:** Production is accidentally using test API keys, or
worse, staging is using live keys and charging real customers for test orders.

**The Onboarding Crawl:** New team member spends their first day setting up the
development environment. Half the instructions are outdated, they're missing
database credentials, and they don't know which OAuth apps to create.

## How Axogen Helps

Axogen doesn't solve Next.js complexity—it solves team coordination complexity:

**Environment validation:** Catch wrong URLs and invalid API keys before
deployment, not after.

**Always-accurate example files:** Your `.env.example` is generated from the
same source as your real config. It can't be wrong.

**Team onboarding automation:** New developers run one command and get
step-by-step setup with validation.

**Multi-environment coordination:** Automatically adjust URLs and API endpoints
based on where you're deploying.

## A Real Example

Here's what a practical Next.js team configuration looks like:

```typescript
// axogen.config.ts
import {defineConfig, loadEnv, env, cmd, liveExec} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),

        // Database
        DATABASE_URL: z.url("Database URL must be valid"),

        // NextAuth - the most common deployment failure
        NEXTAUTH_SECRET: z
            .string()
            .min(32, "NextAuth secret must be at least 32 characters"),

        // OAuth
        GOOGLE_CLIENT_ID: z.string().min(1, "Google Client ID is required"),
        GOOGLE_CLIENT_SECRET: z
            .string()
            .min(1, "Google Client Secret is required"),

        // API keys with validation
        STRIPE_PUBLISHABLE_KEY: z
            .string()
            .startsWith("pk_", "Stripe publishable key must start with pk_"),
        STRIPE_SECRET_KEY: z
            .string()
            .startsWith("sk_", "Stripe secret key must start with sk_"),
    })
);

// Environment-aware URL generation
const getNextAuthUrl = () => {
    switch (envVars.NODE_ENV) {
        case "development":
            return "http://localhost:3000";
        case "staging":
            return "https://staging.myapp.com";
        case "production":
            return "https://myapp.com";
    }
};

export default defineConfig({
    targets: {
        app: env({
            path: ".env.local",
            variables: {
                DATABASE_URL: envVars.DATABASE_URL,
                NEXTAUTH_URL: getNextAuthUrl(),
                NEXTAUTH_SECRET: envVars.NEXTAUTH_SECRET,

                GOOGLE_CLIENT_ID: envVars.GOOGLE_CLIENT_ID,
                GOOGLE_CLIENT_SECRET: envVars.GOOGLE_CLIENT_SECRET,

                // Public variables (NEXT_PUBLIC_ prefix)
                NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
                    envVars.STRIPE_PUBLISHABLE_KEY,

                // Server-only variables
                STRIPE_SECRET_KEY: envVars.STRIPE_SECRET_KEY,
            },
        }),

        // Perfect example file - always accurate
        example: env({
            path: ".env.example",
            variables: {
                DATABASE_URL: "postgresql://user:password@localhost:5432/myapp",
                NEXTAUTH_SECRET: "your-32-character-secret-goes-here",
                GOOGLE_CLIENT_ID: "your-google-client-id",
                GOOGLE_CLIENT_SECRET: "your-google-client-secret",
                STRIPE_PUBLISHABLE_KEY: "pk_test_your_publishable_key",
                STRIPE_SECRET_KEY: "sk_test_your_secret_key",
            },
        }),
    },

    commands: {
        "team-setup": cmd({
            help: "Get new team members up and running",
            exec: async () => {
                console.log("🚀 Setting up development environment...");

                await liveExec("npm install");

                try {
                    await liveExec("npx prisma generate");
                    await liveExec("npx prisma db push");
                    console.log("✅ Database ready");
                } catch (error) {
                    console.log(
                        "⚠️  Database setup failed - check your DATABASE_URL"
                    );
                }

                console.log("\n✅ Setup complete!");
                console.log(
                    "Next: Copy .env.example to .env.local and update values"
                );
            },
        }),

        "pre-deploy": cmd({
            help: "Validate environment before deployment",
            exec: async () => {
                console.log("🔍 Validating deployment environment...");

                if (envVars.NODE_ENV === "production") {
                    if (getNextAuthUrl().includes("localhost")) {
                        throw new Error(
                            "❌ NEXTAUTH_URL still points to localhost in production!"
                        );
                    }

                    if (envVars.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
                        throw new Error(
                            "❌ Using test Stripe keys in production!"
                        );
                    }
                }

                console.log("✅ Environment validation passed");
            },
        }),
    },
});
```

Your `.env.axogen` file (keep this secret):

```bash
NODE_ENV=development

DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/myapp_dev
NEXTAUTH_SECRET=my-super-secret-32-character-key-here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_PUBLISHABLE_KEY=pk_test_abcd1234
STRIPE_SECRET_KEY=sk_test_abcd1234
```

## What Changes

**New team member onboarding:**

```bash
git clone your-app
cd your-app
axogen run team-setup     # Automated setup with validation
# Copy .env.example to .env.local and fill in values
npm run dev               # Everything works
```

**Deployment validation:**

```bash
NODE_ENV=production axogen run pre-deploy  # Catches config errors before deploy
```

**Always-accurate documentation:** Your `.env.example` file is generated from
the same schema as your real config. When you add a new environment variable,
both files update together.

**Environment-specific URLs:** Your `NEXTAUTH_URL` automatically adjusts based
on where you're deploying. No more manual URL updates.

## The Bottom Line

This isn't about Next.js being hard to configure—it's about teams staying
coordinated. Environment variables have types, deployments have validation, and
your team moves faster.

The magic isn't generating files. It's never having to think about environment
variable management again.
