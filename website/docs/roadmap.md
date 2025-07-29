# Axogen Development Roadmap & Checklist

## 📋 Quick Reference

- **Total Features**: ~85 items
- **Phase 1 (Core)**: 25 items
- **Phase 2 (Essential)**: 20 items
- **Phase 3 (Advanced)**: 25 items
- **Phase 4 (Future)**: 15 items

---

## 🚀 Phase 1: Core Foundation

### Getting Started & CLI

- [ ] `npx axogen init` command
- [ ] Auto-detect project structure
- [ ] Preset support (`--preset nextjs`, `--preset fullstack-ts`,
      `--preset microservices`)
- [ ] Generate sensible default config
- [ ] Create `.env.axogen` with placeholders
- [ ] Basic CLI argument parsing

### Security & Safety (Critical)

- [x] Automatic secret detection in variables
- [x] `.gitignore` validation for sensitive files
- [x] Error messages for unprotected sensitive files
- [x] `unsafe()` wrapper implementation
- [x] Sensitive data patterns (API keys, tokens, passwords, connection strings)
- [x] Clear, actionable error messages with solutions

### Core Configuration Variants

- [ ] **Variant 1**: Zero Config (Magic Mode) - auto-detection (UPDATE: removed)
- [x] **Variant 2**: Simple Explicit configuration
- [x] **Variant 3**: Multi-Target Basic configuration
- [x] `defineConfig()` helper function
- [x] TypeScript support for config files

### Essential File Formats (Phase 1)

- [x] **ENV** format (`.env`) - read & write
- [x] **JSON** format (`.json`) - read & write
- [x] **YAML** format (`.yaml`, `.yml`) - read & write
- [x] Bidirectional support for all Phase 1 formats

### Basic Command System

- [x] String commands (`"node server.js"`)
- [x] Basic command execution
- [x] Command registry and lookup

---

## 🔧 Phase 2: Essential Features

### Advanced Configuration

- [x] **Variant 4**: Type-Safe Configuration with `defineConfig`
- [x] **Variant 5**: Environment Loading and Validation
- [x] `loadEnv()` function with Zod validation
- [x] `loadFile()` function for config files
- [x] Schema validation for targets

### Enhanced File Formats (Phase 2)

- [ ] **JavaScript** format (`.js`, `.mjs`) - read & write
- [ ] **TypeScript** format (`.ts`, `.mts`) - read & write
- [x] **TOML** format (`.toml`) - read & write
- [x] **JSONC** format (`.jsonc`) - read & write

### Command Helpers & Orchestration

- [x] `command.string()` helper
- [x] `command.function()` helper
- [x] `command.define()` with options/args
- [x] `cmd()` shorthand helper
- [ ] `command.parallel()` execution (UPDATE: removed)
- [ ] `command.series()` execution (UPDATE: removed)
- [x] Command groups with `command.group()`
- [x] Rich command context object
- [x] Global options support

### Template Generation (Basic)

- [x] **Variant 7**: Template Generation
- [x] Nunjucks template engine

### Secrets Management (Core)

- [ ] **Variant 8**: Secrets Management Integration
- [ ] `loadSecrets()` function
- [ ] Doppler integration
- [ ] Basic secrets provider interface

---

## 🏗️ Phase 3: Advanced Features

### Additional File Formats (Phase 3)

- [x] **XML** format (`.xml`) - read & write
- [x] **INI** format (`.ini`, `.conf`, `.cfg`) - read & write
- [x] **Properties** format (`.properties`) - read & write
- [ ] **HCL** format (`.hcl`) - read & write (UPDATE: removed)

### Advanced Template Engines

- [x] Handlebars template engine
- [x] Mustache template engine
- [x] Template engine selection via `engine` option
- [x] Complex template logic support

### Enhanced Secrets Management

- [ ] HashiCorp Vault integration
- [ ] AWS Secrets Manager integration
- [ ] Infisical integration
- [ ] 1Password integration
- [ ] Secrets provider extensibility

### DX Enhancements

- [ ] Smart Configuration Inheritance
- [ ] `extendConfig()` function
- [ ] Base configuration sharing
- [ ] Live Development Mode (`axogen dev`)
- [ ] Watch mode with auto-regeneration
- [ ] Preview mode web interface
- [ ] Configuration dependency graph

### Advanced Target Options

- [x] `schema` validation option
- [x] `condition` conditional generation
- [x] `generate_meta` metadata comments
- [x] `backup` file backup option
- [x] Template-specific options

### Enhanced CLI Features

- [ ] Verbose mode support
- [x] Working directory context
- [ ] Advanced error handling
- [ ] Progress indicators
- [ ] Interactive prompts

---

## 🔮 Phase 4: Future & Experimental

### Experimental File Formats (Phase 4)

- [ ] **Plist** format (`.plist`) - read & write
- [ ] **Pkl** format (`.pkl`) - output only
- [ ] Format extensibility system

### Advanced DX Features

- [ ] Variable dependencies visualization
- [ ] Configuration validation dashboard
- [ ] Team collaboration features
- [ ] Configuration diffing
- [ ] Rollback capabilities

### Enterprise Features

- [ ] Audit logging
- [ ] Role-based access control
- [ ] Enterprise secrets manager integrations
- [ ] Configuration compliance checking
- [ ] Multi-environment orchestration

---

## 🧪 Testing & Quality Assurance

### Core Testing

- [ ] Unit tests for all configuration variants
- [ ] Integration tests for file format support
- [ ] CLI command testing
- [ ] Security feature testing
- [ ] Error handling validation

### Advanced Testing

- [ ] Template generation testing
- [ ] Secrets manager integration testing
- [ ] Cross-platform compatibility testing
- [ ] Performance benchmarking
- [ ] End-to-end workflow testing

---

## 📚 Documentation & Developer Experience

### Essential Documentation

- [ ] Getting started guide
- [ ] Configuration variants documentation
- [ ] Security best practices guide
- [ ] API reference documentation
- [ ] Migration guides

### Advanced Documentation

- [ ] Template engine guides
- [ ] Secrets management tutorials
- [ ] Enterprise deployment guide
- [ ] Troubleshooting documentation
- [ ] Community examples repository

---

## 🔍 Implementation Priority Notes

**Critical Path Items** (Must have for MVP):

- Security & Safety features (prevent credential leaks)
- Basic configuration variants (1-3)
- Essential file formats (ENV, JSON, YAML)
- Core CLI functionality

**High Value, Lower Risk**:

- Command helpers and orchestration
- Template generation with Nunjucks
- TypeScript support and type safety

**Nice to Have**:

- Additional file formats beyond core 3
- Advanced DX features
- Enterprise features

---

## 📝 Notes

Refer to the full specifications: [Specifications](./specs)
