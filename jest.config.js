const config = require("@meltstudio/jest-config/jest-server.js");

module.exports = {
  ...config,
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
