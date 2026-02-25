---
sidebar_position: 4
title: TypeScript Utilities
---

# TypeScript Utilities

config-loader exports several types and utilities for advanced use cases:

```typescript
import c, {
  type SchemaValue, // Infer the resolved config type from a schema
  type SettingsSources, // Type for the sources object passed to load()
  type ExtendedResult, // Return type of loadExtended()
  type NodeTree, // Tree of ConfigNode objects (ExtendedResult.data)
  ConfigNode, // Class representing a resolved value with source metadata
  ConfigNodeArray, // Class representing an array of ConfigNode values
  type RecursivePartial, // Deep partial utility used by the defaults option
  type StandardSchemaV1, // Standard Schema v1 interface for validators
  type ConfigChange, // A single change detected between config reloads
  type ConfigWatcher, // Handle returned by watch() with config and close()
  type WatchOptions, // Options for the watch() method
  maskSecrets, // Create a safe-to-log copy with sensitive values masked
  printConfig, // Format loadExtended() result as a readable table
  diffConfig, // Compare two config objects and return a list of changes
  ConfigLoadError, // Structured error thrown on validation failure
  ConfigFileError, // Error thrown on file parse failure
} from "@meltstudio/config-loader";
```

## `SchemaValue`

The most commonly needed type utility. Infers the plain TypeScript type from a schema definition:

```typescript
const mySchema = {
  port: c.number({ env: "PORT" }),
  db: c.object({ item: { host: c.string(), port: c.number() } }),
};

type MyConfig = SchemaValue<typeof mySchema>;
// { port: number; db: { host: string; port: number } }
```

This is useful when you want to pass the config object to functions that need an explicit type annotation:

```typescript
function startServer(config: MyConfig) {
  // config.port and config.db are fully typed
}
```

## `oneOf` Type Narrowing

When using `oneOf`, `SchemaValue` automatically narrows the type to the union of allowed values:

```typescript
const schema = {
  env: c.string({ oneOf: ["dev", "staging", "prod"] }),
  level: c.number({ oneOf: [0, 1, 2, 3] }),
};

type Config = SchemaValue<typeof schema>;
// { env: "dev" | "staging" | "prod"; level: 0 | 1 | 2 | 3 }
```

## License

Built by [Melt Studio](https://meltstudio.co). Licensed under the [MIT License](https://github.com/MeltStudio/config-loader/blob/main/LICENSE).
