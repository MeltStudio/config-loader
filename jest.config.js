module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  coveragePathIgnorePatterns: [".*snap$", "/node_modules/", "/dist/"],
  testEnvironment: "node",
  testMatch: ["**/tests/*.spec.ts", "**/tests/**/*.spec.ts"],
  collectCoverageFrom: ["!src/types/**/*.ts", "src/**/*"],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    "^@/errors$": "<rootDir>/src/errors",
    "^@/builder": "<rootDir>/src/builder",
    "^@/builder/(.*)": "<rootDir>/src/builder/$1",
    "^@/nodes/(.*)": "<rootDir>/src/nodes/$1",
    "^@/option$": "<rootDir>/src/option",
    "^@/option/(.*)": "<rootDir>/src/option/$1",
    "^@/settings": "<rootDir>/src/settings",
    "^@/src$": "<rootDir>/src",
    "^@/types$": "<rootDir>/src/types",
    "^@/utils$": "<rootDir>/src/utils",
    "^@/fileLoader$": "<rootDir>/src/fileLoader",
    "^@/envFileLoader$": "<rootDir>/src/envFileLoader",
    "^@/printConfig$": "<rootDir>/src/printConfig",
    "^@/maskSecrets$": "<rootDir>/src/maskSecrets",
    "^@/sourceValidation$": "<rootDir>/src/sourceValidation",
    "^@/watcher$": "<rootDir>/src/watcher",
    "^@/diffConfig$": "<rootDir>/src/diffConfig",
  },
  reporters: [
    "default",
    [
      "jest-html-reporters",
      {
        publicPath: "./coverage/jest-html-reporters",
      },
    ],
  ],
};
