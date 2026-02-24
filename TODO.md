# TODO

- [x] Close issues #32, #22, #4, #5, #6
- [x] Handle invalid YAML/JSON files gracefully (#39)
- [x] Fix skipped tests and rename test variables (#11, rec #14)
- [x] Type `PartiallyBuiltSettings` properly (rec #1, #14)
- [x] Type per-option `defaultValue` for compile-time safety (#33)
- [x] Stop exporting internal classes (rec #2, v2.0.0) — already not re-exported from src/index.ts
- [x] Remove `InvalidValue` from public exports (rec #3, v2.0.0) — already not re-exported
- [x] Remove dead `OptionKind` values (rec #4, v2.0.0) — PR #70
- [x] Rename `ConfigNode` snake_case props to camelCase (rec #5, #6, v2.0.0) — already camelCase
- [ ] **CRITICAL: Refresh `NPM_TOKEN` GitHub secret** — current token is expired (E401), blocking all npm releases. Generate a new Granular Access Token on npmjs.com and update the `NPM_TOKEN` repo secret.
- [ ] Implement `option.object` with recursive support (#9)
- [ ] Add validators beyond `required` (rec #7)
- [ ] Add `.env` file support (rec #8)
- [ ] Major dependency bumps (rec #11, #12)
- [x] Add line numbers to errors (#19)
- [ ] Flesh out MkDocs documentation (rec #9)
