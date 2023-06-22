## [1.0.4](https://github.com/MeltStudio/config-loader/compare/v1.0.3...v1.0.4) (2023-06-22)


### Bug Fixes

* accept arrays and functions that return arrays as default values ([2d80ebf](https://github.com/MeltStudio/config-loader/commit/2d80ebf7b7d8b6b8b5e7782943ff45e2a3f376b1))

## [1.0.3](https://github.com/MeltStudio/config-loader/compare/v1.0.2...v1.0.3) (2023-06-20)


### Bug Fixes

* sort file names when specifying a directory, to ensure consistency among platforms. fixes [#23](https://github.com/MeltStudio/config-loader/issues/23) ([730f723](https://github.com/MeltStudio/config-loader/commit/730f7234efb8a14c019f4214cdffbc06cb64031b))

## [1.0.2](https://github.com/MeltStudio/config-loader/compare/v1.0.1...v1.0.2) (2023-06-20)


### Bug Fixes

* allow unknown args in CLI, fixes [#26](https://github.com/MeltStudio/config-loader/issues/26) ([#27](https://github.com/MeltStudio/config-loader/issues/27)) ([5e349d5](https://github.com/MeltStudio/config-loader/commit/5e349d50fc35987c3375f2ab817561faf7479f56))

## [1.0.1](https://github.com/MeltStudio/config-loader/compare/v1.0.0...v1.0.1) (2023-06-13)


### Bug Fixes

* added build steps to workflow to allow for dist folder distribution ([e77b4c3](https://github.com/MeltStudio/config-loader/commit/e77b4c379311cb047d79df41e2ddc2901938821a))
* Adjusted the license mentioned in the package.json ([bb2c1e7](https://github.com/MeltStudio/config-loader/commit/bb2c1e72133c46ef71bfc349795bb0088930dfdb))
* removed replace-tspaths folder and script, because tsup makes it unnecessary and because it broke the pipeline ([2a22b1e](https://github.com/MeltStudio/config-loader/commit/2a22b1ec6eaa7a837b5475f2a2b45c53e46fd5e0))

# 1.0.0 (2023-06-09)


### Bug Fixes

* correctly process recursively arrays and objects by disabling ObjectOption ([#10](https://github.com/MeltStudio/config-loader/issues/10)) ([12771aa](https://github.com/MeltStudio/config-loader/commit/12771aaf7ced45d71e903b4fef4390216634c138))
* load string arrays ([ae992f5](https://github.com/MeltStudio/config-loader/commit/ae992f59a4a075050be5af28b4c821c40deb33bc))
* runs without array ([4b654c8](https://github.com/MeltStudio/config-loader/commit/4b654c81ff5176e4aba22df2b970c3f95b62dd1f))
* update readme and add example ([8001fef](https://github.com/MeltStudio/config-loader/commit/8001fef821b826f3744ee9209e091d0369101828))
* update test command ([51df048](https://github.com/MeltStudio/config-loader/commit/51df048168cd20e1c4a9fd5709290dd250c708c7))
* working without type validation ([c676ffb](https://github.com/MeltStudio/config-loader/commit/c676ffb101ccd3435374a44e1b16a29f7d15c355))
