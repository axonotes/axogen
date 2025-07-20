# With Commands - Stop Writing Package.json Scripts

You know how `package.json` scripts get out of hand real quick? You start with
`"start": "node index.js"` and end up with something like:

```json
{
    "scripts": {
        "start": "NODE_ENV=production node dist/index.js",
        "dev": "NODE_ENV=development nodemon src/index.js",
        "build": "tsc && cp -r public dist/",
        "test": "NODE_ENV=test jest",
        "migrate:up": "NODE_ENV=development node scripts/migrate.js up",
        "migrate:down": "NODE_ENV=development node scripts/migrate.js down",
        "deploy": "npm run build && docker build -t myapp . && docker push myapp",
        "db:reset": "npm run migrate:down && npm run migrate:up && npm run seed"
    }
}
```

And that's just scratching the surface. Now you've got environment variables
hardcoded everywhere, complex multi-step commands, and zero type safety. What
happens when you need to pass arguments? More scripts!

With Axogen, you define commands in your config with full TypeScript power.
Environment variables are typed, arguments are validated, and everything's in
one place.

## The Setup

Let's say you're building a simple Express API with a database. You need
commands for development, building, testing, and database management.

Here's your project structure:

```
my-api/
├── src/
│   ├── index.js
│   └── migrate.js
├── dist/              # build output
├── .env               # your environment values
└── package.json
```

## The Axogen Way

Create your `axogen.config.ts`:

```typescript
import {z, defineConfig, createTypedEnv, defineCommand} from "@axonotes/axogen";

const env = createTypedEnv({
    DATABASE_URL: z.url(),
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    PORT: z.coerce.number().default(3000),
    API_SECRET: z.string().min(32),
});

export default defineConfig({
    targets: {
        app: {
            path: ".env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                NODE_ENV: env.NODE_ENV,
                PORT: env.PORT,
                API_SECRET: env.API_SECRET,
            },
        },
        docker: {
            path: "config.json",
            type: "json",
            variables: {
                database: {url: env.DATABASE_URL},
                server: {port: env.PORT},
                environment: env.NODE_ENV,
            },
        },
    },
    commands: {
        // Simple string commands - just like package.json scripts
        start: "node dist/index.js",
        dev: "nodemon src/index.js",
        build: "tsc && cp -r public dist/",
        test: "jest",
        "test:watch": "jest --watch",

        // Commands that use your typed environment
        serve: `node dist/index.js --port ${env.PORT}`,

        // Complex command with typed options and validation
        migrate: defineCommand({
            help: "Run database migrations",
            options: {
                direction: z.enum(["up", "down"]).default("up"),
                steps: z.coerce.number().default(1),
                force: z.boolean().default(false),
            } as Record<string, z.ZodType>,
            exec: async (ctx) => {
                const {direction, steps, force} = ctx.options;

                if (direction === "down" && steps > 1 && !force) {
                    console.log(
                        "⚠️  Rolling back multiple migrations. Use --force to confirm."
                    );
                    return;
                }

                console.log(`🔄 Running ${steps} migration(s) ${direction}...`);

                // Your migration logic here - access to typed config and environment
                const dbUrl = ctx.config.targets?.app?.variables?.DATABASE_URL;
                console.log(`📊 Using database: ${dbUrl}`);

                // Simulate running migration
                await new Promise((resolve) => setTimeout(resolve, 1000));
                console.log(`✅ Migration ${direction} completed!`);
            },
        }),

        // Multi-step deployment command
        deploy: defineCommand({
            help: "Build and deploy the application",
            options: {
                target: z.enum(["staging", "production"]).default("staging"),
                skip_tests: z.boolean().default(false),
            } as Record<string, z.ZodType>,
            exec: async (ctx) => {
                const {target, skip_tests} = ctx.options;

                console.log(`🚀 Deploying to ${target}...`);

                if (!skip_tests) {
                    console.log("🧪 Running tests...");
                    // Run tests (you'd use the executeCommand helper here)
                }

                console.log("🔨 Building...");
                console.log("📦 Packaging...");
                console.log(`🌍 Deploying to ${target}...`);
                console.log("✅ Deployment complete!");
            },
        }),
    },
});
```

Create your `.env.axogen` file:

```bash
DATABASE_URL=postgresql://localhost:5432/myapi
NODE_ENV=development
PORT=3000
API_SECRET=your-super-secret-key-that-is-definitely-32-chars-long
```

## Generate and Use

Generate your config files:

```bash
axogen generate
```

Now use your commands:

```bash
# Simple commands - just like npm scripts
axogen run dev
axogen run build
axogen run test

# Complex commands with typed options
axogen run migrate --direction up --steps 3
axogen run migrate --direction down --force

# Deployment with options
axogen run deploy --target production
axogen run deploy --target staging --skip_tests
```

## What You Get

**Type Safety**: Your command options are validated. Try
`axogen run migrate --direction sideways` and it'll yell at you.

**Environment Integration**: Commands have access to your typed environment
variables and config.

**Better Error Messages**: Instead of cryptic shell errors, you get helpful
validation messages.

**Self-Documenting**: Run `axogen list` to see all available commands with their
help text.

**No More Script Hell**: No more
`"deploy:staging": "DEPLOY_TARGET=staging npm run deploy"` nonsense.

## Common Variations

**Database Reset Command**:

```typescript
export default defineConfig({
    commands: {
        reset: defineCommand({
            help: "Reset database (migrate down + up + seed)",
            options: {
                confirm: z.boolean().default(false),
            } as Record<string, z.ZodType>,
            exec: async (ctx) => {
                if (!ctx.options.confirm) {
                    console.log(
                        "⚠️  This will destroy all data. Use --confirm to proceed."
                    );
                    return;
                }

                // Run multiple commands in sequence
                console.log("🔄 Resetting database...");
                // Simulate running migrations
                console.log("✅ Database reset complete!");
            },
        }),
    },
});
```

**Environment-Specific Commands**:

```typescript
export default defineConfig({
    commands: {
        // Different behavior based on environment
        start:
            env.NODE_ENV === "production"
                ? "node dist/index.js"
                : "nodemon src/index.js",

        // Conditional commands
        ...(env.NODE_ENV === "development" && {
            "db:gui": "open http://localhost:8080/pgadmin",
            logs: "tail -f logs/development.log",
        }),
    },
});
```

**Complex Build Pipeline**:

```typescript
export default defineConfig({
    commands: {
        build: defineCommand({
            options: {
                env: z
                    .enum(["development", "production"])
                    .default("production"),
                optimize: z.boolean().default(true),
                sourcemap: z.boolean().default(false),
            } as Record<string, z.ZodType>,
            exec: async (ctx) => {
                const {env, optimize, sourcemap} = ctx.options;

                console.log(`🔨 Building for ${env}...`);

                // Your build logic with conditional steps
                if (optimize) console.log("⚡ Optimizing...");
                if (sourcemap) console.log("🗺️  Generating sourcemaps...");

                console.log("✅ Build complete!");
            },
        }),
    },
});
```

## Why This Beats Package.json Scripts

1. **Type Safety**: Command options are validated at runtime
2. **Environment Integration**: Access to your typed config and environment
3. **Better Organization**: Commands and config in one place
4. **Self-Documenting**: Built-in help and command listing
5. **Cross-Platform**: No more shell script compatibility issues
6. **Extensibility**: Full TypeScript power for complex logic

Your `package.json` stays clean with just the basics, and all your real
automation lives in the Axogen config where it belongs.

Try it out - you'll never want to go back to package.json script soup.
