---
sidebar_position: 2
title: Schema API
---

# Schema API

Define your configuration shape using factory functions. Each field accepts options like `required`, `env`, `cli`, `defaultValue`, `sensitive`, `oneOf`, and `validate`.

## Primitives

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

All factory functions can be called with no arguments for optional fields with no special behavior:

```typescript
c.string(); // optional string, no env/cli mapping
c.number(); // optional number
c.bool(); // optional boolean
```

## Objects

Use `c.object()` to declare nested object schemas. Fields must be inside the `item` property:

```typescript
c.object({
  item: {
    host: c.string(),
    port: c.number(),
  },
});
```

:::tip
A common mistake is passing fields directly to `c.object()` instead of wrapping them in `item`:

```typescript
// WRONG — fields are passed directly
c.object({ host: c.string(), port: c.number() });

// CORRECT — fields must be inside `item`
c.object({ item: { host: c.string(), port: c.number() } });
```

:::

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

## Arrays

```typescript
c.array({ required: true, item: c.string() }); // string[]
c.array({ required: true, item: c.number() }); // number[]
c.array({
  item: c.object({
    item: { name: c.string(), age: c.number() },
  }),
}); // { name: string; age: number }[]
```

## Enum Constraints (`oneOf`)

Use `oneOf` to restrict a field to a fixed set of allowed values. The check runs after type coercion and before any `validate` schema:

```typescript
const config = c
  .schema({
    env: c.string({
      env: "NODE_ENV",
      defaultValue: "development",
      oneOf: ["development", "staging", "production"],
    }),
    logLevel: c.number({
      env: "LOG_LEVEL",
      defaultValue: 1,
      oneOf: [0, 1, 2, 3],
    }),
  })
  .load({ env: true, args: false });
```

If a value is not in the allowed set, a `ConfigLoadError` is thrown with `kind: "validation"`.

### Type Narrowing

When `oneOf` is provided, the inferred type is automatically narrowed to the union of the allowed values:

```typescript
const config = c
  .schema({
    env: c.string({ oneOf: ["dev", "staging", "prod"] }),
  })
  .load({ env: false, args: false });

// config.env is typed as "dev" | "staging" | "prod", not string
```

When used with `cli: true`, the `--help` output automatically lists the allowed values.

## Sensitive Fields

Mark fields as `sensitive: true` to prevent their values from being exposed in logs or debug output:

```typescript
const schema = {
  host: c.string({ defaultValue: "localhost" }),
  apiKey: c.string({ env: "API_KEY", sensitive: true }),
  db: c.object({
    item: {
      host: c.string({ defaultValue: "db.local" }),
      password: c.string({ env: "DB_PASS", sensitive: true }),
    },
  }),
};

const config = c.schema(schema).load({ env: true, args: false });
```

Sensitive values load normally — `config.apiKey` returns the real value. The flag only affects the masking utilities [`printConfig()`](./loading-and-sources#printconfig) and [`maskSecrets()`](./loading-and-sources#masksecrets).

## Validation

Add per-field validation using the `validate` option. config-loader accepts any [Standard Schema v1](https://github.com/standard-schema/standard-schema) implementation — including **Zod**, **Valibot**, and **ArkType** — or a custom validator.

Validation runs **after** type coercion, so validators see the final typed value (e.g., the number `3000`, not the string `"3000"` from an env var).

### With Zod

```typescript
import c from "@meltstudio/config-loader";
import { z } from "zod";

const config = c
  .schema({
    port: c.number({
      required: true,
      env: "PORT",
      validate: z.number().min(1).max(65535),
    }),
    host: c.string({
      required: true,
      validate: z.string().url(),
    }),
    env: c.string({
      defaultValue: "development",
      validate: z.enum(["development", "staging", "production"]),
    }),
  })
  .load({ env: true, args: false, files: "./config.yaml" });
```

### With a custom validator

Any object with a `~standard.validate()` method works:

```typescript
const portValidator = {
  "~standard": {
    version: 1,
    vendor: "my-app",
    validate(value: unknown) {
      if (typeof value === "number" && value >= 1 && value <= 65535) {
        return { value };
      }
      return { issues: [{ message: "must be a valid port (1-65535)" }] };
    },
  },
};

c.number({ required: true, env: "PORT", validate: portValidator });
```

### Validation pipeline

The full validation pipeline for each field is: **resolve value → type coerce → `oneOf` check → `validate` schema**. If `oneOf` fails, `validate` is skipped. If type coercion fails, both `oneOf` and `validate` are skipped.
