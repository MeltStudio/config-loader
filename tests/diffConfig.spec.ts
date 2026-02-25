import optionFn from "@/src";
import { diffConfig } from "@/src";

describe("diffConfig", () => {
  it("should return empty array for identical configs", () => {
    const a = { host: "localhost", port: 3000 };
    const b = { host: "localhost", port: 3000 };
    expect(diffConfig(a, b)).toEqual([]);
  });

  it("should detect changed primitive values", () => {
    const a = { host: "localhost", port: 3000 };
    const b = { host: "example.com", port: 3000 };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "host",
        type: "changed",
        oldValue: "localhost",
        newValue: "example.com",
      },
    ]);
  });

  it("should detect added keys", () => {
    const a = { host: "localhost" };
    const b = { host: "localhost", port: 3000 };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "port",
        type: "added",
        oldValue: undefined,
        newValue: 3000,
      },
    ]);
  });

  it("should detect removed keys", () => {
    const a = { host: "localhost", port: 3000 };
    const b = { host: "localhost" };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "port",
        type: "removed",
        oldValue: 3000,
        newValue: undefined,
      },
    ]);
  });

  it("should detect changes in nested objects", () => {
    const a = { db: { host: "localhost", port: 5432 } };
    const b = { db: { host: "remote.db", port: 5432 } };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "db.host",
        type: "changed",
        oldValue: "localhost",
        newValue: "remote.db",
      },
    ]);
  });

  it("should detect added keys in nested objects", () => {
    const a = { db: { host: "localhost" } };
    const b = { db: { host: "localhost", port: 5432 } };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "db.port",
        type: "added",
        oldValue: undefined,
        newValue: 5432,
      },
    ]);
  });

  it("should handle identical arrays as no change", () => {
    const a = { tags: ["a", "b", "c"] };
    const b = { tags: ["a", "b", "c"] };
    expect(diffConfig(a, b)).toEqual([]);
  });

  it("should detect changed arrays", () => {
    const a = { tags: ["a", "b"] };
    const b = { tags: ["a", "c"] };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "tags",
        type: "changed",
        oldValue: ["a", "b"],
        newValue: ["a", "c"],
      },
    ]);
  });

  it("should detect multiple changes", () => {
    const a = { host: "localhost", port: 3000, debug: true };
    const b = { host: "example.com", port: 8080, debug: true };
    const changes = diffConfig(a, b);
    expect(changes).toHaveLength(2);
    expect(changes.map((c) => c.path).sort()).toEqual(["host", "port"]);
  });

  it("should handle boolean changes", () => {
    const a = { debug: false };
    const b = { debug: true };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "debug",
        type: "changed",
        oldValue: false,
        newValue: true,
      },
    ]);
  });

  it("should handle null values", () => {
    const a = { value: null } as Record<string, unknown>;
    const b = { value: "something" };
    const changes = diffConfig(a, b);
    expect(changes).toEqual([
      {
        path: "value",
        type: "changed",
        oldValue: null,
        newValue: "something",
      },
    ]);
  });

  describe("sensitive field masking", () => {
    const schema = {
      host: optionFn.string({ defaultValue: "localhost" }),
      apiKey: optionFn.string({ defaultValue: "secret", sensitive: true }),
      db: optionFn.object({
        item: {
          host: optionFn.string({ defaultValue: "localhost" }),
          password: optionFn.string({
            defaultValue: "pass",
            sensitive: true,
          }),
        },
      }),
    };

    it("should mask sensitive changed values", () => {
      const a = {
        host: "localhost",
        apiKey: "old-key",
        db: { host: "localhost", password: "old" },
      };
      const b = {
        host: "localhost",
        apiKey: "new-key",
        db: { host: "localhost", password: "new" },
      };
      const changes = diffConfig(a, b, schema);
      expect(changes).toEqual([
        {
          path: "apiKey",
          type: "changed",
          oldValue: "***",
          newValue: "***",
        },
        {
          path: "db.password",
          type: "changed",
          oldValue: "***",
          newValue: "***",
        },
      ]);
    });

    it("should mask sensitive added values", () => {
      const a = { host: "localhost" } as Record<string, unknown>;
      const b = { host: "localhost", apiKey: "new-key" };
      const changes = diffConfig(a, b, schema);
      expect(changes).toEqual([
        {
          path: "apiKey",
          type: "added",
          oldValue: undefined,
          newValue: "***",
        },
      ]);
    });

    it("should mask sensitive removed values", () => {
      const a = { host: "localhost", apiKey: "old-key" };
      const b = { host: "localhost" } as Record<string, unknown>;
      const changes = diffConfig(a, b, schema);
      expect(changes).toEqual([
        {
          path: "apiKey",
          type: "removed",
          oldValue: "***",
          newValue: undefined,
        },
      ]);
    });

    it("should not mask non-sensitive values", () => {
      const a = { host: "localhost", apiKey: "key" };
      const b = { host: "example.com", apiKey: "key" };
      const changes = diffConfig(a, b, schema);
      expect(changes).toEqual([
        {
          path: "host",
          type: "changed",
          oldValue: "localhost",
          newValue: "example.com",
        },
      ]);
    });
  });

  describe("without schema", () => {
    it("should not mask any values when no schema provided", () => {
      const a = { apiKey: "old" };
      const b = { apiKey: "new" };
      const changes = diffConfig(a, b);
      expect(changes).toEqual([
        {
          path: "apiKey",
          type: "changed",
          oldValue: "old",
          newValue: "new",
        },
      ]);
    });
  });
});
