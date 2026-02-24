# config-loader — Recommendations

## Done

### Error Handling

~~`process.exit(1)` on validation errors is aggressive for a library.~~

**Done:** Replaced with `ConfigLoadError`/`ConfigFileError`. Opt-in `exitOnError` flag preserves old behavior.

### Type Inference (issue #32)

~~`SchemaValue<T>` work needed polish. Enhance type inference for returned value of `Settings.get()`.~~

**Done:** Cleaned up — removed unused `V` type parameter, moved `SchemaValue` to `types.ts`, derived `PrimitiveKind` from `OptionKind`. `Settings.get()` now returns a fully inferred type from the schema. **Close issue #32.**

### ts-paths script (issue #22)

~~Validate real need of ts-paths script.~~

**Done:** Script was removed — tsup handles path resolution. **Close issue #22.**

### v2.0.0 breaking changes (recs #1–#5)

~~1. Fix `PartialyBuiltSettings` typo~~
~~2. Stop exporting internal classes from `src/option/index.ts`~~
~~3. Remove `InvalidValue` from public exports~~
~~4. Remove dead `"any"` from `OptionKind`~~
~~5. Rename `ConfigNode` snake_case properties to camelCase (issue #6)~~

**Done:** All addressed. `PartiallyBuiltSettings` fixed and properly typed. Internal classes not re-exported from `src/index.ts`. `InvalidValue` not publicly accessible. Dead `"any"` kind removed (`"object"` kept — actively used by `c.object()`). `ConfigNode` properties already camelCase (`sourceType`, `variableName`, `argName`).

### YAML file loaded multiple times (rec #15, issue #4)

~~When creating a settings object, the YAML file is re-read from disk for every root-level property.~~

**Done:** Added `Map<string, LoadResult>` cache in `fileLoader.ts`. Each file is read and parsed once; repeated calls return the cached result. `clearFileCache()` is called from `OptionErrors.clearAll()` for test cleanup. **Close issue #4.**

### JSON format support (rec #8, PR #51)

~~Only YAML is supported. JSON files are common enough that their absence is a barrier to adoption.~~

**Done (PR #51):** JSON support added.

### Expose `getExtended()` via `SettingsBuilder` (rec #10, PR #50)

~~`SettingsBuilder` discards the `Settings` instance after `load()`, so extended metadata is inaccessible.~~

**Done (PR #50):** Added `loadExtended()` method to `SettingsBuilder`.

### Line numbers in ConfigNode and errors (rec #19, issue #19)

~~Error messages don't include line numbers from the source file.~~

**Done:** Added `js-yaml-source-map` for YAML source positions. `ConfigNode` has `line`/`column` fields, error messages include `file:line:column`. **Close issue #19.**

### Type-safe default values (rec #17, issue #33)

~~Per-option `defaultValue` allowed type mismatches at compile time.~~

**Done:** `defaultValue` parameter on each option factory is now typed to match its kind.

### Handle invalid YAML/JSON files gracefully (rec #18, issue #39)

~~Invalid syntax threw unhandled parser exceptions.~~

**Done:** `yaml.load()` and `JSON.parse()` wrapped in try/catch, throwing `ConfigFileError` with file path and parse error details.

---

## Future improvements (non-breaking)

### 6. Object Option (issue #9)

`c.object()` is implemented and works for flat sub-objects. Potential enhancements:
- Mark an entire object group as `required` (today you mark individual leaves)
- Bind a whole sub-object to an `env` source (e.g., parse a JSON env var into a nested structure)
- Give an entire sub-tree a `defaultValue` as one unit

### 7. Validation Beyond `required`

The only validation today is required/optional. Real-world configs need more: value ranges, string patterns, allowed values, custom validators.

**Suggestion:** Add common validators — `min`/`max` for numbers, `enum` for constrained strings, `pattern` for regex, and a generic `validate` callback.

### 8. `.env` File Support

JSON support added (PR #51). `.env` file support still TODO.

### 9. Documentation

MkDocs is set up but needs fleshing out. The existing `example/` is a solid starting point.

**Suggestion:** Add real-world scenarios — multi-environment setups, CLI tool configuration, microservice config patterns.

### 16. OptionErrors should not be static (issue #5)

`OptionErrors` uses static properties, which is an antipattern that breaks test independence, prevents multiple concurrent config loads, and limits flexibility. The `ConfigLoadError` work partially addresses this for consumers (errors are now captured in the thrown error), but internally `OptionErrors` is still static mutable state that must be manually cleared.

**Suggestion:** Make `OptionErrors` an instance passed through the loading pipeline. This is a significant refactor but would improve testability and enable concurrent config loading.

### 14. Reduce remaining `eslint-disable` comments

After the ESLint 9 migration (PR #53), there are still `eslint-disable` comments across the codebase. Most are in legitimate use (recursive types, abstract-like methods), but some could be eliminated:

**`src/settings.ts`**
- 1× `max-lines` — could be reduced by extracting file-loading and value-resolution into separate modules

**`src/option/base.ts`**
- 1× `max-lines` — extractable: the file-reading/YAML-parsing logic in `getValFromFile` could live in a utility
- 2× `class-methods-use-this` — `checkNumberType` and `buildArrayOption` are designed for subclass override; legitimate
- 1× `no-empty-object-type` — `Value` interface extends `ConfigFileData`; legitimate
- 1× `no-unused-vars` — `_val` parameter in base `buildArrayOption`; legitimate (abstract-like method)

**`src/types.ts`**
- 1× `no-empty-object-type` — recursive `ConfigFileData` interface; legitimate pattern
- 1× `no-explicit-any` — `ArrayValue = Array<any>`; could potentially be narrowed

**`src/errors.ts`**
- 1× `max-classes-per-file` — `ConfigLoadError` and `ConfigFileError` in one file; legitimate, closely related

---

## Dependencies

### 11. Major version bumps (larger effort)

These are behind by multiple major versions and would require migration work:

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| `commander` | 8.x | 14.x | Runtime dep — check for breaking API changes |
| `@types/jest` | 27.x | 30.x | Tied to Jest version |
| `@types/node` | 17.x | 25.x | Pinned, not ranged — intentional? |
| `prettier` | 2.x | 3.x | Changes `trailingComma` default to `"all"`, adds trailing commas to multi-line TS generics (not configurable). Requires `eslint-plugin-prettier@5`. Will cause formatting churn. |
| `husky` | 8.x | 9.x | Config format changed in v9 |
| `tsup` | 6.x | 8.x | Build tool — test thoroughly |
| `lint-staged` | 13.x | 16.x | Check for config format changes |
| `globby` | 13.x | 16.x | ESM-only in later versions — may need careful handling |

**Suggestion:** `commander` 8→14 is the most impactful since it's a runtime dependency. Prettier 2→3 and Husky 8→9 can be done independently. ESLint 9 migration is done (PR #53).

### 12. `@types/node` pinned to 17

`@types/node` is pinned to `17.0.31` (not a range). This is Node 17 types, but the project targets Node 18+. Should be updated to `^18.0.0` or `^20.0.0` to match the target runtime.
