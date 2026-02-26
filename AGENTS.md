# AGENTS.md

This file provides guidance to AI coding agents when working with this repository.

## What This Is

`@meltstudio/config-loader` — a TypeScript library providing a fluent, type-safe API for loading configuration from YAML/JSON/TOML files, `.env` files, environment variables, and CLI arguments into a single typed object. Priority order: CLI > process.env > `.env` files > Config files > Defaults.

## Commands

```bash
pnpm test                # Run Jest tests (verbose)
pnpm test:coverage       # Run tests with coverage report
pnpm build               # Build with tsup (outputs to ./dist)
pnpm lint                # ESLint with --max-warnings=0 --fix
pnpm type-check          # tsc --noEmit
pnpm example:basic       # Run basic example with ts-node
pnpm example:advanced    # Run advanced example with ts-node
```

Run a single test file: `pnpm test -- --testPathPattern=settings`
Run a single test: `pnpm test -- --testNamePattern "test name"`

## Architecture

**Public API** (`src/index.ts`): Exports factory functions `string()`, `number()`, `bool()`, `array()`, `object()`, and `schema()` which return a `SettingsBuilder`. Also exports `printConfig()`, `maskSecrets()`, `diffConfig()`, types, and error classes.

**Build output:** Dual CJS + ESM format via tsup (`--format cjs,esm`). Outputs `index.js` (CJS), `index.mjs` (ESM), `index.d.ts`, `index.d.mts` to `./dist`.

**Core flow:**

1. User defines a schema using option factories → `c.schema({ port: c.number({ env: "PORT" }) })`
2. `SettingsBuilder` (`src/builder/settings.ts`) provides the fluent API and delegates to `Settings`
3. `Settings` (`src/settings.ts`) loads config files, resolves values by priority, validates required fields
4. `fileLoader.ts` reads and parses YAML/JSON/TOML files with caching (each file read once per load). Format is auto-detected from file extension (`.yaml`/`.yml`, `.json`, `.toml`)
5. `envFileLoader.ts` parses `.env` files with line/column tracking
6. Options (`src/option/`) — `OptionBase` (abstract), `PrimitiveOption`, `ArrayOption`, `ObjectOption` — handle per-field value resolution and type coercion
7. `ConfigNode`/`ConfigNodeArray` (`src/nodes/`) represent loaded values with source metadata (including `sensitive` flag)
8. `SchemaValue<T>` (`src/types.ts`) provides compile-time type inference from schema definitions, including `oneOf` type narrowing via phantom types
9. `OptionErrors` (`src/option/errors.ts`) collects warnings/errors; errors throw `ConfigLoadError`

**Watch mode:**

- `watch()` (`src/watcher.ts`) — watches config files for changes, reloads automatically with debouncing
- `diffConfig()` (`src/diffConfig.ts`) — compares two config objects, returns list of changes with sensitive field masking
- File watchers are `.unref()`'d so they don't keep the process alive

**Utilities:**

- `printConfig()` (`src/printConfig.ts`) — formats `loadExtended()` results as a Unicode table; auto-masks `sensitive` fields
- `maskSecrets()` (`src/maskSecrets.ts`) — creates safe-to-log copies of config with `sensitive` values replaced by `"***"`

**Option features (per-field):**

- `required` — field must be present in at least one source
- `env` — maps to an environment variable name
- `cli` — exposes as a CLI argument via Commander
- `defaultValue` — static value or factory function
- `help` — help text for `--help` output
- `sensitive` — marks field for masking in `printConfig()` and `maskSecrets()`
- `oneOf` — restricts to a fixed set of allowed values with compile-time type narrowing
- `validate` — Standard Schema v1 validator (Zod, Valibot, ArkType, or custom)

**Validation pipeline:** resolve value → type coerce → `oneOf` check → `validate` schema. If `oneOf` fails, `validate` is skipped.

**Path aliases** (defined in tsconfig.json and jest.config.js): `@/builder`, `@/nodes/*`, `@/option/*`, `@/settings`, `@/types`, `@/utils`, `@/fileLoader`, `@/envFileLoader`, `@/printConfig`, `@/maskSecrets`, `@/sourceValidation`, `@/watcher`, `@/diffConfig`.

## Testing Conventions

Tests live in `tests/` with mock data in `tests/__mocks__/`. Type-only tests live in `tests/type-tests/`. Tests reset `process.env`/`process.argv` in `beforeEach` and clear `OptionErrors` in `afterEach`. Coverage thresholds are enforced (85% branches, 90% functions/lines/statements).

## Documentation

README.md and docs pages in `docs/` (Docusaurus, 4 pages: Getting Started, Schema API, Loading & Sources, TypeScript Utilities) are the primary documentation. Both should be updated when adding new features. The docs site is deployed to GitHub Pages.
