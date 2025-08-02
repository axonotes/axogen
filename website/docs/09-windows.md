---
title: Windows
description: How to use Axogen on Windows
keywords: [advanced axogen, windows configuration, axogen windows setup]
sidebar_position: 9
---

# Windows

Sadly, Windows is not a first-class citizen in the Axogen world. But you can
still use it with some workarounds.

## Using Axogen on Windows

On Linux and macOS, you would run Axogen like this:

```bash
axogen generate
```

On Windows, you need to use `npx` (or your package manager's equivalent):

```bash npm2yarn
npx @axonotes/axogen generate
```

This is the same for all commands. Just prepend `npx @axonotes/axogen` to the
command you want to run instead of `axogen`.
