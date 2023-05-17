module.exports = {
  preset: "ts-jest",
  collectCoverage: true,
  coveragePathIgnorePatterns: [".*snap$", "/node_modules/", "/dist/"],
  testEnvironment: "node",
  testMatch: ["**/tests/*.spec.ts", "**/tests/**/*.spec.ts"],
  collectCoverageFrom: ["!src/types/**/*.ts", "src/**/*"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleNameMapper: {
    "^@/src$": "<rootDir>/src",
    "^@/src/(.*)$": "<rootDir>/src/$1",
  },
};
