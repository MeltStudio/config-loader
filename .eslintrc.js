const path = require("path");

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: ["@meltstudio/eslint-config/node-ts"],
  rules: {
    "no-console": "off",
  },
};
