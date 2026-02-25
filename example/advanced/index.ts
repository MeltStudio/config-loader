import path from "path";

import c, { ConfigLoadError, maskSecrets, printConfig } from "@/src";

/**
 * Advanced example demonstrating:
 * - TOML config files
 * - .env file loading
 * - oneOf enum constraints
 * - sensitive field masking
 * - Custom validation
 * - printConfig() debug table
 * - maskSecrets() for safe logging
 * - Error handling with ConfigLoadError
 * - Watch mode with auto-reload
 */

const portValidator = {
  "~standard": {
    version: 1 as const,
    vendor: "example",
    validate(
      value: unknown,
    ): { value: unknown } | { issues: { message: string }[] } {
      if (typeof value === "number" && value >= 1 && value <= 65535) {
        return { value };
      }
      return { issues: [{ message: "must be a valid port (1-65535)" }] };
    },
  },
};

const schema = {
  host: c.string({ required: true, env: "HOST", cli: true }),
  port: c.number({
    required: true,
    env: "PORT",
    cli: true,
    help: "Server port",
    validate: portValidator,
  }),
  env: c.string({
    env: "NODE_ENV",
    defaultValue: "development",
    oneOf: ["development", "staging", "production"],
  }),
  logLevel: c.number({
    env: "LOG_LEVEL",
    defaultValue: 0,
    oneOf: [0, 1, 2, 3],
  }),
  apiKey: c.string({ env: "API_KEY", sensitive: true }),
  database: c.object({
    item: {
      host: c.string({ required: true }),
      port: c.number({ required: true, validate: portValidator }),
      username: c.string(),
      password: c.string({ sensitive: true }),
    },
  }),
};

try {
  // Load config from TOML file + .env file + environment variables
  const result = c.schema(schema).loadExtended({
    env: true,
    args: true,
    files: path.join(__dirname, "./config.toml"),
    envFile: path.join(__dirname, "./.env"),
  });

  // Print the debug table (sensitive fields are auto-masked)
  console.log("=== Config Debug Table ===\n");
  printConfig(result);

  // Get the plain config values
  const config = c.schema(schema).load({
    env: true,
    args: true,
    files: path.join(__dirname, "./config.toml"),
    envFile: path.join(__dirname, "./.env"),
  });

  // Safe-to-log copy with secrets masked
  console.log("\n=== Safe-to-log config ===\n");
  console.log(JSON.stringify(maskSecrets(config, schema), null, 2));

  // The real values are still accessible
  console.log("\n=== Real values (don't log in production!) ===\n");
  console.log(`env: ${config.env}`);
  console.log(`apiKey: ${config.apiKey}`);
  console.log(`db password: ${config.database.password}`);
  // Watch for config file changes (auto-reloads on save)
  console.log("\n=== Watch mode ===\n");
  const watcher = c.schema(schema).watch(
    {
      env: true,
      args: true,
      files: path.join(__dirname, "./config.toml"),
      envFile: path.join(__dirname, "./.env"),
    },
    {
      onChange: (newConfig, _oldConfig, changes) => {
        console.log("Config reloaded! Changes:");
        for (const change of changes) {
          console.log(
            `  ${change.path}: ${String(change.oldValue)} → ${String(change.newValue)} (${change.type})`,
          );
        }
        console.log(`  New port: ${newConfig.port}`);
      },
      onError: (err) => {
        console.error("Config reload failed:", err.message);
      },
    },
  );

  console.log(
    "Watching config.toml for changes... (edit the file to see auto-reload)",
  );
  console.log("Press Ctrl+C to stop.\n");

  // The watcher uses .unref() internally, so the process will exit naturally
  // if there's nothing else keeping it alive. To keep this demo running,
  // we use a ref'd timeout.
  const keepAlive = setTimeout(() => {
    watcher.close();
    console.log("Watcher closed after 30s timeout.");
  }, 30_000);

  // Clean up on Ctrl+C
  process.on("SIGINT", () => {
    watcher.close();
    clearTimeout(keepAlive);
    console.log("\nWatcher closed.");
    process.exit(0);
  });
} catch (err) {
  if (err instanceof ConfigLoadError) {
    console.error("\n=== Config errors ===\n");
    for (const entry of err.errors) {
      console.error(`  [${entry.kind}] ${entry.path}: ${entry.message}`);
    }
    if (err.warnings.length > 0) {
      console.error("\n=== Warnings ===\n");
      for (const w of err.warnings) {
        console.error(`  ${w}`);
      }
    }
  } else {
    throw err;
  }
}
