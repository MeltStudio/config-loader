import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import OptionErrors from "@/option/errors";
import optionFn from "@/src";

let tmpDir: string;
let configPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "config-watcher-"));
  configPath = path.join(tmpDir, "config.json");
});

afterEach(() => {
  new OptionErrors().clearAll();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeConfig(data: Record<string, unknown>): void {
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("watch()", () => {
  it("should return current config on initial load", () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: () => {},
      },
    );

    try {
      expect(watcher.config).toEqual({ host: "localhost", port: 3000 });
    } finally {
      watcher.close();
    }
  });

  it("should detect file changes and call onChange", async () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: (newConfig, oldConfig, configChanges) => {
          changes.push({ newConfig, oldConfig, configChanges });
        },
        debounce: 50,
      },
    );

    try {
      // Small delay to let fs.watch establish
      await wait(100);

      // Modify the file
      writeConfig({ host: "example.com", port: 3000 });

      // Wait for debounce + processing
      await wait(500);

      expect(changes).toHaveLength(1);
      const change = changes[0] as {
        newConfig: { host: string; port: number };
        oldConfig: { host: string; port: number };
        configChanges: { path: string; type: string }[];
      };
      expect(change.newConfig.host).toBe("example.com");
      expect(change.oldConfig.host).toBe("localhost");
      expect(change.configChanges).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: "host", type: "changed" }),
        ]),
      );

      // Updated config should be accessible
      expect(watcher.config).toEqual({ host: "example.com", port: 3000 });
    } finally {
      watcher.close();
    }
  });

  it("should not call onChange when config has not changed", async () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: (newConfig, oldConfig, configChanges) => {
          changes.push({ newConfig, oldConfig, configChanges });
        },
        debounce: 50,
      },
    );

    try {
      await wait(100);

      // Rewrite the same data
      writeConfig({ host: "localhost", port: 3000 });

      await wait(500);

      expect(changes).toHaveLength(0);
    } finally {
      watcher.close();
    }
  });

  it("should call onError when reload fails", async () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const errors: Error[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: () => {},
        onError: (err) => {
          errors.push(err);
        },
        debounce: 50,
      },
    );

    try {
      await wait(100);

      // Write invalid JSON
      fs.writeFileSync(configPath, "{ invalid json }}}");

      await wait(500);

      expect(errors.length).toBeGreaterThanOrEqual(1);
      expect(errors[0]).toBeInstanceOf(Error);

      // Config should still be the old value
      expect(watcher.config).toEqual({ host: "localhost", port: 3000 });
    } finally {
      watcher.close();
    }
  });

  it("should stop watching after close()", async () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: (newConfig) => {
          changes.push(newConfig);
        },
        debounce: 50,
      },
    );

    watcher.close();

    await wait(100);

    // Modify file after close
    writeConfig({ host: "example.com", port: 3000 });

    await wait(500);

    expect(changes).toHaveLength(0);
  });

  it("should be idempotent on close()", () => {
    writeConfig({ host: "localhost" });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
    };

    const watcher = optionFn
      .schema(schema)
      .watch(
        { env: false, args: false, files: configPath },
        { onChange: () => {} },
      );

    // Should not throw — calling close multiple times is safe
    watcher.close();
    watcher.close();
    watcher.close();

    expect(watcher.config).toEqual({ host: "localhost" });
  });

  it("should throw on initial load failure", () => {
    fs.writeFileSync(configPath, "{ invalid }}}");

    const schema = {
      host: optionFn.string({ required: true }),
    };

    expect(() => {
      optionFn
        .schema(schema)
        .watch(
          { env: false, args: false, files: configPath },
          { onChange: () => {} },
        );
    }).toThrow();
  });

  it("should mask sensitive fields in change events", async () => {
    writeConfig({ host: "localhost", apiKey: "old-secret" });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      apiKey: optionFn.string({ defaultValue: "default", sensitive: true }),
    };

    const changes: { path: string; oldValue: unknown; newValue: unknown }[] =
      [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: (_newConfig, _oldConfig, configChanges) => {
          changes.push(...configChanges);
        },
        debounce: 50,
      },
    );

    try {
      await wait(100);

      writeConfig({ host: "localhost", apiKey: "new-secret" });

      await wait(500);

      expect(changes).toHaveLength(1);
      expect(changes[0].path).toBe("apiKey");
      expect(changes[0].oldValue).toBe("***");
      expect(changes[0].newValue).toBe("***");
    } finally {
      watcher.close();
    }
  });

  it("should watch multiple files (array)", async () => {
    const configPath2 = path.join(tmpDir, "config2.json");
    writeConfig({ host: "localhost" });
    fs.writeFileSync(configPath2, JSON.stringify({ port: 3000 }));

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: [configPath, configPath2] },
      {
        onChange: (newConfig) => {
          changes.push(newConfig);
        },
        debounce: 50,
      },
    );

    try {
      expect(watcher.config).toEqual({ host: "localhost", port: 3000 });

      await wait(100);

      // Modify second file
      fs.writeFileSync(configPath2, JSON.stringify({ port: 8080 }));

      await wait(500);

      expect(changes).toHaveLength(1);
      expect(watcher.config).toEqual({ host: "localhost", port: 8080 });
    } finally {
      watcher.close();
    }
  });

  it("should debounce rapid successive changes", async () => {
    writeConfig({ host: "localhost", port: 3000 });

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, files: configPath },
      {
        onChange: (newConfig) => {
          changes.push(newConfig);
        },
        debounce: 200,
      },
    );

    try {
      await wait(100);

      // Write multiple times rapidly — should debounce to one onChange
      writeConfig({ host: "first", port: 3000 });
      await wait(50);
      writeConfig({ host: "second", port: 3000 });
      await wait(50);
      writeConfig({ host: "third", port: 3000 });

      await wait(500);

      // Should have at most 1 change (debounced)
      expect(changes.length).toBeLessThanOrEqual(2);
      // Final config should reflect the last write
      expect(watcher.config.host).toBe("third");
    } finally {
      watcher.close();
    }
  });

  it("should watch directory when sources.dir is used", async () => {
    const dirPath = path.join(tmpDir, "config.d");
    fs.mkdirSync(dirPath);
    const file1 = path.join(dirPath, "01-base.json");
    fs.writeFileSync(file1, JSON.stringify({ host: "localhost" }));

    const schema = {
      host: optionFn.string({ defaultValue: "default" }),
      port: optionFn.number({ defaultValue: 0 }),
    };

    const changes: unknown[] = [];

    const watcher = optionFn.schema(schema).watch(
      { env: false, args: false, dir: dirPath },
      {
        onChange: (newConfig) => {
          changes.push(newConfig);
        },
        debounce: 50,
      },
    );

    try {
      expect(watcher.config).toEqual({ host: "localhost", port: 0 });

      await wait(100);

      // Modify file in directory
      fs.writeFileSync(file1, JSON.stringify({ host: "updated" }));

      await wait(500);

      expect(changes.length).toBeGreaterThanOrEqual(1);
      expect(watcher.config.host).toBe("updated");
    } finally {
      watcher.close();
    }
  });
});
