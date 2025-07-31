<p align="center">
  <a href="./">
    <img src="assets/favicon.svg" alt="Axonotes Logo" width="150"/>
  </a>
</p>

<h1 align="center">Axogen</h1>

<p align="center">
  <strong>TypeScript-native configuration system for <em>any project, any language</em></strong>
</p>

<p align="center">
  <a href="https://axonotes.github.io/axogen/">📖 Documentation</a> |
  <a href="https://axonotes.github.io/axogen/getting-started/">🚀 Quick Start</a> |
  <a href="https://discord.gg/myBMaaDeQu">💬 Discord</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@axonotes/axogen">
    <img src="https://img.shields.io/npm/v/@axonotes/axogen?style=flat-square&color=blue" alt="npm version" />
  </a>
  <a href="https://www.npmjs.com/package/@axonotes/axogen">
    <img src="https://img.shields.io/npm/dm/@axonotes/axogen?style=flat-square&color=green" alt="npm downloads" />
  </a>
  <a href="https://github.com/axonotes/axogen/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/axonotes/axogen?style=flat-square" alt="license" />
  </a>
  <a href="https://github.com/axonotes/axogen/stargazers">
    <img src="https://img.shields.io/github/stars/axonotes/axogen?style=flat-square&color=yellow" alt="stars" />
  </a>
</p>

---

## The Problem

You know that moment when you change a port number and suddenly half your
services can't talk to each other? Or when you spend 20 minutes debugging only
to realize you forgot to update the WebSocket URL in three different places?

In complex projects, configuration is scattered everywhere:

```
project/
├── api/.env                    # DATABASE_URL=postgres://...
├── web/.env.local              # NEXT_PUBLIC_API_URL=http://...
├── docker-compose.yml          # hardcoded ports and URLs
├── k8s/configmap.yaml          # same values again
└── package.json                # scripts with more hardcoded URLs
```

Every time you change a database URL or add a service, you're hunting through
multiple files. Miss one? Good luck debugging why staging is broken.

## The Solution

Define everything once in TypeScript, generate everywhere:

```typescript
// axogen.config.ts
import {defineConfig, loadEnv, env, json, group, cmd} from "@axonotes/axogen";
import {z} from "zod";

const config = loadEnv(
    z.object({
        DATABASE_URL: z.url(),
        API_PORT: z.coerce.number().default(3001),
        WEB_PORT: z.coerce.number().default(3000),
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
    })
);

export default defineConfig({
    targets: {
        api: env({
            path: "api/.env",
            variables: {
                DATABASE_URL: config.DATABASE_URL,
                PORT: config.API_PORT,
                NODE_ENV: config.NODE_ENV,
            },
        }),
        web: env({
            path: "web/.env.local",
            variables: {
                NEXT_PUBLIC_API_URL: `http://localhost:${config.API_PORT}`,
                NODE_ENV: config.NODE_ENV,
            },
        }),
        docker: json({
            path: "docker-config.json",
            variables: {
                apiPort: config.API_PORT,
                webPort: config.WEB_PORT,
                dbUrl: config.DATABASE_URL,
            },
        }),
    },
    commands: {
        dev: "docker-compose up -d",
        "dev:api": `cd api && npm run dev --port ${config.API_PORT}`,
        database: group({
            commands: {
                migrate: "npm run migrate",
                seed: "npm run seed",
                backup: group({
                    commands: {
                        create: cmd({
                            help: "Create a database backup",
                            options: {
                                name: z.string().describe("Backup name"),
                            },
                            exec: (ctx) =>
                                console.log(
                                    `Creating backup: ${ctx.options.name}`
                                ),
                        }),
                    },
                }),
            },
        }),
    },
});
```

Put your actual values in `.env.axogen`:

```bash
DATABASE_URL=postgresql://localhost:5432/myapp
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

One command generates all your configs:

```bash
axogen generate
```

Change `API_PORT` to 4000, regenerate, and every URL automatically updates. One
source of truth, everything else just follows.

## ✨ Features

- **🛡️ Full type safety** with Zod validation and TypeScript IntelliSense
- **🔐 Secret detection** prevents accidental commits of sensitive data
- **📁 10+ file formats** - `.env`, JSON, YAML, TOML, XML, templates, and more
- **🎨 Template engine support** (Nunjucks, Handlebars, Mustache)
- **⚡ Nested command system** with help text and typed arguments
- **🎯 Conditional generation** based on environment or custom logic
- **💾 Automatic backups** before overwriting files
- **🌍 Language-agnostic** - Works with Python, Go, Rust, Java, PHP, etc.
- **⚡ Fast** - 10,000 configs generated in ~2 seconds

## 🚀 Quick Start

```bash
# Install
npm install @axonotes/axogen

# Create basic config
echo 'import {defineConfig, env} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        app: env({
            path: ".env",
            variables: {
                NODE_ENV: "development",
                PORT: 3000,
            },
        }),
    },
});' > axogen.config.ts

# Generate
axogen generate

# Run commands
axogen run --help
```

## 🤔 Why Not Just Use...?

**Language-specific tools** (dotenv, Viper, dynaconf): Only work for one
language. What about your Docker configs? Kubernetes manifests?

**Infrastructure tools** (Terraform, Helm): Great for infrastructure, overkill
for application config.

**The key difference:** Axogen works for ANY project in ANY language. Your
Python API, Go microservice, React frontend, Docker configs, and Kubernetes
manifests - all from one TypeScript source of truth.

## 📚 Examples

### Multi-Service Monorepo

```typescript
export default defineConfig({
    targets: {
        auth: env({ path: "services/auth/.env", variables: {...} }),
        api: env({ path: "services/api/.env", variables: {...} }),
        web: env({ path: "apps/web/.env.local", variables: {...} }),
        docker: template({
            path: "docker-compose.yml",
            template: "docker-compose.njk",
            variables: config,
        }),
    },
});
```

### Environment-Specific Configs

```typescript
const config = getConfig(); // Your function that returns different values based on NODE_ENV

export default defineConfig({
    targets: {
        production: env({
            path: "prod/.env",
            variables: config.production,
            condition: process.env.NODE_ENV === "production",
        }),
    },
});
```

## ⚠️ Current Status

This is v0.5.0 - actively developed and used for
[AxonotesCore](https://github.com/axonotes/AxonotesCore), but still evolving.
The API is getting more stable, but expect some changes before v1.0.

Generated files are just normal `.env`, JSON, etc. - your apps never depend on
Axogen at runtime. Worst case, you can stop using Axogen and keep the generated
configs.

## 🤝 Contributing

Found a bug? Have a feature idea? Open an issue or join the
[Discord](https://discord.gg/myBMaaDeQu).

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/imgajeed76">Oliver Seifert</a>
</p>
