---
slug: /
sidebar_position: 1
title: Getting Started
---

# @meltstudio/config-loader

A type-safe configuration loader for Node.js. Define your schema once, load from YAML, JSON, or TOML files, `.env` files, environment variables, and CLI arguments — and get a fully typed result with zero manual type annotations.

> **Upgrading from v1?** v1.x is deprecated. v2 includes breaking changes to the public API, object schema syntax, and requires Node.js >= 20. Install the latest version with `npm install @meltstudio/config-loader@latest` or `yarn add @meltstudio/config-loader@latest`.

## Why config-loader?

Most config libraries give you `Record<string, unknown>` and leave you to cast or validate manually. config-loader infers TypeScript types directly from your schema definition:

```typescript
import c from "@meltstudio/config-loader";

const config = c
  .schema({
    port: c.number({ required: true, env: "PORT" }),
    database: c.object({
      item: {
        host: c.string({ required: true }),
        credentials: c.object({
          item: {
            username: c.string(),
            password: c.string({ env: "DB_PASSWORD", sensitive: true }),
          },
        }),
      },
    }),
    features: c.array({
      required: true,
      item: c.object({
        item: {
          name: c.string(),
          enabled: c.bool(),
        },
      }),
    }),
  })
  .load({
    env: true,
    args: true,
    files: "./config.yaml",
  });

// config is fully typed:
// {
//   port: number;
//   database: { host: string; credentials: { username: string; password: string } };
//   features: { name: string; enabled: boolean }[];
// }
```

No separate interface to maintain. No `as` casts. The types flow from the schema.

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

## Requirements

- Node.js >= 20

## Installation

```bash
npm install @meltstudio/config-loader
```

```bash
yarn add @meltstudio/config-loader
```

## Quick Start

**config.yaml:**

```yaml
version: 1.0.0
website:
  title: My Website
  description: A simple and elegant website
  isProduction: false

database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret

socialMedia: [https://twitter.com/example, https://instagram.com/example]

features:
  - name: Store
    enabled: true
  - name: Admin
    enabled: false
```

**index.ts:**

```typescript
import path from "path";
import c from "@meltstudio/config-loader";

const config = c
  .schema({
    version: c.string({ required: true, cli: true }),
    website: c.object({
      item: {
        title: c.string({ required: true }),
        url: c.string({
          required: false,
          defaultValue: "www.mywebsite.dev",
        }),
        description: c.string({ required: true }),
        isProduction: c.bool({ required: true }),
      },
    }),
    database: c.object({
      item: {
        host: c.string({ required: true }),
        port: c.number({ required: true }),
        credentials: c.object({
          item: {
            username: c.string(),
            password: c.string(),
          },
        }),
      },
    }),
    socialMedia: c.array({
      required: true,
      item: c.string({ required: true }),
    }),
    features: c.array({
      required: true,
      item: c.object({
        item: {
          name: c.string(),
          enabled: c.bool(),
        },
      }),
    }),
  })
  .load({
    env: false,
    args: true,
    files: path.join(__dirname, "./config.yaml"),
  });

console.log(JSON.stringify(config, null, 2));
```

Output:

```json
{
  "version": "1.0.0",
  "website": {
    "title": "My Website",
    "url": "www.mywebsite.dev",
    "description": "A simple and elegant website",
    "isProduction": false
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "credentials": {
      "username": "admin",
      "password": "secret"
    }
  },
  "socialMedia": [
    "https://twitter.com/example",
    "https://instagram.com/example"
  ],
  "features": [
    { "name": "Store", "enabled": true },
    { "name": "Admin", "enabled": false }
  ]
}
```
