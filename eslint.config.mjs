import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import prettierPlugin from "eslint-plugin-prettier";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import jest from "eslint-plugin-jest";

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      "**/*.js",
      "**/*.mjs",
      "**/*.json",
      "node_modules",
      "public",
      "styles",
      "coverage",
      "dist",
      "build",
      ".docusaurus",
      "docusaurus.config.ts",
      ".turbo",
      ".claude",
    ],
  },

  // Base recommended rules
  eslint.configs.recommended,

  // TypeScript recommended configs
  ...tseslint.configs.recommendedTypeChecked,

  // Prettier (must be after other configs to override formatting rules)
  prettierConfig,

  // Main config for TypeScript files
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      prettier: prettierPlugin,
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".mts", ".cts", ".tsx", ".d.ts"],
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      // Console is allowed in this project
      "no-console": "off",

      // Disable base rule that conflicts with typescript
      "no-use-before-define": "off",

      // Rules from airbnb-base
      "max-classes-per-file": "error",
      "class-methods-use-this": "error",
      "max-lines": "error",
      "no-param-reassign": "error",
      "no-underscore-dangle": "error",

      // TypeScript rules (from @meltstudio/eslint-config)
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/explicit-function-return-type": "error",
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-misused-promises": [
        "error",
        { checksVoidReturn: false },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE", "PascalCase"],
        },
        {
          selector: "parameter",
          format: ["camelCase"],
          leadingUnderscore: "allow",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
        {
          selector: "enumMember",
          format: ["UPPER_CASE"],
        },
        {
          selector: "property",
          format: null,
        },
        {
          selector: "import",
          format: null,
        },
      ],

      // Import rules
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["src/**/*", "../**/*"],
              message:
                "usage of src/* and ../**/* imports is not allowed, use paths defined in tsconfig",
            },
          ],
        },
      ],

      // Import sorting
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",

      // Prettier
      "prettier/prettier": "error",
    },
  },

  // Jest test files config
  {
    files: [
      "jest.setup.ts",
      "**/__tests__/**/*.ts",
      "**/*.spec.ts",
      "**/*.test.ts",
    ],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/no-disabled-tests": "error",
      "max-lines": "off",
    },
  },
);
