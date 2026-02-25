# @meltstudio/config-loader

A type-safe configuration loader for Node.js. Define your schema once, load from YAML or JSON files, `.env` files, environment variables, and CLI arguments — and get a fully typed result with zero manual type annotations.

> **Upgrading from v1?** v1.x is deprecated. v2 includes breaking changes to the public API, object schema syntax, and requires Node.js >= 20. Install the latest version with `npm install @meltstudio/config-loader@latest` or `yarn add @meltstudio/config-loader@latest`.

**[Full documentation](https://meltstudio.github.io/config-loader/)**

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
            password: c.string({ env: "DB_PASSWORD" }),
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
- **Multiple sources** — YAML files, JSON files, `.env` files, environment variables, CLI arguments
- **Priority resolution** — CLI > process.env > `.env` files > Config files > Defaults
- **`.env` file support** — load environment variables from `.env` files with automatic line tracking
- **Nested objects and arrays** — deeply nested configs with full type safety
- **Structured errors** — typed `ConfigLoadError` with per-field error details instead of `process.exit(1)`
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

## Schema API

### Primitives

```typescript
c.string({
  required: true,
  env: "MY_VAR",
  cli: true,
  defaultValue: "fallback",
});
c.number({ required: true, env: "PORT" });
c.bool({ env: "DEBUG", defaultValue: false });
```

### Objects

Use `c.object()` to declare nested object schemas:

```typescript
c.object({
  item: {
    host: c.string(),
    port: c.number(),
  },
});
```

Objects can be nested arbitrarily deep:

```typescript
c.schema({
  database: c.object({
    item: {
      host: c.string(),
      port: c.number(),
      credentials: c.object({
        item: {
          username: c.string(),
          password: c.string({ env: "DB_PASSWORD" }),
        },
      }),
    },
  }),
});
```

`c.object()` accepts a `required` option (defaults to `false`). When the entire subtree is absent from all sources, child `required` options will trigger errors through normal validation.

### Arrays

```typescript
c.array({ required: true, item: c.string() }); // string[]
c.array({ required: true, item: c.number() }); // number[]
c.array({
  item: c.object({
    item: { name: c.string(), age: c.number() },
  }),
}); // { name: string; age: number }[]
```

## Loading Sources

```typescript
.load({
  env: true,          // Read from process.env
  args: true,         // Read from CLI arguments (--database.port 3000)
  files: "./config.yaml",                    // Single YAML file
  files: "./config.json",                    // Single JSON file
  files: ["./base.yaml", "./overrides.json"], // Mix YAML and JSON (first takes priority)
  dir: "./config.d/",                        // All files in a directory (sorted)
  envFile: "./.env",                         // Single .env file
  envFile: ["./.env", "./.env.local"],       // Multiple .env files (later overrides earlier)
  defaults: { port: 3000 },                  // Programmatic defaults
})
```

Both YAML (`.yaml`, `.yml`) and JSON (`.json`) files are supported. The format is detected automatically from the file extension.

**Priority order:** CLI arguments > `process.env` > `.env` files > Config files > Defaults

## Extended Loading (Source Metadata)

Use `loadExtended()` instead of `load()` to get each value wrapped in a `ConfigNode` that includes source metadata — where the value came from, which file, environment variable, or CLI argument provided it.

```typescript
import c from "@meltstudio/config-loader";

const { data, warnings } = c
  .schema({
    port: c.number({ required: true, env: "PORT" }),
    host: c.string({ defaultValue: "localhost" }),
  })
  .loadExtended({
    env: true,
    args: false,
    files: "./config.yaml",
  });

// `warnings` is a string[] of non-fatal issues (e.g. type coercions, unused env mappings)
if (warnings.length > 0) {
  warnings.forEach((w) => console.warn(w));
}

// Each leaf in `data` is a ConfigNode with:
// {
//   value: 3000,
//   path: "port",
//   sourceType: "env" | "envFile" | "file" | "args" | "default",
//   file: "./config.yaml" | "./.env" | null,
//   variableName: "PORT" | null,
//   argName: null,
//   line: 5 | null,      // source line (1-based) for YAML, JSON, and .env files; null for env/args/default
//   column: 3 | null      // source column (1-based) for YAML, JSON, and .env files; null for env/args/default
// }
console.log(data.port.value); // 3000
console.log(data.port.sourceType); // "env"
console.log(data.port.variableName); // "PORT"
```

This is useful for debugging configuration resolution, building admin UIs that show where each setting originated, or auditing which sources are active.

## Error Handling

When validation fails, config-loader throws a `ConfigLoadError` with structured error details:

```typescript
import c, { ConfigLoadError } from "@meltstudio/config-loader";

try {
  const config = c.schema({ port: c.number({ required: true }) }).load({
    env: false,
    args: false,
    files: "./config.yaml",
  });
} catch (err) {
  if (err instanceof ConfigLoadError) {
    for (const entry of err.errors) {
      console.error(`[${entry.kind}] ${entry.message}`);
      // e.g. [required] Required option 'port' not provided.
    }
  }
}
```

Warnings (non-fatal issues like type coercions) are never printed to the console. Use `loadExtended()` to access them, or they are included in `ConfigLoadError.warnings` when errors occur.

### Strict Mode

Enable `strict: true` to promote all warnings to errors, causing `ConfigLoadError` to be thrown for any ambiguous or lossy configuration:

```typescript
.load({
  env: true,
  args: false,
  files: "./config.yaml",
  strict: true,
})
```

This is useful in production environments where you want to catch type coercions, null values, and other ambiguous config early rather than silently accepting them.

## CLI Arguments

Set `cli: true` on an option to allow overriding via command line:

```typescript
c.schema({
  version: c.string({ required: true, cli: true }),
});
```

```bash
node app.js --version 2.0.0
```

## Environment Variables

Set `env: "VAR_NAME"` on an option and `env: true` in the load options:

```typescript
c.schema({
  database: c.object({
    item: {
      password: c.string({ env: "DB_PASSWORD" }),
    },
  }),
}).load({ env: true, args: false, files: "./config.yaml" });
```

## `.env` File Support

Load environment variables from `.env` files using the `envFile` option. Options with an `env` mapping automatically pick up values from `.env` files — no new syntax needed on individual fields.

**.env:**

```bash
DB_HOST=localhost
DB_PORT=5432
DB_PASSWORD="s3cret"
APP_NAME='My App'
# This is a comment
```

**Usage:**

```typescript
const config = c
  .schema({
    host: c.string({ env: "DB_HOST" }),
    port: c.number({ env: "DB_PORT" }),
    password: c.string({ env: "DB_PASSWORD" }),
  })
  .load({
    env: true,
    args: false,
    envFile: "./.env",
  });
```

`process.env` always takes precedence over `.env` file values. This means you can use `.env` files for development defaults while overriding them in production via real environment variables.

**Multiple `.env` files:**

```typescript
.load({
  env: true,
  args: false,
  envFile: ["./.env", "./.env.local"],  // .env.local overrides .env
})
```

When using multiple files, later files override earlier ones for the same key.

The `.env` parser supports:

- `KEY=VALUE` pairs (whitespace trimmed)
- Comments (lines starting with `#`)
- Quoted values (double `"..."` or single `'...'` quotes stripped)
- Empty values (`KEY=`)

When using `loadExtended()`, values from `.env` files have `sourceType: "envFile"` with `file`, `line`, and `column` metadata pointing to the `.env` file location.

## License

This package is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.
