# Contributing to @meltstudio/config-loader

Thank you for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/MeltStudio/config-loader.git
cd config-loader
yarn install
```

## Development Commands

```bash
yarn test           # Run all tests (Jest, verbose)
yarn lint           # ESLint with --max-warnings=0 --fix
yarn type-check     # TypeScript type checking (tsc --noEmit)
yarn build          # Build to dist/ with tsup (includes .d.ts)
yarn example:run    # Run the example app
yarn docs:start     # Start Docusaurus dev server
yarn docs:build     # Build docs site
```

Run a single test file:

```bash
npx jest tests/settings.spec.ts
```

Run a single test by name:

```bash
npx jest --testNamePattern "should validate string options"
```

## Making Changes

1. Create a branch from `main`
2. Write tests first (in `tests/`)
3. Implement your changes (in `src/`)
4. Update `README.md` and `docs/intro.md` if user-facing
5. Run `yarn build` and verify the types in `dist/index.d.ts`
6. All checks must pass: `yarn test && yarn lint && yarn type-check`

## Project Structure

```
src/
├── index.ts           # Public API — factory functions (string, number, bool, array, object, schema)
├── types.ts           # Type definitions, SchemaValue inference, StandardSchemaV1
├── errors.ts          # ConfigLoadError, ConfigErrorEntry
├── settings.ts        # Settings orchestrator — loads files, resolves values, checks errors
├── fileLoader.ts      # YAML/JSON file parsing with caching
├── envFileLoader.ts   # .env file parsing
├── sourceValidation.ts# File/dir validation
├── utils.ts           # Shared utilities
├── builder/
│   └── settings.ts    # SettingsBuilder — fluent API (load, loadExtended)
├── nodes/
│   ├── configNode.ts  # ConfigNode — value + source metadata
│   └── configNodeArray.ts
└── option/
    ├── base.ts        # OptionBase — value resolution, type coercion, validation
    ├── primitive.ts   # PrimitiveOption (string, number, boolean)
    ├── array.ts       # ArrayOption
    ├── object.ts      # ObjectOption
    ├── arrayOption.ts # ArrayValueContainer
    └── errors.ts      # OptionErrors collector

tests/               # Jest tests with mocks in __mocks__/
docs/                # Docusaurus documentation (intro.md)
example/             # Example app
```

## Path Aliases

The project uses TypeScript path aliases defined in `tsconfig.json`:

- `@/builder` → `src/builder`
- `@/option/*` → `src/option/*`
- `@/settings` → `src/settings`
- `@/types` → `src/types`
- etc.

## Testing Conventions

- Tests live in `tests/` with mock data in `tests/__mocks__/`
- Tests mock `process.exit`, reset `process.env`/`process.argv` in `beforeEach`
- Clear `OptionErrors` in `afterEach`
- Coverage thresholds are enforced (90% statements, branches, lines, functions)

## Release Process

Releases are fully automated via [semantic-release](https://github.com/semantic-release/semantic-release) on the `main` branch:

- `feat:` commits → minor version bump
- `fix:` commits → patch version bump
- `feat!:` or `BREAKING CHANGE:` → major version bump
- npm publishing and GitHub releases are automatic

## Code Style

- ESLint with `--max-warnings=0` (zero tolerance)
- Prettier via pre-commit hook (Husky + lint-staged)
- Naming: camelCase for variables, PascalCase for types/classes, UPPER_CASE for enum members

## Questions?

Open an issue on [GitHub](https://github.com/MeltStudio/config-loader/issues).
