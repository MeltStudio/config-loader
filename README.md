# @meltstudio/config-loader

A type-safe configuration loader for Node.js. Define your schema once, load from YAML, JSON, or TOML files, `.env` files, environment variables, and CLI arguments — and get a fully typed result with zero manual type annotations.

> **Upgrading from v1?** v1.x is deprecated. v2 includes breaking changes to the public API, object schema syntax, and requires Node.js >= 20. Install the latest version with `npm install @meltstudio/config-loader@latest` or `yarn add @meltstudio/config-loader@latest`.

**[Full documentation](https://meltstudio.github.io/config-loader/)**

## Why config-loader?

Most config libraries give you `Record<string, unknown>` and leave you to cast or validate manually. config-loader infers TypeScript types directly from your schema definition:

```typescript
import c from "@meltstudio/config-loader";

const config = c
  .schema({
    port: c.number({ required: true, env: "PORT" }),
    host: c.string({ env: "HOST", defaultValue: "localhost" }),
    env: c.string({
      env: "NODE_ENV",
      defaultValue: "development",
      oneOf: ["development", "staging", "production"],
    }),
    apiKey: c.string({ env: "API_KEY", sensitive: true }),
    database: c.object({
      item: {
        host: c.string({ required: true }),
        password: c.string({ env: "DB_PASSWORD", sensitive: true }),
      },
    }),
  })
  .load({
    env: true,
    args: true,
    files: "./config.yaml",
    envFile: "./.env",
  });

// config is fully typed — no `as` casts, no separate interfaces
```

## Features

- **Full type inference** — schema definition produces typed output automatically
- **Multiple sources** — YAML, JSON, TOML files, `.env` files, environment variables, CLI arguments
- **Priority resolution** — CLI > process.env > `.env` files > Config files > Defaults
- **`.env` file support** — load environment variables from `.env` files with automatic line tracking
- **Nested objects and arrays** — deeply nested configs with full type safety
- **Structured errors** — typed `ConfigLoadError` with per-field error details and warnings
- **Enum constraints** — restrict values to a fixed set with `oneOf`, with full type narrowing
- **Sensitive fields** — mark fields with `sensitive: true` to auto-mask in `printConfig()` and `maskSecrets()`
- **Schema validation** — optional per-field validation via [Standard Schema](https://github.com/standard-schema/standard-schema) (Zod, Valibot, ArkType, or custom)
- **Strict mode** — promote warnings to errors for production safety
- **Default values** — static or computed (via functions)
- **Multiple files / directory loading** — load from a list of files or an entire directory

## Installation

```bash
npm install @meltstudio/config-loader
```

```bash
yarn add @meltstudio/config-loader
```

Requires Node.js >= 20.

## Documentation

See the **[full documentation](https://meltstudio.github.io/config-loader/)** for:

- [Schema API](https://meltstudio.github.io/config-loader/schema-api) — primitives, objects, arrays, `oneOf`, `sensitive`, validation
- [Loading & Sources](https://meltstudio.github.io/config-loader/loading-and-sources) — `load()`, `loadExtended()`, file/env/CLI/.env sources, `printConfig()`, `maskSecrets()`, error handling, strict mode
- [TypeScript Utilities](https://meltstudio.github.io/config-loader/typescript-utilities) — `SchemaValue`, exported types, type narrowing

## Documentation for AI Agents

This project provides machine-readable documentation for AI coding agents at the docs site:

- **[llms.txt](https://meltstudio.github.io/config-loader/llms.txt)** — structured index of documentation pages
- **[llms-full.txt](https://meltstudio.github.io/config-loader/llms-full.txt)** — full documentation in a single Markdown file

These files follow the [llms.txt standard](https://llmstxt.org/) and are generated automatically at build time. They are designed to be consumed by AI tools like Claude Code, Cursor, GitHub Copilot, and other LLM-based development assistants.

## License

Built by [Melt Studio](https://meltstudio.co). Licensed under the [MIT License](./LICENSE).
