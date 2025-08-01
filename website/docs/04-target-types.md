---
title: Target Types
description: All the file formats Axogen can generate
sidebar_position: 4
---

# Target Types

Axogen supports a ridiculous number of file formats. Like, probably more than
you'll ever need. But hey, when that one project comes along that needs HJSON
for some reason, you'll be ready.

## The Factory Functions

Since v0.5.0, each target type has its own factory function. This gives you
proper TypeScript IntelliSense and catches mistakes early:

```typescript
import {defineConfig, json, yaml, env, toml} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: json({
            /* ... */
        }),
        k8s: yaml({
            /* ... */
        }),
        app: env({
            /* ... */
        }),
        cargo: toml({
            /* ... */
        }),
    },
});
```

All factory functions follow the same pattern - they take a config object and
return a target definition.

## JSON Family

### JSON - `json()`

Standard JSON. You know what this is.

```typescript
import {defineConfig, json} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: json({
            path: "config.json",
            variables: {
                name: "MyApp",
                version: "1.0.0",
                settings: {
                    debug: false,
                    port: 3000,
                },
            },
            options: {
                space: 2,
            },
        }),
    },
});
```

### JSON5 - `json5()`

JSON5 supports comments, trailing commas, and other nice things that regular
JSON doesn't:

```typescript
import {defineConfig, json5} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: json5({
            path: "config.json5",
            variables: {
                name: "MyApp",
                features: ["authentication", "logging"],
            },
            options: {
                space: 2,
            },
        }),
    },
});
```

### JSONC - `jsonc()`

JSON with Comments (VS Code style):

```typescript
import {defineConfig, jsonc} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        vscode: jsonc({
            path: ".vscode/settings.json",
            variables: {
                "typescript.preferences.quoteStyle": "double",
                "editor.formatOnSave": true,
            },
        }),
    },
});
```

### HJSON - `hjson()`

Human-friendly JSON where quotes are optional and comments work everywhere:

```typescript
import {defineConfig, hjson} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: hjson({
            path: "config.hjson",
            variables: {
                name: "MyApp",
                settings: {
                    debug: true,
                    port: 3000,
                },
            },
        }),
    },
});
```

## Configuration Formats

### YAML - `yaml()`

Because Kubernetes made us all learn YAML:

```typescript
import {defineConfig, yaml} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        deployment: yaml({
            path: "k8s/deployment.yaml",
            variables: {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "my-app",
                },
                spec: {
                    replicas: 3,
                    selector: {
                        matchLabels: {
                            app: "my-app",
                        },
                    },
                },
            },
            options: {
                indent: 2,
                quotingType: '"',
            },
        }),
    },
});
```

### TOML - `toml()`

For your Rust projects and other civilized languages:

```typescript
import {defineConfig, toml} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        cargo: toml({
            path: "Cargo.toml",
            variables: {
                package: {
                    name: "my-rust-app",
                    version: "0.1.0",
                    edition: "2021",
                },
                dependencies: {
                    serde: "1.0",
                    tokio: {version: "1.0", features: ["full"]},
                },
            },
        }),
    },
});
```

### INI - `ini()`

For when it's 1995 again:

```typescript
import {defineConfig, ini} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: ini({
            path: "app.ini",
            variables: {
                database: {
                    host: "localhost",
                    port: 5432,
                    name: "mydb",
                },
                logging: {
                    level: "info",
                    file: "app.log",
                },
            },
        }),
    },
});
```

### Properties - `properties()`

Java-style properties files:

```typescript
import {defineConfig, properties} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: properties({
            path: "application.properties",
            variables: {
                "server.port": 8080,
                "spring.datasource.url": "jdbc:postgresql://localhost/db",
                "logging.level.com.myapp": "DEBUG",
            },
            options: {
                align: true,
                sort: true,
            },
        }),
    },
});
```

## Environment Files

### ENV - `env()`

The classic `.env` file:

```typescript
import {defineConfig, env} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        app: env({
            path: ".env.production",
            variables: {
                NODE_ENV: "production",
                PORT: 8080,
                DATABASE_URL: "postgres://prod-server/db",
                API_KEY: "your-api-key-here",
            },
        }),
    },
});
```

## Data Formats

### XML - `xml()`

```typescript
import {defineConfig, xml} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: xml({
            path: "config.xml",
            variables: {
                configuration: {
                    database: {
                        host: "localhost",
                        port: 5432,
                    },
                    features: {
                        feature: [
                            {name: "auth", enabled: true},
                            {name: "logging", enabled: false},
                        ],
                    },
                },
            },
            options: {
                format: true,
                indentBy: "  ",
            },
        }),
    },
});
```

### CSV - `csv()`

Spreadsheet-friendly data:

```typescript
import {defineConfig, csv} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        users: csv({
            path: "users.csv",
            variables: [
                {name: "John", email: "john@example.com", role: "admin"},
                {name: "Jane", email: "jane@example.com", role: "user"},
            ],
            options: {
                header: true,
                delimiter: ",",
            },
        }),
    },
});
```

### CSON - `cson()`

CoffeeScript Object Notation (remember CoffeeScript?):

```typescript
import {defineConfig, cson} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: cson({
            path: "config.cson",
            variables: {
                name: "MyApp",
                settings: {
                    debug: true,
                    port: 3000,
                },
            },
        }),
    },
});
```

## Template Files

### Template - `template()`

For when you need full control. Supports Nunjucks, Handlebars, and Mustache:

```typescript
import {defineConfig, template} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        nginx: template({
            path: "nginx.conf",
            template: "nginx.conf.njk",
            engine: "nunjucks",
            variables: {
                serverName: "example.com",
                port: 80,
                upstreams: [
                    {name: "app1", host: "localhost:3000"},
                    {name: "app2", host: "localhost:3001"},
                ],
            },
        }),
    },
});
```

Your `nginx.conf.njk` template file would contain template syntax like
`{{ serverName }}` and `{% for upstream in upstreams %}`.

## Schema Validation

Every target type supports optional Zod schema validation:

```typescript
import {defineConfig, json} from "@axonotes/axogen";
import * as z from "zod";

export default defineConfig({
    targets: {
        config: json({
            path: "config.json",
            schema: z.object({
                name: z.string().min(1),
                port: z.number().min(1).max(65535),
                features: z.array(z.string()),
            }),
            variables: {
                name: "MyApp",
                port: 3000,
                features: ["auth", "logging"],
            },
        }),
    },
});
```

If your variables don't match the schema, you'll get helpful error messages at
build time.

## Common Options

All targets support these common options:

- `condition` - Only generate if this boolean is true
- `backup` - Backup the existing file before overwriting
- `generate_meta` - Add metadata to the target at runtime (time, settings,
  generator, etc.). Default is false

```typescript
import {defineConfig, json} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        config: json({
            path: "config.json",
            variables: {name: "MyApp"},
            condition: process.env.NODE_ENV === "production",
            backup: true,
            generate_meta: true,
        }),
    },
});
```

## What's Next?

Now you know about all the formats. Time to learn about:

- [Commands System](05-commands.md) - Task automation and command management
- [File Loading](06-file-loading.md) - Loading existing configs with validation
- [Secret Detection](07-secrets.md) - Keeping your secrets safe

Pick your format, generate your files, profit.
