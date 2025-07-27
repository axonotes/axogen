# Enhanced Axogen Specifications

Axogen supports a variety of configuration formats to suit different project
needs and developer skill levels. Below are the specifications for each format,
designed with progressive complexity and excellent developer experience.

## Getting Started (Zero to Hero)

### Quick Start - The Magic Way

For developers who just want to get started immediately:

```bash
# One command setup - detects your project and creates a config
npx axogen init

# Or with a preset for common project types
npx axogen init --preset nextjs
npx axogen init --preset fullstack-ts
npx axogen init --preset microservices
```

This automatically:

- Detects your project structure
- Creates a sensible default config
- Sets up common environment variables
- Generates initial `.env.axogen` with placeholders

## Variant 1: Zero Config (Magic Mode)

For absolute beginners - Axogen detects common patterns and "just works":

```typescript
// axogen.config.ts - Generated automatically by `axogen init`
export default {
    // Auto-detected from package.json and project structure
    // Generates .env files for detected services
};
```

Behind the scenes, Axogen:

- Scans `package.json` scripts for port numbers
- Detects framework patterns (Next.js, Vite, etc.)
- Creates sensible defaults for database URLs, API endpoints
- Auto-generates environment variables based on conventions

## Variant 2: Simple Explicit (Learning Mode)

When you're ready to be more explicit but still want simplicity:

```typescript
export default {
    path: "path/to/file.env",
    type: "env",
    variables: {
        VARIABLE_NAME: "value",
        ANOTHER_VARIABLE: "another_value",
    },
};
```

## Variant 3: Multi-Target Basic

```typescript
export default {
    targets: {
        target1: {
            path: "path/to/target1.env",
            type: "env",
            variables: {
                VARIABLE_NAME: "value",
                ANOTHER_VARIABLE: "another_value",
            },
        },
        target2: {
            path: "path/to/target2.json",
            type: "json",
            variables: {
                VARIABLE_NAME: "value",
                ANOTHER_VARIABLE: "another_value",
            },
        },
    },
    commands: {
        start: "node server.js",
        build: "npm run build",
        test: "npm run test",
    },
};
```

## Variant 4: Type-Safe Configuration (Professional Mode)

Using `defineConfig` for type safety and IntelliSense:

```typescript
import {defineConfig, command} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        // Define multiple targets with their own configurations
    },
    commands: {
        // Type-safe command definitions
        start: "node server.js",

        // Rich command with help and validation
        build: command.define({
            help: "Build the application",
            exec: async () => {
                console.log("Building the application...");
                // Your build logic here
            },
        }),
    },
});
```

## Variant 5: Environment Loading and Validation

```typescript
import {defineConfig, loadFile, loadEnv, z} from "@axonotes/axogen";

// loadEnv loads .env.axogen and process.env with schema validation
const env = loadEnv({
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.url(),
    NODE_ENV: z
        .enum(["development", "staging", "production"])
        .default("development"),
});

// Load and validate any config file format
const apiConfig = loadFile("config/api.toml", {
    timeout: z.coerce.number().min(1000),
    retries: z.coerce.number().max(5),
    endpoints: z.array(z.url()),
});

const dbSettings = loadFile("database.yml", {
    host: z.string(),
    port: z.coerce.number().default(5432),
    ssl: z.boolean().default(false),
});

export default defineConfig({
    targets: {
        app: {
            path: ".env",
            type: "env",
            schema: z.object({
                PORT: z.number(),
                DATABASE_URL: z.url(),
                API_TIMEOUT: z.number().min(1000),
                DB_HOST: z.string(),
            }),
            variables: {
                PORT: env.PORT,
                DATABASE_URL: env.DATABASE_URL,
                API_TIMEOUT: apiConfig.timeout,
                DB_HOST: dbSettings.host,
            },
        },
    },
});
```

## Variant 6: Command Helpers and Orchestration

Axogen provides several command helper functions for better ergonomics:

```typescript
import {defineConfig, command, cmd, group} from "@axonotes/axogen";

export default defineConfig({
    commands: {
        // String command - simplest form
        start: "node server.js",

        // String command with help
        build: command.string("npm run build", "Build the application"),

        // Function command - for simple logic
        clean: command.function(async () => {
            console.log("🧹 Cleaning build artifacts...");
            // Your cleanup logic
        }),

        // Rich command with options and arguments
        deploy: command.define({
            help: "Deploy the application",
            options: {
                environment: z
                    .enum(["staging", "production"])
                    .default("staging"),
                skipTests: z.boolean().default(false),
                dryRun: z.boolean().default(false),
            },
            args: {
                version: z.string().optional(),
            },
            exec: async (ctx) => {
                console.log(`🚀 Deploying to ${ctx.options.environment}...`);
                if (ctx.args.version) {
                    console.log(`📦 Version: ${ctx.args.version}`);
                }
                if (ctx.options.dryRun) {
                    console.log("🔍 Dry run mode - no actual deployment");
                    return;
                }
                // Deployment logic here
            },
        }),

        // cmd helper (same as command.define but shorter)
        test: cmd({
            help: "Run tests with coverage",
            options: {
                coverage: z.boolean().default(true),
                watch: z.boolean().default(false),
            },
            exec: async ({options}) => {
                const flags = [
                    options.coverage && "--coverage",
                    options.watch && "--watch",
                ]
                    .filter(Boolean)
                    .join(" ");

                console.log(`🧪 Running tests ${flags}`);
            },
        }),

        // Command groups for organization
        dev: group(
            {
                all: command.parallel([
                    "dev:database",
                    "dev:api",
                    "dev:frontend",
                ]),
                api: "cd api && npm run dev",
                frontend: "cd frontend && npm run dev",
                database: "docker-compose up postgres",
            },
            "Development commands"
        ),

        // Series execution (sequential)
        ci: command.series([
            "lint",
            "test",
            "build",
            "deploy --environment staging",
        ]),

        // Parallel execution
        "dev:all": command.parallel([
            "dev:database",
            "dev:api",
            "dev:frontend",
        ]),
    },
});
```

### Command Context and Global Options

All commands receive a rich context object:

```typescript
// For schema-based commands
const deploy = cmd({
    options: {
        env: z.enum(["dev", "prod"]).default("dev"),
    },
    exec: async (ctx) => {
        // ctx.options - your validated options
        // ctx.args - your validated arguments
        // ctx.global.cwd - current working directory
        // ctx.global.process_env - process environment
        // ctx.global.verbose - verbose mode flag
        // ctx.config - the full axogen config
    },
});

// For simple function commands
const simple = command.function(async (ctx) => {
    // ctx.global - global context
    // ctx.config - the full axogen config
});
```

## Variant 7: Template Generation (Advanced)

For complex configuration files that need more than key-value pairs:

```typescript
import {defineConfig, loadEnv, z} from "@axonotes/axogen";

const env = loadEnv({
    API_PORT: z.coerce.number().default(3000),
    FRONTEND_PORT: z.coerce.number().default(5173),
    NODE_ENV: z
        .enum(["development", "staging", "production"])
        .default("development"),
});

export default defineConfig({
    targets: {
        docker: {
            path: "docker-compose.yml",
            type: "template",
            template: "docker-compose.yml.njk",
            engine: "nunjucks", // "nunjucks" (default), "handlebars", "mustache"
            variables: env,
        },
        k8s: {
            path: "k8s/deployment.yaml",
            type: "template",
            template: "templates/k8s-deployment.hbs",
            engine: "handlebars",
            variables: {
                ...env,
                replicas: env.NODE_ENV === "production" ? 3 : 1,
                image: `myapp:${env.NODE_ENV}`,
            },
        },
    },
});
```

## DX Enhancements and Advanced Features

### 1. Smart Configuration Inheritance

```typescript
// base.config.ts - Shared across team/projects
export const baseConfig = defineConfig({
    env: loadEnv({
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
        LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    }),
    targets: {
        common: {
            path: "shared/.env",
            type: "env",
            variables: {
                NODE_ENV: env.NODE_ENV,
                LOG_LEVEL: env.LOG_LEVEL,
            },
        },
    },
});

// axogen.config.ts - Project-specific
import {extendConfig} from "@axonotes/axogen";
import {baseConfig} from "./base.config";

export default extendConfig(baseConfig, {
    targets: {
        myApp: {
            path: "my-app/.env",
            type: "env",
            variables: {
                API_URL: `http://localhost:${baseConfig.env.API_PORT}`,
            },
        },
    },
});
```

### 2. Live Development Mode

```bash
# Watch mode with live preview
axogen dev

# Shows in terminal:
# 📁 Watching: axogen.config.ts, .env.axogen
# 🔄 Auto-generating on changes
# 📋 Preview mode: http://localhost:3001
```

The preview mode shows:

- Current configuration
- Generated files preview
- Validation status
- Variable dependencies graph

### 4. Secrets Management Integration

```typescript
import {defineConfig, loadSecrets} from "@axonotes/axogen";

// Integrate with secret stores
const secrets = loadSecrets({
    provider: "aws-secrets-manager", // or "vault", "azure-keyvault", "gcp-secret-manager"
    secretName: "myapp/production",
    region: "us-east-1",
});
```

## Supported File Formats

Sorted by popularity and common usage in modern development:

| Format          | Extensions              | Usage            | Notes                                            |
| --------------- | ----------------------- | ---------------- | ------------------------------------------------ |
| **Environment** | `.env`                  | **Universal**    | Used in virtually every modern project           |
| **JSON**        | `.json`                 | **Universal**    | Standard data format, package.json, etc.         |
| **YAML**        | `.yaml`, `.yml`         | **Very High**    | Docker Compose, Kubernetes, CI/CD configs        |
| **JavaScript**  | `.js`                   | **High**         | Config files, build tools (webpack, vite, etc.)  |
| **TypeScript**  | `.ts`                   | **High**         | Type-safe config files, modern tooling           |
| **TOML**        | `.toml`                 | **Growing**      | Rust ecosystem, Python pyproject.toml            |
| **JSONC**       | `.jsonc`                | **Medium**       | VS Code settings, tsconfig with comments         |
| **INI**         | `.ini`, `.conf`, `.cfg` | **Medium**       | System configs, legacy applications              |
| **Properties**  | `.properties`           | **Medium**       | Java ecosystem, Spring Boot                      |
| **XML**         | `.xml`                  | **Medium**       | Enterprise systems, Java configs                 |
| **HCL**         | `.hcl`                  | **Niche**        | Terraform, HashiCorp tools only                  |
| **Plist**       | `.plist`                | **Niche**        | Apple/iOS development only                       |
| **Pkl**         | `.pkl`                  | **Experimental** | Apple's new config language, very early adoption |

## Target Options Reference

**Target types (sorted by common usage):**

| Type         | Usage         | Description                                  |
| ------------ | ------------- | -------------------------------------------- |
| `env`        | **Universal** | Environment variable files - used everywhere |
| `json`       | **Very High** | JSON configuration files                     |
| `yaml`       | **High**      | YAML configs (Docker, K8s, CI/CD)            |
| `template`   | **High**      | Custom templates for complex configs         |
| `js`         | **Medium**    | JavaScript configuration modules             |
| `ts`         | **Medium**    | TypeScript configuration modules             |
| `toml`       | **Growing**   | TOML configs (Rust, Python projects)         |
| `jsonc`      | **Medium**    | JSON with comments (VS Code, tsconfig)       |
| `ini`        | **Medium**    | INI-style configuration files                |
| `properties` | **Medium**    | Java properties files                        |
| `xml`        | **Low**       | XML configuration (enterprise/legacy)        |
| `hcl`        | **Niche**     | HashiCorp Configuration Language             |
| `plist`      | **Niche**     | Apple Property List files                    |

**Target options:**

- `path` (string, **required**) - Output file path
- `type` (string, **required**) - Target format type
- `variables` (object, **required**) - Variables to include in output
- `schema` (Zod schema) - Validate variables before generation (recommended for
  production)
- `condition` (boolean) - Only generate when condition is true
  (environment-specific configs)
- `generate_meta` (boolean, default: false) - Add generator metadata comments
- `engine` (string) - Template engine for template targets ("nunjucks",
  "handlebars", "mustache")
- `template` (string) - Template file path (required for template targets)
- `backup` (boolean, default: false) - Create backup before overwriting existing
  files

This progressive approach allows developers to start simple and grow into more
complex configurations as their needs evolve, while providing powerful features
for advanced users and teams.
