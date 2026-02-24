# @meltstudio/config-loader

A type-safe configuration loader for Node.js. Define your schema once, load from YAML files, environment variables, and CLI arguments — and get a fully typed result with zero manual type annotations.

## Why config-loader?

Most config libraries give you `Record<string, unknown>` and leave you to cast or validate manually. config-loader infers TypeScript types directly from your schema definition:

```typescript
import c from "@meltstudio/config-loader";

const config = c
  .schema({
    port: c.number({ required: true, env: "PORT" }),
    database: {
      host: c.string({ required: true }),
      credentials: {
        username: c.string(),
        password: c.string({ env: "DB_PASSWORD" }),
      },
    },
    features: c.array({
      required: true,
      item: {
        name: c.string(),
        enabled: c.bool(),
      },
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
- **Multiple sources** — YAML files, environment variables, CLI arguments
- **Priority resolution** — CLI > Env > Files > Defaults
- **Nested objects and arrays** — deeply nested configs with full type safety
- **Structured errors** — typed `ConfigLoadError` with per-field error details instead of `process.exit(1)`
- **Default values** — static or computed (via functions)
- **Multiple files / directory loading** — load from a list of files or an entire directory

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
    website: {
      title: c.string({ required: true }),
      url: c.string({
        required: false,
        defaultValue: "www.mywebsite.dev",
      }),
      description: c.string({ required: true }),
      isProduction: c.bool({ required: true }),
    },
    database: {
      host: c.string({ required: true }),
      port: c.number({ required: true }),
      credentials: {
        username: c.string(),
        password: c.string(),
      },
    },
    socialMedia: c.array({
      required: true,
      item: c.string({ required: true }),
    }),
    features: c.array({
      required: true,
      item: {
        name: c.string(),
        enabled: c.bool(),
      },
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

### Arrays

```typescript
c.array({ required: true, item: c.string() }); // string[]
c.array({ required: true, item: c.number() }); // number[]
c.array({ item: { name: c.string(), age: c.number() } }); // { name: string; age: number }[]
```

### Nested objects

Just use plain objects — no wrapper needed:

```typescript
c.schema({
  database: {
    host: c.string(),
    port: c.number(),
    credentials: {
      username: c.string(),
      password: c.string({ env: "DB_PASSWORD" }),
    },
  },
});
```

## Loading Sources

```typescript
.load({
  env: true,          // Read from process.env
  args: true,         // Read from CLI arguments (--database.port 3000)
  files: "./config.yaml",                    // Single file
  files: ["./base.yaml", "./overrides.yaml"], // Multiple files (first takes priority)
  dir: "./config.d/",                        // All files in a directory (sorted)
  defaults: { port: 3000 },                  // Programmatic defaults
})
```

**Priority order:** CLI arguments > Environment variables > Files > Defaults

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

For CLI tools that prefer the old exit-on-error behavior:

```typescript
.load({ env: true, args: true, files: "./config.yaml", exitOnError: true })
```

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
  database: {
    password: c.string({ env: "DB_PASSWORD" }),
  },
}).load({ env: true, args: false, files: "./config.yaml" });
```

## License

This package is licensed under the Apache License 2.0. See the [LICENSE](./LICENSE) file for details.
