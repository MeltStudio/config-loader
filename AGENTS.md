# AGENTS.md

This file provides guidance to AI coding agents when working with this repository.

## What This Is

`@meltstudio/config-loader` — a TypeScript library providing a fluent, type-safe API for loading configuration from YAML files, environment variables, and CLI arguments into a single object. Priority order: CLI > Env > Files > Defaults.

## Commands

```bash
yarn test                # Run Jest tests (verbose)
yarn build               # Build with tsup (outputs to ./dist)
yarn lint                # ESLint with --max-warnings=0 --fix
yarn type-check          # tsc --noEmit
yarn example:run         # Run example app with ts-node
```

Run a single test file: `npx jest tests/settings.spec.ts`
Run a single test: `npx jest --testNamePattern "test name"`

## Architecture

**Public API** (`src/index.ts`): Exports factory functions `string()`, `number()`, `bool()`, `array()`, `object()`, and `schema()` which return a `SettingsBuilder`.

**Core flow:**

1. User defines a schema using option factories → `c.schema({ port: c.number({ env: "PORT" }) })`
2. `SettingsBuilder` (`src/builder/settings.ts`) provides the fluent API and delegates to `Settings`
3. `Settings` (`src/settings.ts`) loads config files, resolves values by priority, validates required fields
4. `fileLoader.ts` reads and parses YAML/JSON files with caching (each file read once per load)
5. Options (`src/option/`) — `OptionBase` (abstract), `PrimitiveOption`, `ArrayOption`, `ObjectOption` — handle per-field value resolution and type coercion
6. `ConfigNode`/`ConfigNodeArray` (`src/nodes/`) represent loaded values with source metadata
7. `SchemaValue<T>` (`src/types.ts`) provides compile-time type inference from schema definitions
8. `OptionErrors` (`src/option/errors.ts`) collects warnings/errors; errors throw `ConfigLoadError`

**Path aliases** (defined in tsconfig.json): `@/builder`, `@/nodes/*`, `@/option/*`, `@/settings`, `@/types`, `@/utils`.

## Testing Conventions

Tests live in `tests/` with mock data in `tests/__mocks__/`. Tests mock `process.exit`, reset `process.env`/`process.argv` in `beforeEach`, and clear `OptionErrors` in `afterEach`.
