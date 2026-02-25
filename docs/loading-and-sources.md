---
sidebar_position: 3
title: Loading & Sources
---

# Loading & Sources

## Loading Config

Call `.load()` on a schema to resolve all values and return a plain typed object:

```typescript
const config = c
  .schema({
    port: c.number({ required: true, env: "PORT", defaultValue: 3000 }),
    host: c.string({ required: true, env: "HOST", defaultValue: "localhost" }),
  })
  .load({ env: true, args: false, files: "./config.yaml" });
```

### Source Options

```typescript
.load({
  env: true,          // Read from process.env
  args: true,         // Read from CLI arguments (--database.port 3000)
  files: "./config.yaml",                    // Single YAML file
  files: "./config.json",                    // Single JSON file
  files: "./config.toml",                    // Single TOML file
  files: ["./base.yaml", "./overrides.json"], // Mix formats (first takes priority)
  dir: "./config.d/",                        // All files in a directory (sorted)
  envFile: "./.env",                         // Single .env file
  envFile: ["./.env", "./.env.local"],       // Multiple .env files (later overrides earlier)
  defaults: { port: 3000 },                  // Programmatic defaults
})
```

YAML (`.yaml`, `.yml`), JSON (`.json`), and TOML (`.toml`) files are supported. The format is detected automatically from the file extension.

### Priority Order

**CLI arguments > `process.env` > `.env` files > Config files > Defaults**

## Config Files

Load from one or more YAML/JSON/TOML files, or from an entire directory:

```typescript
// Single file
.load({ env: false, args: false, files: "./config.yaml" })

// Multiple files (first takes priority)
.load({ env: false, args: false, files: ["./base.yaml", "./overrides.yaml"] })

// All files in a directory (sorted by filename)
.load({ env: false, args: false, dir: "./config.d/" })
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

:::tip
If you set `env: "PORT"` on a field but load with `env: false`, config-loader emits a warning: _"Options [port] have env mappings but env loading is disabled"_. Make sure to set `env: true` when using env mappings.
:::

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

:::tip
`.env` files are **not** loaded by default. You must explicitly pass `envFile` in the load options — setting `env: true` alone only reads `process.env`.
:::

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
//   line: 5 | null,      // source line (1-based) for YAML, JSON, TOML, and .env files
//   column: 3 | null      // source column (1-based) for YAML, JSON, TOML, and .env files
// }
console.log(data.port.value); // 3000
console.log(data.port.sourceType); // "env"
console.log(data.port.variableName); // "PORT"
```

This is useful for debugging configuration resolution, building admin UIs that show where each setting originated, or auditing which sources are active.

## `printConfig`

Use `printConfig()` to format the result of `loadExtended()` as a readable table. Fields marked with [`sensitive: true`](./schema-api#sensitive-fields) are automatically masked.

```typescript
import c, { printConfig } from "@meltstudio/config-loader";

const result = c
  .schema({
    host: c.string({ defaultValue: "localhost" }),
    port: c.number({ env: "PORT" }),
    apiKey: c.string({ env: "API_KEY", sensitive: true }),
  })
  .loadExtended({ env: true, args: true, files: "./config.yaml" });

printConfig(result);
```

Output:

```
┌────────┬───────────┬─────────┬────────────────┐
│ Path   │ Value     │ Source  │ Detail         │
├────────┼───────────┼─────────┼────────────────┤
│ host   │ localhost │ default │                │
│ port   │ 8080      │ env     │ PORT           │
│ apiKey │ ***       │ env     │ API_KEY        │
└────────┴───────────┴─────────┴────────────────┘
```

Options:

- `printConfig(result, { silent: true })` — returns the string without printing to console
- `printConfig(result, { maxValueLength: 30 })` — truncate long values (default: 50)

## `maskSecrets`

Use `maskSecrets()` to create a safe-to-log copy of your config with [`sensitive`](./schema-api#sensitive-fields) values replaced by `"***"`:

```typescript
import c, { maskSecrets } from "@meltstudio/config-loader";

const schema = {
  host: c.string({ defaultValue: "localhost" }),
  apiKey: c.string({ env: "API_KEY", sensitive: true }),
};

// With a plain config from load()
const config = c.schema(schema).load({ env: true, args: false });
console.log(maskSecrets(config, schema));
// { host: "localhost", apiKey: "***" }

// With an extended result from loadExtended()
const result = c.schema(schema).loadExtended({ env: true, args: false });
const masked = maskSecrets(result);
// masked.data contains ConfigNodes with "***" for sensitive values
```

The original config object is never mutated — `maskSecrets()` always returns a new copy.

## Watch Mode

Use `watch()` to automatically reload config when files change. File watchers are `.unref()`'d so they don't prevent the process from exiting.

```typescript
import c from "@meltstudio/config-loader";

const schema = {
  port: c.number({ env: "PORT", defaultValue: 3000 }),
  host: c.string({ env: "HOST", defaultValue: "localhost" }),
  apiKey: c.string({ env: "API_KEY", sensitive: true }),
};

const watcher = c.schema(schema).watch(
  { env: true, args: false, files: "./config.yaml" },
  {
    onChange: (newConfig, oldConfig, changes) => {
      console.log("Config updated:");
      for (const change of changes) {
        console.log(
          `  ${change.path}: ${change.oldValue} → ${change.newValue}`,
        );
      }
    },
    onError: (err) => {
      console.error("Config reload failed:", err.message);
    },
    debounce: 100, // milliseconds (default: 100)
  },
);

// Access the current config at any time
console.log(watcher.config.port);

// Stop watching when done
watcher.close();
```

### How it works

- The initial load happens synchronously — if it fails, `watch()` throws immediately (same as `load()`)
- On file changes, config is reloaded after the debounce interval
- If the reload succeeds and values changed, `onChange` is called with the new config, old config, and a list of changes
- If the reload fails (parse error, validation error), `onError` is called and the previous config is retained
- Sensitive fields are masked with `"***"` in the change list
- `close()` stops all watchers and is idempotent

### `ConfigChange`

Each change in the `changes` array has:

```typescript
interface ConfigChange {
  path: string; // Dot-separated path (e.g. "db.host")
  oldValue: unknown; // Previous value (undefined if added)
  newValue: unknown; // New value (undefined if removed)
  type: "added" | "removed" | "changed";
}
```

### `diffConfig`

You can also use `diffConfig()` directly to compare two config objects:

```typescript
import { diffConfig } from "@meltstudio/config-loader";

const changes = diffConfig(oldConfig, newConfig, schema);
// schema is optional — when provided, sensitive fields are masked
```

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
    // err.warnings contains non-fatal issues
  }
}
```

Warnings (non-fatal issues like type coercions) are never printed to the console. Use `loadExtended()` to access them, or they are included in `ConfigLoadError.warnings` when errors occur.

## Strict Mode

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
