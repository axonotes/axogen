---
title: Secret Detection
description: Keeping your secrets safe with Axogen's built-in security
sidebar_position: 7
---

# Secret Detection

Here's something that kept me up at night: what if someone accidentally pushes
their production API keys because Axogen generated them into a non-gitignored
file? So I built secret detection. Before generation of each target, all
variables are scanned. If they look like secrets and the target file is NOT
gitignored, Axogen refuses to generate.

## How It Works

Axogen's secret detection uses multiple approaches to catch secrets:

- **Known patterns** - AWS keys, GitHub tokens, Stripe keys, JWTs, etc.
- **Entropy analysis** - High randomness indicating machine-generated secrets
- **Keyword context** - Variables named "password", "api_key", "secret", etc.
- **Connection strings** - Database URLs with embedded credentials
- **Certificates** - Private keys and certificates
- **URL parameters** - Secrets in query strings

## Basic Usage

Secret detection runs automatically. If secrets are detected in non-gitignored
files, generation fails:

```typescript
import {defineConfig, env} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        // This will fail if "secrets.env" is not gitignored
        secrets: env({
            path: "secrets.env", // ❌ Not in .gitignore
            variables: {
                API_KEY: "sk_live_abcd1234567890", // ❌ Looks like a secret
                DATABASE_URL: "postgres://user:supersecret@db.com/mydb", // ❌ Connection string with password
            },
        }),
    },
});
```

When you run `axogen generate`, you'll get an error showing which secrets were
detected and why.

## The unsafe() Function

Sometimes you actually want to generate "secrets" - like development database
URLs or test API keys. Use `unsafe()` to bypass detection:

```typescript
import {defineConfig, env, unsafe} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        devConfig: env({
            path: "config/.env.development",
            variables: {
                NODE_ENV: "development",
                API_KEY: unsafe(
                    "your-dev-api-key-here",
                    "Development mode - safe to commit"
                ),
                DATABASE_URL: unsafe(
                    "postgres://localhost:5432/myapp_dev",
                    "Local development database"
                ),
            },
        }),
    },
});
```

The second parameter is required - you have to explicitly say WHY this is safe.
No more "oops, I pushed the prod keys" moments.

## What Gets Detected

### High-Confidence Patterns

These will always be flagged as secrets:

```typescript
// AWS Keys
"AKIAIOSFODNN7EXAMPLE"; // AWS Access Key ID
"wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"; // AWS Secret Key

// GitHub Tokens
"ghp_1234567890abcdef1234567890abcdef12"; // Personal Access Token
"github_pat_11ABCDEFG_1234567890abcdef..."; // Fine-grained PAT

// Stripe Keys
"sk_live_1234567890abcdef1234567890"; // Live Secret Key
"pk_test_1234567890abcdef1234567890"; // Test Publishable Key

// Slack Tokens
"xoxb-1234567890-1234567890-abcdef123456"; // Bot Token

// Private Keys & Certificates
"-----BEGIN PRIVATE KEY-----\n..."; // Any private key
"-----BEGIN CERTIFICATE-----\n..."; // X.509 certificate

// Connection Strings
"postgres://user:password@host:5432/db"; // Database with credentials
"mysql://admin:secret123@localhost/mydb"; // MySQL with password
```

### Medium-Confidence Patterns

These are likely secrets but could be false positives:

```typescript
// Long hexadecimal strings
"a1b2c3d4e5f6789012345678901234567890abcdef"  // 40-char hex (like SHA-1)

// High-entropy base64
"dGhpcyBpcyBhIHNlY3JldCB0b2tlbiB3aXRoIGhpZ2ggZW50cm9weQ=="

// JWT tokens
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJ..."

// Variables with secret keywords
{
    password: "my-complex-password-123",    // Keyword + complex value
    api_secret: "abc123def456ghi789",       // Secret keyword
    private_key: "some-long-value-here",    // Private key keyword
}
```

### Low-Confidence Patterns

These might be secrets but are often false positives:

```typescript
// Long alphanumeric strings
"abc123def456ghi789jkl012mno345pqr678"; // 32+ chars, mixed case/numbers

// UUIDs with extra characters
"123e4567-e89b-12d3-a456-426614174000-extra-secret-part";
```

## What Doesn't Get Detected

Axogen is smart about avoiding false positives:

```typescript
// These are safe and won't be flagged:
{
    NODE_ENV: "production",             // Common environment values
    PORT: 3000,                         // Numbers
    DEBUG: true,                        // Booleans
    HOST: "localhost",                  // Common hostnames
    URL: "https://example.com",         // URLs without credentials
    EMAIL: "user@example.com",          // Email addresses
    DATE: "2023-12-01",                 // Dates
    VERSION: "1.2.3",                   // Version numbers
    COLOR: "#ff0000",                   // Hex colors

    // Test/example values
    password: "test123",                // Contains "test"
    api_key: "example-key",             // Contains "example"
    secret: "demo-secret",              // Contains "demo"
    token: "placeholder-token",         // Contains "placeholder"
}
```

## Git Integration

Secret detection only triggers for files that are NOT in your `.gitignore`. If
your target path is gitignored, secrets are allowed:

```typescript
export default defineConfig({
    targets: {
        // This is fine - .env.local is typically gitignored
        secrets: env({
            path: ".env.local",
            variables: {
                API_KEY: "sk_live_real_secret_key", // ✅ OK because file is gitignored
            },
        }),

        // This will fail - config.json is not typically gitignored
        config: json({
            path: "config.json",
            variables: {
                apiKey: "sk_live_real_secret_key", // ❌ Will be blocked
            },
        }),
    },
});
```

Make sure to add sensitive files to your `.gitignore`:

```gitignore
# Environment files
.env.local
.env.production
secrets/

# Generated configs with secrets
config/production.json
k8s/secrets.yaml
```

## Examples

### Development vs Production

```typescript
import {defineConfig, env, unsafe, loadEnv} from "@axonotes/axogen";
import * as z from "zod";

const envVars = loadEnv(
    z.object({
        NODE_ENV: z.enum(["development", "production"]),
        API_KEY: z.string(),
    })
);

export default defineConfig({
    targets: {
        app: env({
            path:
                envVars.NODE_ENV === "development"
                    ? ".env.local"
                    : ".env.production",
            variables: {
                NODE_ENV: envVars.NODE_ENV,
                API_KEY:
                    envVars.NODE_ENV === "development"
                        ? unsafe(envVars.API_KEY, "Development API key")
                        : envVars.API_KEY, // Production - file should be gitignored
            },
        }),
    },
});
```

### Docker Secrets

```typescript
import {defineConfig, env, unsafe} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        // Docker Compose with development credentials
        dockerEnv: env({
            path: "docker/.env", // Make sure this is gitignored!
            variables: {
                POSTGRES_PASSWORD: unsafe(
                    "dev-password-123",
                    "Docker development database password"
                ),
                REDIS_PASSWORD: unsafe(
                    "redis-dev-pass",
                    "Docker development Redis password"
                ),
            },
        }),
    },
});
```

### Kubernetes Configs

```typescript
import {defineConfig, yaml, unsafe} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        // Development namespace - safe to have test secrets
        devSecrets: yaml({
            path: "k8s/dev-secrets.yaml",
            variables: {
                apiVersion: "v1",
                kind: "Secret",
                metadata: {
                    name: "app-secrets",
                    namespace: "development",
                },
                data: {
                    "api-key": unsafe(
                        "dGVzdC1hcGkta2V5LWZvci1kZXYtZW52aXJvbm1lbnQ=",
                        "Base64 encoded test API key for development"
                    ),
                },
            },
        }),
    },
});
```

## Best Practices

### 1. Use Environment-Specific Configs

```typescript
const isProd = process.env.NODE_ENV === "production";

export default defineConfig({
    targets: {
        secrets: env({
            // Production files should be gitignored
            path: isProd ? ".env.production" : ".env.development",
            variables: {
                API_KEY: isProd
                    ? process.env.PRODUCTION_API_KEY // Real secret
                    : unsafe("dev-api-key", "Development only"),
            },
        }),
    },
});
```

### 2. Separate Public and Private Configs

```typescript
export default defineConfig({
    targets: {
        // Public config - no secrets, can be committed
        publicConfig: json({
            path: "public/config.json",
            variables: {
                apiUrl: "https://api.example.com",
                version: "1.0.0",
                features: ["auth", "logging"],
            },
        }),

        // Private config - contains secrets, must be gitignored
        privateConfig: env({
            path: ".env.local", // Gitignored
            variables: {
                API_KEY: process.env.API_KEY,
                DATABASE_URL: process.env.DATABASE_URL,
            },
        }),
    },
});
```

### 3. Use Conditional Generation

```typescript
export default defineConfig({
    targets: {
        // Only generate production secrets in production
        prodSecrets: env({
            path: "secrets/.env.production",
            variables: {
                STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
                JWT_SECRET: process.env.JWT_SECRET,
            },
            condition: process.env.NODE_ENV === "production",
        }),

        // Development secrets are safe with unsafe()
        devSecrets: env({
            path: "config/.env.development",
            variables: {
                STRIPE_SECRET_KEY: unsafe("sk_test_123", "Test Stripe key"),
                JWT_SECRET: unsafe("dev-jwt-secret", "Development JWT secret"),
            },
            condition: process.env.NODE_ENV === "development",
        }),
    },
});
```

## What's Next?

Secret detection keeps your credentials safe automatically. Combined with other
Axogen features:

- Use `loadEnv` to validate your environment variables
- Use `condition` to generate different configs per environment
- Use `backup` to protect against accidental overwrites
- Use the commands system to automate secure deployments

Check out:

- [Advanced Features](08-advanced.md) - Complex patterns and use cases

Your secrets are safe. Your deployments are consistent. Your nights are
peaceful.

That's what good tooling does.
