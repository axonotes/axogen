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
  <a href="https://axonotes.github.io/axogen/faq/">❓ FAQ</a>
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
  <a href="https://axonotes.github.io/axogen/">
    <img src="https://img.shields.io/badge/docs-live-brightgreen?style=flat-square" alt="docs" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-native-blue?style=flat-square&logo=typescript" alt="TypeScript" />
  </a>
</p>

---

## Background

I built Axogen out of frustration while working on
[AxonotesCore](https://github.com/axonotes/AxonotesCore). Keeping different
configs and environments in sync was a nightmare. What started as an internal
tool to solve this specific problem evolved into something more general.

Honestly, I'm surprised there isn't a simple, easy-to-use tool like this already
out there. If you know of one, please let me know!

> **Note:** This is very early development (v0.2.0). The API will likely change
> as I work on improving the developer experience to be even simpler while
> staying comprehensive.

## The Problem

In monorepos or complex projects, you often end up with:

- `.env` files scattered everywhere
- JSON configs that need the same values
- Docker Compose files with hardcoded values
- Kubernetes manifests with duplicated configuration
- No type safety for environment variables
- Manual syncing between different config formats

Here's a real example from a typical monorepo:

```
project/
├── api/.env                    # DATABASE_URL=postgres://...
├── web/.env.local              # NEXT_PUBLIC_API_URL=http://...
├── docker-compose.yml          # hardcoded ports and URLs
├── k8s/configmap.yaml          # same values again
└── terraform/variables.tf      # and again...
```

Every time you change a database URL or add a service, you're hunting through
multiple files. Miss one? Good luck debugging why staging is broken.

## The Solution

With Axogen, you define everything once:

```typescript
// axogen.config.ts
import {z, defineConfig, loadEnv} from "@axonotes/axogen";

const env = loadEnv(
    z.object({
        DATABASE_URL: z.string().url(),
        API_PORT: z.coerce.number().default(3001),
        WEB_PORT: z.coerce.number().default(3000),
        NODE_ENV: z
            .enum(["development", "staging", "production"])
            .default("development"),
    })
);

export default defineConfig({
    targets: {
        api: {
            path: "api/.env",
            type: "env",
            variables: {
                DATABASE_URL: env.DATABASE_URL,
                PORT: env.API_PORT,
                NODE_ENV: env.NODE_ENV,
            },
        },
        web: {
            path: "web/.env.local",
            type: "env",
            variables: {
                NEXT_PUBLIC_API_URL: `http://localhost:${env.API_PORT}`,
                NODE_ENV: env.NODE_ENV,
            },
        },
        docker: {
            path: "docker-compose.yml",
            type: "template",
            template: "templates/docker-compose.njk",
            variables: {
                apiPort: env.API_PORT,
                webPort: env.WEB_PORT,
                dbUrl: env.DATABASE_URL,
            },
        },
    },
    commands: {
        dev: "docker-compose up -d",
        build: "docker-compose build",
        deploy: "kubectl apply -f k8s/",
    },
});
```

Create a `.env.axogen` file with your actual values:

```bash
DATABASE_URL=postgresql://localhost:5432/myapp
API_PORT=3001
WEB_PORT=3000
NODE_ENV=development
```

> **Important:** Add `.env.axogen` to your `.gitignore`! Just like any `.env`
> file, you don't want to commit your secrets.

Now one command generates all your configs:

```bash
axogen generate
```

Your API gets its `.env`, your web app gets its `.env.local`, and your Docker
Compose file gets generated from a template - all perfectly in sync.

## ✨ Features

- **🛡️ Type-safe environment variables** with Zod validation
- **📁 Multiple output formats** - `.env`, JSON, YAML, TOML, custom templates
- **🎨 Template engine support** (Nunjucks, Handlebars, Mustache)
- **⚡ Custom commands** for common development tasks
- **🌍 Language-agnostic** - Works with Python, Go, Rust, Java, PHP, etc.
- **👀 Watch mode** for development (coming soon)
- **📦 Zero dependencies** in generated files

## 🚀 Quick Start

```bash
# Install
npm install @axonotes/axogen

# Create minimal config
echo 'import {defineConfig} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        app: {
            path: "app/.env",
            type: "env",
            variables: {
                NODE_ENV: "development",
                PORT: 3000,
            },
        },
    },
});' > axogen.config.ts

# Generate
axogen generate
```

**[📖 Full Documentation →](https://axonotes.github.io/axogen/)**

## 🤔 Why Not Just Use...?

**Language-specific tools:**

- **dotenv, config (JS)**: Only handle JavaScript. No multi-format generation.
- **Viper (Go), dynaconf (Python), config-rs (Rust)**: Great for their
  languages, but what about your Docker configs? Kubernetes manifests? You're
  back to manual syncing.

**Infrastructure tools:**

- **Terraform, Pulumi**: Infrastructure focus, not application config.
- **Ansible, Chef**: Server configuration management. Different problem space.
- **Helm, Kustomize**: Kubernetes-specific. Doesn't help with your `.env` files.

**The key difference:** Axogen works for ANY project in ANY language. Your
Python API, Go microservice, React frontend, Docker configs, and Kubernetes
manifests - all from one TypeScript source of truth.

Axogen fills the gap between simple environment management and complex
infrastructure tools.

## 📚 Documentation

| Resource                                                                 | Description                                  |
| ------------------------------------------------------------------------ | -------------------------------------------- |
| [📖 Documentation](https://axonotes.github.io/axogen/)                   | Complete guide and API reference             |
| [🚀 Getting Started](https://axonotes.github.io/axogen/getting-started/) | Progressive tutorial from basics to advanced |
| [💼 Examples](https://axonotes.github.io/axogen/examples/)               | Real-world usage patterns                    |
| [❓ FAQ](https://axonotes.github.io/axogen/faq/)                         | Common questions and comparisons             |

## 🤝 Contributing

This is still early development, so things will change. But if you want to help:

1. 🧪 Try it out and report issues
2. 💡 Suggest API improvements
3. 🔧 Contribute code (open an issue first to discuss)

## 📊 Star History

<a href="https://www.star-history.com/#axonotes/axogen&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=axonotes/axogen&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=axonotes/axogen&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=axonotes/axogen&type=Date" />
 </picture>
</a>

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/imgajeed76">Oliver Seifert</a>
</p>
