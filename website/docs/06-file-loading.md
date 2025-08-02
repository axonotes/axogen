---
title: File Loading
description: Loading existing configuration files with validation
keywords:
    [
        axogen file loading,
        config file import,
        existing config validation,
        file format loading,
        configuration migration,
        type-safe file loading,
    ]
sidebar_position: 6
---

# File Loading

Sometimes you already have config files lying around. Instead of rewriting
everything, you can load them into Axogen, validate them with Zod, and use them
in your configuration. Because why throw away perfectly good YAML when you can
make it type-safe?

## The loadFile Function

The `loadFile` function can read basically any config format and validate it:

```typescript
import {defineConfig, loadFile, json} from "@axonotes/axogen";
import * as z from "zod";

// Load an existing config file
const existingConfig = loadFile(
    "existing-config.json",
    "json",
    z.object({
        name: z.string(),
        version: z.string(),
        dependencies: z.record(z.string()),
    })
);

export default defineConfig({
    targets: {
        newConfig: json({
            path: "generated-config.json",
            variables: {
                // Use the loaded config
                appName: existingConfig.name,
                appVersion: existingConfig.version,
                hasRedis: "redis" in existingConfig.dependencies,
            },
        }),
    },
});
```

If the file doesn't match your schema, you get helpful error messages. If it
does match, you get fully typed data.

## Supported File Types

Axogen can load all these formats:

### Core JSON Formats

- `json` - Standard JSON
- `json5` - JSON5 with comments and trailing commas
- `jsonc` - JSON with comments (VS Code style)
- `hjson` - Human-friendly JSON

### Configuration Formats

- `yaml` - YAML files
- `toml` - TOML files (Rust's favorite)
- `ini` - INI files
- `properties` - Java-style properties
- `env` - Environment files

### Data Formats

- `xml` - XML files
- `csv` - CSV files
- `txt` - Plain text files
- `cson` - CoffeeScript Object Notation

## Basic Usage

Load a file without validation:

```typescript
import {loadFile} from "@axonotes/axogen";

// Just load the raw data
const config = loadFile("config.yaml", "yaml");
console.log(config.database.host); // No type safety, but it works
```

Load with validation:

```typescript
import {loadFile} from "@axonotes/axogen";
import * as z from "zod";

const config = loadFile(
    "config.yaml",
    "yaml",
    z.object({
        database: z.object({
            host: z.string(),
            port: z.number(),
        }),
        features: z.array(z.string()),
    })
);

// Now TypeScript knows the shape
console.log(config.database.host); // Fully typed!
```

## Real-World Examples

### Loading Package.json

```typescript
import {defineConfig, loadFile, json} from "@axonotes/axogen";
import * as z from "zod";

const packageJson = loadFile(
    "package.json",
    "json",
    z.object({
        name: z.string(),
        version: z.string(),
        dependencies: z.record(z.string()).optional(),
        devDependencies: z.record(z.string()).optional(),
    })
);

export default defineConfig({
    targets: {
        dockerCompose: yaml({
            path: "docker-compose.yml",
            variables: {
                version: "3.8",
                services: {
                    app: {
                        image: `${packageJson.name}:${packageJson.version}`,
                        environment: {
                            NODE_ENV: "production",
                        },
                    },
                },
            },
        }),
    },
});
```

### Loading Kubernetes Config

```typescript
import {defineConfig, loadFile, yaml} from "@axonotes/axogen";
import * as z from "zod";

const kubeConfig = loadFile(
    "k8s/base-deployment.yaml",
    "yaml",
    z.object({
        metadata: z.object({
            name: z.string(),
            namespace: z.string().optional(),
        }),
        spec: z.object({
            replicas: z.number(),
        }),
    })
);

export default defineConfig({
    targets: {
        prodDeployment: yaml({
            path: "k8s/production-deployment.yaml",
            variables: {
                ...kubeConfig,
                metadata: {
                    ...kubeConfig.metadata,
                    name: `${kubeConfig.metadata.name}-prod`,
                },
                spec: {
                    ...kubeConfig.spec,
                    replicas: kubeConfig.spec.replicas * 2, // Scale up for prod
                },
            },
        }),
    },
});
```

### Loading Environment Variables

```typescript
import {defineConfig, loadFile, env} from "@axonotes/axogen";
import * as z from "zod";

// Load from an existing .env file
const existingEnv = loadFile(
    ".env.example",
    "env",
    z.object({
        DATABASE_URL: z.string(),
        REDIS_URL: z.string(),
        API_PORT: z.coerce.number(),
    })
);

export default defineConfig({
    targets: {
        dockerEnv: env({
            path: ".env.docker",
            variables: {
                // Override for Docker environment
                DATABASE_URL: existingEnv.DATABASE_URL.replace(
                    "localhost",
                    "db"
                ),
                REDIS_URL: existingEnv.REDIS_URL.replace("localhost", "redis"),
                API_PORT: existingEnv.API_PORT,
                DOCKER_MODE: "true",
            },
        }),
    },
});
```

### Loading CSV Data

```typescript
import {defineConfig, loadFile, json} from "@axonotes/axogen";
import * as z from "zod";

const users = loadFile(
    "data/users.csv",
    "csv",
    z.array(
        z.object({
            name: z.string(),
            email: z.string().email(),
            role: z.enum(["admin", "user"]),
        })
    )
);

export default defineConfig({
    targets: {
        userConfig: json({
            path: "config/users.json",
            variables: {
                totalUsers: users.length,
                adminUsers: users.filter((u) => u.role === "admin").length,
                userEmails: users.map((u) => u.email),
            },
        }),
    },
});
```

## Loading TXT Files

To be honest, loading plain text files is not very exciting, but you can do it:

```typescript
import {loadFile, txtSchema} from "@axonotes/axogen";

const readme = loadFile("README.txt", "txt", txtSchema);
console.log(readme.content);
```

## Combining with loadEnv

You can combine file loading with environment variable loading:

```typescript
import {defineConfig, loadFile, loadEnv, json} from "@axonotes/axogen";
import * as z from "zod";

// Load environment variables
const env = loadEnv(
    z.object({
        NODE_ENV: z.enum(["development", "production"]),
    })
);

// Load different config based on environment
const appConfig = loadFile(
    `config/app.${env.NODE_ENV}.json`,
    "json",
    z.object({
        database: z.object({
            host: z.string(),
            port: z.number(),
        }),
        cache: z.object({
            ttl: z.number(),
        }),
    })
);

export default defineConfig({
    targets: {
        finalConfig: json({
            path: "dist/config.json",
            variables: {
                environment: env.NODE_ENV,
                database: appConfig.database,
                cache: appConfig.cache,
                buildTime: new Date().toISOString(),
            },
        }),
    },
});
```

:::info loadEnv vs loadFile(".env", "env")

Sure, both loaders can perfectly fine load an env file. But `loadEnv` also
registers the variables in the process.env while `loadFile` just returns the
content.

:::

## Error Handling

When files don't exist or validation fails, you get clear error messages:

```typescript
// This will throw if the file doesn't exist
const config = loadFile("missing-file.json", "json");

// This will throw if validation fails
const config = loadFile(
    "config.json",
    "json",
    z.object({
        requiredField: z.string(),
    })
);
```

The error messages tell you exactly what went wrong and where.

## Path Resolution

File paths are resolved relative to your current working directory:

```typescript
// These are all valid
loadFile("config.json", "json"); // ./config.json
loadFile("configs/app.yaml", "yaml"); // ./configs/app.yaml
loadFile("/absolute/path/to/config.toml", "toml"); // Absolute path
```

## What's Next?

File loading lets you bridge the gap between existing configs and Axogen's type
safety. You can:

- Migrate existing projects gradually
- Load base configs and extend them
- Validate external config files
- Transform data between formats

Check out:

- [Secret Detection](07-secrets.md) - Keeping your secrets safe
- [Advanced Features](08-advanced.md) - Complex patterns and use cases

Your existing configs don't have to be a liability. Make them an asset.
