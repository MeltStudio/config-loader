## [2.0.1](https://github.com/MeltStudio/config-loader/compare/v2.0.0...v2.0.1) (2026-02-24)


### Bug Fixes

* **ci:** use GITHUB_TOKEN for docs deployment instead of PAT ([80cfbf2](https://github.com/MeltStudio/config-loader/commit/80cfbf233f21fdb9d991f2cb4c97ec7f41b33f2e)), closes [#pages](https://github.com/MeltStudio/config-loader/issues/pages)

# [2.0.0](https://github.com/MeltStudio/config-loader/compare/v1.1.0...v2.0.0) (2026-02-24)

- feat!: remove dead "any" and "object" option kinds ([1b84afa](https://github.com/MeltStudio/config-loader/commit/1b84afa46932e8e8dd9ffed879a87f3219ebd226))
- refactor!: clean up public API surface and update README ([b94f7f6](https://github.com/MeltStudio/config-loader/commit/b94f7f6c90d4754fa97531608cd7228791647251))

### Bug Fixes

- **ci:** add @semantic-release/npm@13 as extra plugin for OIDC support ([f5e5789](https://github.com/MeltStudio/config-loader/commit/f5e57899ef6972983033ec09a5c33b03f1035b7b))
- **ci:** modernize semantic-release and GitHub Actions setup ([402c0e6](https://github.com/MeltStudio/config-loader/commit/402c0e694a3a9d7dacb19c9776a079df3caf84e9))
- **ci:** replace cycjimmy action with direct npx semantic-release ([ba12872](https://github.com/MeltStudio/config-loader/commit/ba128725ae0793688f3d61a812ff0dc11e85b0f0))
- **ci:** specify semantic-release v25 for npm OIDC support ([8c453c4](https://github.com/MeltStudio/config-loader/commit/8c453c4dae22957c9f45c2eea6cbae0eb7ada2f2))
- **ci:** update release workflow to Node 20 ([c9aaa0b](https://github.com/MeltStudio/config-loader/commit/c9aaa0bf2ce6438a3f3e61c62b0863bc359d407f))
- **ci:** update release workflow to Node 20 and restore rimraf ([084ed31](https://github.com/MeltStudio/config-loader/commit/084ed311837d9149c2cf75c9f6bb88e76ea66c71))
- handle invalid YAML/JSON files with ConfigFileError ([3cbadf7](https://github.com/MeltStudio/config-loader/commit/3cbadf79fecdd028fc733a93f1286cf1050773a2)), closes [#39](https://github.com/MeltStudio/config-loader/issues/39)
- resolve skipped tests and rename underscore-prefixed test variables ([d32ffd6](https://github.com/MeltStudio/config-loader/commit/d32ffd6d11376eeea630f67697058b00958bc464))
- resolve type errors in Settings.buildOption signature ([c5a42b1](https://github.com/MeltStudio/config-loader/commit/c5a42b1c41fedfc127bf8fcd7227cb7406dab80a))

### Features

- add .env file support with line number tracking ([f72a96a](https://github.com/MeltStudio/config-loader/commit/f72a96a2a892ab07fc92eefafbc6d5d811d392d4))
- add JSON config file support ([c5df32e](https://github.com/MeltStudio/config-loader/commit/c5df32e47b0922705ae774c43f125461a2b1c19d))
- add YAML line/column metadata to ConfigNode and error messages ([3b7651b](https://github.com/MeltStudio/config-loader/commit/3b7651b8afb50d3edae89d79b00b95a830238fa9))
- **eslint:** restore dropped rules from airbnb and meltstudio configs ([ee4d674](https://github.com/MeltStudio/config-loader/commit/ee4d67433f1478d6a3b950a97c01ef1c7a13ae72))
- expose getExtended() via SettingsBuilder.loadExtended() ([eb6b79f](https://github.com/MeltStudio/config-loader/commit/eb6b79f9e3b2111db0736ce527bb31acc5f1b039))
- replace process.exit(1) with typed ConfigLoadError ([4c40184](https://github.com/MeltStudio/config-loader/commit/4c401843d7ed58e376553296b14f69db74810e46))
- setup type inference for generated data loaded from files and for default values ([a419c5b](https://github.com/MeltStudio/config-loader/commit/a419c5b7ddb2bc41f0704ed39f4244f229b8544b))
- type-safe defaultValue for option factories ([7d7b53c](https://github.com/MeltStudio/config-loader/commit/7d7b53c512dec24d1e71d19c343d4a6a6342e37a))

### Performance Improvements

- cache parsed YAML/JSON config files to avoid redundant disk reads ([cdda2dc](https://github.com/MeltStudio/config-loader/commit/cdda2dcadc4363e3edfc35f48bea4c2cb21c0f85))

### BREAKING CHANGES

- The "any" and "object" values have been removed from OptionKind.
  These were unused internally and never exposed via the public API factories.
  Also removes the associated dead code paths and test cases.
- ConfigNode properties renamed from snake_case to camelCase
  (source_type -> sourceType, variable_name -> variableName, arg_name -> argName).
  PartialyBuiltSettings type removed from exports. DefaultValue and Value types
  no longer exported from option module.

# [1.1.0](https://github.com/MeltStudio/config-loader/compare/v1.0.4...v1.1.0) (2023-06-30)

### Features

- simplified public api for creating schema and loading settings ([94ecb60](https://github.com/MeltStudio/config-loader/commit/94ecb601b72491bb8085cfc4078828d52a2032dd))

## [1.0.4](https://github.com/MeltStudio/config-loader/compare/v1.0.3...v1.0.4) (2023-06-22)

### Bug Fixes

- accept arrays and functions that return arrays as default values ([2d80ebf](https://github.com/MeltStudio/config-loader/commit/2d80ebf7b7d8b6b8b5e7782943ff45e2a3f376b1))

## [1.0.3](https://github.com/MeltStudio/config-loader/compare/v1.0.2...v1.0.3) (2023-06-20)

### Bug Fixes

- sort file names when specifying a directory, to ensure consistency among platforms. fixes [#23](https://github.com/MeltStudio/config-loader/issues/23) ([730f723](https://github.com/MeltStudio/config-loader/commit/730f7234efb8a14c019f4214cdffbc06cb64031b))

## [1.0.2](https://github.com/MeltStudio/config-loader/compare/v1.0.1...v1.0.2) (2023-06-20)

### Bug Fixes

- allow unknown args in CLI, fixes [#26](https://github.com/MeltStudio/config-loader/issues/26) ([#27](https://github.com/MeltStudio/config-loader/issues/27)) ([5e349d5](https://github.com/MeltStudio/config-loader/commit/5e349d50fc35987c3375f2ab817561faf7479f56))

## [1.0.1](https://github.com/MeltStudio/config-loader/compare/v1.0.0...v1.0.1) (2023-06-13)

### Bug Fixes

- added build steps to workflow to allow for dist folder distribution ([e77b4c3](https://github.com/MeltStudio/config-loader/commit/e77b4c379311cb047d79df41e2ddc2901938821a))
- Adjusted the license mentioned in the package.json ([bb2c1e7](https://github.com/MeltStudio/config-loader/commit/bb2c1e72133c46ef71bfc349795bb0088930dfdb))
- removed replace-tspaths folder and script, because tsup makes it unnecessary and because it broke the pipeline ([2a22b1e](https://github.com/MeltStudio/config-loader/commit/2a22b1ec6eaa7a837b5475f2a2b45c53e46fd5e0))

# 1.0.0 (2023-06-09)

### Bug Fixes

- correctly process recursively arrays and objects by disabling ObjectOption ([#10](https://github.com/MeltStudio/config-loader/issues/10)) ([12771aa](https://github.com/MeltStudio/config-loader/commit/12771aaf7ced45d71e903b4fef4390216634c138))
- load string arrays ([ae992f5](https://github.com/MeltStudio/config-loader/commit/ae992f59a4a075050be5af28b4c821c40deb33bc))
- runs without array ([4b654c8](https://github.com/MeltStudio/config-loader/commit/4b654c81ff5176e4aba22df2b970c3f95b62dd1f))
- update readme and add example ([8001fef](https://github.com/MeltStudio/config-loader/commit/8001fef821b826f3744ee9209e091d0369101828))
- update test command ([51df048](https://github.com/MeltStudio/config-loader/commit/51df048168cd20e1c4a9fd5709290dd250c708c7))
- working without type validation ([c676ffb](https://github.com/MeltStudio/config-loader/commit/c676ffb101ccd3435374a44e1b16a29f7d15c355))
