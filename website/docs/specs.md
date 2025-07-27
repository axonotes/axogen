# Enhanced Axogen Specifications

:::warning Disclaimer

The specifications below are currently in draft form and may not reflect the
final implementation. They are intended to provide a high-level overview of the
Axogen configuration system and its current or future capabilities. The API and
features are subject to change as we continue to develop and refine the system.
Please refer to the source code on GitHub for the most up-to-date information
and examples.

:::

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

## Security and Safety Features

### Automatic Secret Detection and Git Safety

Axogen automatically protects you from accidentally committing secrets to
version control. During generation, Axogen will:

1. **Detect sensitive data** in target variables (environment variables,
   secrets, API keys, tokens, passwords)
2. **Check .gitignore** to ensure files containing sensitive data are properly
   excluded
3. **Error with helpful guidance** if sensitive files aren't in .gitignore
4. **Require explicit acknowledgment** via `unsafe()` wrapper for intentional
   overrides

#### Example: Safe Configuration

```typescript
import {defineConfig, loadSecrets, unsafe} from "@axonotes/axogen";

const secrets = loadSecrets({
    provider: "doppler",
    project: "myapp",
    environment: "production",
});

export default defineConfig({
    targets: {
        // ✅ Safe - .env is in .gitignore
        app: {
            path: ".env", // Must be in .gitignore
            type: "env",
            variables: {
                DATABASE_URL: secrets.DATABASE_URL,
                API_KEY: secrets.API_KEY,
            },
        },

        // ❌ Unsafe - would error without unsafe() wrapper
        config: {
            path: "public/config.json", // Not in .gitignore!
            type: "json",
            variables: {
                PUBLIC_API_URL: "https://api.example.com",
                // This would cause an error:
                // API_SECRET: secrets.API_SECRET,

                // This acknowledges the risk:
                API_SECRET: unsafe(
                    secrets.API_SECRET,
                    "Used in demo - will be replaced"
                ),
            },
        },

        // ✅ Safe - no sensitive data detected
        docker: {
            path: "docker-compose.yml",
            type: "template",
            template: "docker-compose.yml.njk",
            variables: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    },
});
```

#### Error Messages

When Axogen detects unsafe configurations, it provides clear, actionable error
messages:

```bash
❌ Security Error: Sensitive data detected in unprotected file

Target: config (public/config.json)
Issue: File contains sensitive variables but is not in .gitignore

Sensitive variables detected:
  • API_SECRET (secret/credential)
  • DATABASE_URL (connection string with credentials)

Solutions:
1. Add 'public/config.json' to your .gitignore
2. Use unsafe() wrapper to acknowledge the risk:
   API_SECRET: unsafe(secrets.API_SECRET, "reason for override")

Learn more: https://docs.axogen.dev/security
```

#### The unsafe() Wrapper

The `unsafe()` wrapper requires explicit acknowledgment when you intentionally
want to include sensitive data in non-gitignored files:

```typescript
import {unsafe} from "@axonotes/axogen";

// Syntax: unsafe(value, reason)
export default defineConfig({
    targets: {
        demo: {
            path: "demo/config.json", // Not in .gitignore
            type: "json",
            variables: {
                // Must provide a reason for the override
                API_KEY: unsafe(
                    secrets.API_KEY,
                    "Demo environment - uses fake key"
                ),
                DATABASE_URL: unsafe(
                    "postgres://demo:demo@localhost/demo",
                    "Demo database - no real data"
                ),
            },
        },
    },
});
```

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

## Variant 8: Secrets Management Integration

Axogen integrates with leading secrets management platforms for secure
credential handling:

```typescript
import {defineConfig, loadSecrets, loadEnv} from "@axonotes/axogen";

// Phase 1: Essential Secrets Managers
const secrets = loadSecrets({
    // Developer-first platform with excellent DX
    provider: "doppler",
    project: "myapp",
    environment: "production",
});

// Or HashiCorp Vault for self-hosted
const vaultSecrets = loadSecrets({
    provider: "vault",
    url: "https://vault.company.com",
    path: "secret/myapp",
});

// Or AWS Secrets Manager for AWS environments
const awsSecrets = loadSecrets({
    provider: "aws-secrets-manager",
    secretName: "myapp/production",
    region: "us-east-1",
});

// Phase 2: High-Value Additions
const infisicalSecrets = loadSecrets({
    provider: "infisical", // Open-source with great DX
    project: "myapp",
    environment: "prod",
});

const onePasswordSecrets = loadSecrets({
    provider: "1password",
    vault: "Development",
    account: "team.1password.com",
});

export default defineConfig({
    targets: {
        app: {
            path: ".env",
            type: "env",
            variables: {
                // Mix environment variables and secrets
                PORT: loadEnv().PORT,
                DATABASE_URL: secrets.DATABASE_URL,
                API_KEY: secrets.API_KEY,
                JWT_SECRET: vaultSecrets.JWT_SECRET,
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

## Supported File Formats

Based on comprehensive developer usage research, Axogen supports formats in
order of popularity and adoption:

| Format          | Extensions              | Usage Level      | Bidirectional  | Implementation Phase | Notes                                            |
| --------------- | ----------------------- | ---------------- | -------------- | -------------------- | ------------------------------------------------ |
| **Environment** | `.env`                  | **Universal**    | ✅ Full        | Phase 1              | Used in virtually every modern project           |
| **JSON**        | `.json`                 | **Universal**    | ✅ Full        | Phase 1              | Standard data format, package.json, APIs         |
| **YAML**        | `.yaml`, `.yml`         | **Very High**    | ✅ Full        | Phase 1              | Docker Compose, Kubernetes, CI/CD configs        |
| **JavaScript**  | `.js`, `.mjs`           | **Very High**    | ✅ Full        | Phase 2              | Config files, build tools (webpack, vite, etc.)  |
| **TypeScript**  | `.ts`, `.mts`           | **Very High**    | ✅ Full        | Phase 2              | Type-safe config files, modern tooling           |
| **TOML**        | `.toml`                 | **Growing Fast** | ✅ Full        | Phase 2              | Rust ecosystem, Python pyproject.toml            |
| **JSONC**       | `.jsonc`                | **High**         | ✅ Full        | Phase 2              | VS Code settings, tsconfig with comments         |
| **XML**         | `.xml`                  | **Medium**       | ✅ Full        | Phase 3              | Enterprise systems, Java configs                 |
| **INI**         | `.ini`, `.conf`, `.cfg` | **Medium**       | ✅ Full        | Phase 3              | System configs, legacy applications              |
| **Properties**  | `.properties`           | **Medium**       | ✅ Full        | Phase 3              | Java ecosystem, Spring Boot                      |
| **HCL**         | `.hcl`                  | **Niche**        | ✅ Full        | Phase 3              | Terraform, HashiCorp tools only                  |
| **Plist**       | `.plist`                | **Niche**        | ✅ Full        | Phase 4              | Apple/iOS development only                       |
| **Pkl**         | `.pkl`                  | **Experimental** | 📤 Output Only | Phase 4              | Apple's new config language, very early adoption |

**Template Engines (Output Only):**

| Engine         | Priority | Usage                        | Best For                          |
| -------------- | -------- | ---------------------------- | --------------------------------- |
| **Nunjucks**   | 1        | Most flexible, good DX       | Complex templates, logic required |
| **Handlebars** | 2        | Widely known, good ecosystem | Simple logic, team familiarity    |
| **Mustache**   | 3        | Simple, logic-less           | Basic templating, minimal logic   |

## Target Options Reference

**Target types (sorted by implementation priority):**

| Type         | Usage Level   | Phase | Description                                  |
| ------------ | ------------- | ----- | -------------------------------------------- |
| `env`        | **Universal** | 1     | Environment variable files - used everywhere |
| `json`       | **Universal** | 1     | JSON configuration files                     |
| `yaml`       | **Very High** | 1     | YAML configs (Docker, K8s, CI/CD)            |
| `js`         | **Very High** | 2     | JavaScript configuration modules             |
| `ts`         | **Very High** | 2     | TypeScript configuration modules             |
| `toml`       | **Growing**   | 2     | TOML configs (Rust, Python projects)         |
| `jsonc`      | **High**      | 2     | JSON with comments (VS Code, tsconfig)       |
| `template`   | **High**      | 2     | Custom templates for complex configs         |
| `xml`        | **Medium**    | 3     | XML configuration (enterprise/legacy)        |
| `ini`        | **Medium**    | 3     | INI-style configuration files                |
| `properties` | **Medium**    | 3     | Java properties files                        |
| `hcl`        | **Niche**     | 3     | HashiCorp Configuration Language             |
| `plist`      | **Niche**     | 4     | Apple Property List files                    |

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
