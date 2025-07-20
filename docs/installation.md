# Installation

Look, installing stuff should be simple. And it is.

## What You Need

- Node.js 16+ (you probably already have this)
- TypeScript (not required, but why wouldn't you?)

## Install It

Pick your poison:

=== "npm"

    ```bash
    npm install @axonotes/axogen
    ```

=== "yarn"

    ```bash
    yarn add @axonotes/axogen
    ```

=== "pnpm"

    ```bash
    pnpm add @axonotes/axogen
    ```

=== "bun"

    ```bash
    bun add @axonotes/axogen
    ```

## Make Sure It Worked

Check the version:

```bash
axogen --version
```

If you see a version number, you're golden. Want to test it out real quick?

```bash
# Create a minimal config
echo 'import {defineConfig} from "@axonotes/axogen";
export default defineConfig({
    targets: {
        test: {
            path: "test.env",
            type: "env",
            variables: {NODE_ENV: "test"}
        }
    }
});' > axogen.config.ts

# Generate it
axogen generate

# Clean up
rm axogen.config.ts test.env
```

!!! success "That's it!"

    Create a proper `axogen.config.ts` file and you're off to the races.
    Check out the [Getting Started](getting-started.md) guide to see how simple it really is.
