---
title: FAQ
description: Frequently Asked Questions about Axogen
keywords:
    [
        axogen faq,
        axogen questions,
        troubleshooting axogen,
        production readiness,
        team adoption,
        axogen vs dotenv,
        configuration tool comparison,
        axogen support,
    ]
sidebar_position: 99
---

# FAQ

## Getting Started

<details>
<summary>Why Axogen?</summary>

Because it's simple to set up and use. It eliminates many dumb errors in early
development - you know, those "why is staging broken?" moments when you forgot
to update one config file but not the others.

The whole point is having one source of truth for your configuration. Write it
once in TypeScript, generate everywhere. No more hunting through a dozen files
to change a database URL.

</details>

<details>
<summary>Why TypeScript?</summary>

Most people already know TypeScript. It's a simple language, but you can do
ANYTHING in it. Your config isn't bound to my system - you can make it as
complex as you want. I just give you the building blocks.

Want conditional logic based on environment? Go for it. Need to calculate
values? TypeScript's got you. Want to import utilities from other files? Do it.
It's just code.

</details>

<details>
<summary>Can I use this with existing `.env` files?</summary>

Mostly yes! Just rename your existing `.env` file to `.env.axogen`, then create
an Axogen config that generates your original `.env` file.

Your app keeps working exactly the same, but now you get type safety and can
generate other formats from the same data.

</details>

<details>
<summary>Can I gradually adopt this in an existing project?</summary>

Definitely! Start with one config file. Maybe generate your main `.env` file
from Axogen, but leave everything else as-is.

Once you see the value, you can gradually add more targets - your Docker Compose
file, Kubernetes manifests, whatever. No need to migrate everything at once.

</details>

## Stability & Production Use

<details>
<summary>Is this stable enough for production? It's only v0.5.0...</summary>

Fair question! The API has stabilized significantly since the early days. v0.5.0
introduces the new factory function API and many core features are now solid.

That said, you're right to be cautious. The generated files are just normal
`.env` files and such, so worst case you can stop using Axogen and keep the
generated configs. Your app never actually depends on Axogen at runtime.

Start with non-critical projects, see how it feels, then decide if you trust it
for production.

</details>

<details>
<summary>What if this project gets abandoned?</summary>

Valid concern for a solo developer project. Here's the thing though: Axogen
isn't just a side project - it's the backbone of
[AxonotesCore](https://github.com/axonotes/AxonotesCore), my main project that
I'm actively building and plan to keep working on for the long haul.

As long as I'm developing AxonotesCore (which I very likely will be), Axogen
will keep getting attention and improvements. It's not going anywhere because I
literally can't work without it anymore.

Plus, even if something happened, Axogen generates standard files (.env, Docker
configs, etc.). Your generated configs keep working - you'd just lose the
ability to regenerate them from the TypeScript source.

Think of it as a build tool, not a runtime dependency.

</details>

<details>
<summary>Will my configs break when you release v1.0?</summary>

Probably some breaking changes, yeah. I'm still figuring out the best APIs. But
I'll provide migration guides and try to make upgrades as smooth as possible.

For now, pin to a specific version if stability is critical:
`npm install @axonotes/axogen@0.5.0`

</details>

## Security & Secrets

<details>
<summary>How do I handle secrets/sensitive data?</summary>

Currently, put them in the `.env.axogen` file. Just **don't push this file to
git** (add it to your `.gitignore`!).

I'm open to more sophisticated secret management in the future - maybe
integration with secret managers or encrypted environment files. But for now,
treat `.env.axogen` like you would any other `.env` file with secrets.

</details>

<details>
<summary>What about git workflows? What should I commit?</summary>

**Commit:**

- `axogen.config.ts` (your configuration logic)
- Generated files like `.env.example` or `docker-compose.yml` (if they don't
  contain secrets)

**Don't commit:**

- `.env.axogen` (contains your actual secrets)
- Generated files with secrets in them

**Pro tip:** Generate a `.env.example` target with placeholder values for new
developers.

</details>

<details>
<summary>How does this work with secret management tools like Vault?</summary>

Not directly integrated yet, but you could write TypeScript code in your config
that fetches from Vault at generation time. Or use Axogen to generate the config
files, then let your deployment pipeline inject secrets.

This is definitely something I want to improve. Open an issue if you have
specific requirements!

</details>

## Team & Adoption

<details>
<summary>How do I convince my team to switch?</summary>

Honestly? If you're convinced, you'll find a way. Show them how it prevents the
"oops, I forgot to update the staging config" bugs.

Or just start using it yourself and let them see how much smoother your
deployments become.

</details>

<details>
<summary>What if my teammates don't know TypeScript/Zod?</summary>

Start simple. A basic Axogen config is just variable declarations - not much
TypeScript knowledge needed. The validation errors are pretty clear too.

For complex logic, maybe one person writes the config and others just update
`.env.axogen` values. You don't need everyone to be a TypeScript expert.

</details>

<details>
<summary>How do I onboard new developers?</summary>

1. They clone the repo
2. Copy `.env.axogen.example` to `.env.axogen` and fill in their values
3. Run `axogen generate`
4. Everything else just works

Much better than the current "here's a .env.example file that's probably out of
date, good luck!"

</details>

## Integration & Performance

<details>
<summary>How does this work with Docker and CI/CD?</summary>

Great question! You can generate Docker Compose files, Kubernetes manifests,
whatever. The key is running `axogen generate` as part of your build process.

In your Dockerfile:

```dockerfile
COPY axogen.config.ts .env.axogen ./
RUN axogen generate
```

Or in your CI pipeline before building. The generated files then get packaged
normally.

</details>

<details>
<summary>Does this slow down my builds?</summary>

Shouldn't! Generation is pretty fast (11,000 configs in ~3 seconds), and you
only run it when config actually changes. That's ~0.3ms per config file!

That said, I haven't optimized for build performance yet. If it becomes a
bottleneck, let me know!

</details>

<details>
<summary>How does this integrate with [framework/tool]?</summary>

Since Axogen generates standard files, it should work with anything. Generate
your `.env` file, and Next.js/Vite/whatever loads it normally.

For framework-specific optimizations (like generating `next.config.js`
directly), I'm open to adding templates or plugins. File an issue with your use
case!

</details>

## Debugging & Advanced Usage

<details>
<summary>When something goes wrong, how do I debug it?</summary>

Few strategies:

1. **Use `--dry-run`** to see what would be generated
2. **Check the generated files** - they're just text files you can inspect
3. **Add `console.log` statements** in your config - it's just TypeScript!
4. **Start simple** - comment out complex logic and gradually add it back

The error messages should be pretty clear thanks to Zod, but if you're stuck,
file an issue with your config.

</details>

<details>
<summary>Can I validate my config before generating?</summary>

Yep! Use the `--dry-run` flag:

```bash
axogen generate --dry-run
```

This shows you what would be generated without actually writing files.

</details>

<details>
<summary>What happens when a template fails?</summary>

The goal is to give you a nice warning and not break your stuff. Good developer
experience is the priority.

That said, I literally built this in 3 days. So I can't promise everything works
perfectly yet. It'll get better over time. If something breaks, file an issue!

</details>

<details>
<summary>Can I generate custom formats you don't support?</summary>

Absolutely! Use the `template` type:

```typescript
import {defineConfig, template} from "@axonotes/axogen";

export default defineConfig({
    targets: {
        custom: template({
            path: "my-config.xml",
            template: "my-template.xml.njk",
            engine: "nunjucks", // (default: "nunjucks")
            variables: env,
        }),
    },
});
```

Any format you can template, Axogen can generate. I use Nunjucks for templating.

</details>

<details>
<summary>How does this scale with many services/complex configs?</summary>

Good question - I honestly don't know yet! The biggest config I've tested is
AxonotesCore with ~3 services.

If you try it with 20+ services and it breaks, let me know what went wrong.
Performance should be fine (it's mostly just JSON manipulation), but the config
might get unwieldy to maintain.

</details>

## Comparisons

<details>
<summary>How does this compare to other tools?</summary>

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
TypeScript config. Plus you get type safety, secret detection, backup system,
and a task runner for free.

Most tools are either language-specific OR format-specific. Axogen is
language-agnostic AND multi-format.

</details>

<details>
<summary>When should I NOT use Axogen?</summary>

- **Simple single-service apps** - dotenv is probably fine
- **You hate TypeScript** - this isn't going to change your mind
- **You need enterprise features** - use a proper config management platform
- **Your team is allergic to new tools** - don't force it
- **You have complex secret rotation requirements** - use a real secret manager

</details>

## Support & Community

<details>
<summary>Where do I get help?</summary>

- **GitHub Issues**: For bugs and feature requests
- **Discord**: For questions and ideas

It's just me for now, so please be patient! I'll do my best to help.

</details>

<details>
<summary>How can I contribute?</summary>

Open issues, submit PRs, or just try it and tell me what breaks! I'm especially
interested in:

- Real-world use cases I haven't thought of
- Templates for popular tools (K8s, Terraform, etc.)
- Better error messages and DX improvements
- Performance optimizations

Check the [GitHub repo](https://github.com/axonotes/axogen) for contribution
guidelines.

</details>

<details>
<summary>Are there more examples beyond the blog post?</summary>

There are a few more examples in the docs under the examples tab, but fair
warning - the docs are probably not up to date right now. I'm focused on getting
the core features stable first, so I can write good documentation that I don't
have to constantly rewrite.

Once the API settles down more, I'll invest properly in comprehensive examples
and tutorials. For now, the blog post is your best bet for understanding what
Axogen can do.

If you build something cool with Axogen, I'd love to feature it as an example
once the docs are in better shape!

</details>
