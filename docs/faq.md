# FAQ

## Why Axogen?

Because it's simple to set up and use. It eliminates many dumb errors in early
development - you know, those "why is staging broken?" moments when you forgot
to update one config file but not the others.

The whole point is having one source of truth for your configuration. Write it
once in TypeScript, generate everywhere. No more hunting through a dozen files
to change a database URL.

## Why TypeScript?

Most people already know TypeScript. It's a simple language, but you can do
ANYTHING in it. Your config isn't bound to my system - you can make it as
complex as you want. I just give you the building blocks.

Want conditional logic based on environment? Go for it. Need to calculate
values? TypeScript's got you. Want to import utilities from other files? Do it.
It's just code.

## How do I handle secrets/sensitive data?

Currently, put them in the `.env.axogen` file. Just **don't push this file to
git** (add it to your `.gitignore`!).

I'm open to more sophisticated secret management in the future - maybe
integration with secret managers or encrypted environment files. But for now,
treat `.env.axogen` like you would any other `.env` file with secrets.

## Can I use this with existing `.env` files?

Mostly yes! Just rename your existing `.env` file to `.env.axogen`, then create
an Axogen config that generates your original `.env` file.

Your app keeps working exactly the same, but now you get type safety and can
generate other formats from the same data.

## How does this compare to other tools?

**JavaScript/TypeScript:**

- **dotenv, cross-env**: Only load `.env` files. No generation, no type safety.
- **@nestjs/config, convict**: Framework-specific. Still need to manually sync
  different formats.

**Python:**

- **dynaconf, pydantic-settings**: Python-only. No multi-format generation from
  one source.

**Go:**

- **Viper, envconfig**: Go-only. Great for Go apps, but doesn't help with
  Docker, K8s, etc.

**Rust:**

- **config-rs, figment**: Rust-only. Same limitation.

**Infrastructure:**

- **Terraform, Pulumi**: Infrastructure as code. Overkill for app config.
- **Ansible, Chef**: Server configuration management. Different problem space.
- **Helm, Kustomize**: Kubernetes-specific templating.

**The key difference:** Axogen works for ANY project in ANY language. Your Go
API, Python scripts, Docker configs, Kubernetes manifests - all from one
TypeScript config. Plus you get type safety and a task runner for free.

Most tools are either language-specific OR format-specific. Axogen is
language-agnostic AND multi-format.

## What happens when a template fails?

The goal is to give you a nice warning and not break your stuff. Good developer
experience is the priority.

That said, I literally built this in 2 days using AI as a productivity tool to
rapidly prototype and test ideas, then hardened the good parts. So I can't
promise everything works perfectly yet. It'll get better over time. If something
breaks, file an issue!

## Can I validate my config before generating?

Yep! Use the `--dry-run` flag:

```bash
axogen generate --dry-run
```

This shows you what would be generated without actually writing files.

## Can I gradually adopt this in an existing project?

Definitely! Start with one config file. Maybe generate your main `.env` file
from Axogen, but leave everything else as-is.

Once you see the value, you can gradually add more targets - your Docker Compose
file, Kubernetes manifests, whatever. No need to migrate everything at once.

## How do I convince my team to switch?

Honestly? If you're convinced, you'll find a way. Show them how it prevents the
"oops, I forgot to update the staging config" bugs.

Or just start using it yourself and let them see how much smoother your
deployments become.
