import OptionErrors from "@/option/errors";
import optionFn from "@/src";
import { maskSecrets, printConfig } from "@/src";

afterEach(() => {
  new OptionErrors().clearAll();
});

describe("sensitive flag", () => {
  it("should load sensitive values normally", () => {
    const config = optionFn
      .schema({
        host: optionFn.string({ defaultValue: "localhost" }),
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .load({ env: false, args: false });

    expect(config.host).toBe("localhost");
    expect(config.apiKey).toBe("sk-12345");
  });

  it("should set sensitive flag on ConfigNode in extended result", () => {
    const { data } = optionFn
      .schema({
        host: optionFn.string({ defaultValue: "localhost" }),
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .loadExtended({ env: false, args: false });

    expect((data.host as { sensitive: boolean }).sensitive).toBe(false);
    expect((data.apiKey as { sensitive: boolean }).sensitive).toBe(true);
  });

  it("should work with number and boolean types", () => {
    const config = optionFn
      .schema({
        pin: optionFn.number({ defaultValue: 1234, sensitive: true }),
        isAdmin: optionFn.bool({ defaultValue: true, sensitive: true }),
      })
      .load({ env: false, args: false });

    expect(config.pin).toBe(1234);
    expect(config.isAdmin).toBe(true);
  });

  it("should work with env source", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, SECRET_KEY: "my-secret" };
    try {
      const { data } = optionFn
        .schema({
          key: optionFn.string({ env: "SECRET_KEY", sensitive: true }),
        })
        .loadExtended({ env: true, args: false });

      expect((data.key as { sensitive: boolean }).sensitive).toBe(true);
      expect((data.key as { value: string }).value).toBe("my-secret");
    } finally {
      process.env = originalEnv;
    }
  });
});

describe("maskSecrets with ExtendedResult", () => {
  it("should mask sensitive values in extended result", () => {
    const result = optionFn
      .schema({
        host: optionFn.string({ defaultValue: "localhost" }),
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .loadExtended({ env: false, args: false });

    const masked = maskSecrets(result);

    expect((masked.data.host as { value: string }).value).toBe("localhost");
    expect((masked.data.apiKey as { value: string }).value).toBe("***");
  });

  it("should preserve source metadata on masked nodes", () => {
    const result = optionFn
      .schema({
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .loadExtended({ env: false, args: false });

    const masked = maskSecrets(result);
    const node = masked.data.apiKey as {
      value: string;
      sourceType: string;
      sensitive: boolean;
    };

    expect(node.value).toBe("***");
    expect(node.sourceType).toBe("default");
    expect(node.sensitive).toBe(true);
  });

  it("should mask nested sensitive values", () => {
    const result = optionFn
      .schema({
        db: optionFn.object({
          item: {
            host: optionFn.string({ defaultValue: "localhost" }),
            password: optionFn.string({
              defaultValue: "secret",
              sensitive: true,
            }),
          },
        }),
      })
      .loadExtended({ env: false, args: false });

    const masked = maskSecrets(result);
    const db = masked.data.db as Record<string, { value: string }>;

    expect(db.host.value).toBe("localhost");
    expect(db.password.value).toBe("***");
  });

  it("should not mutate the original result", () => {
    const result = optionFn
      .schema({
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .loadExtended({ env: false, args: false });

    maskSecrets(result);

    expect((result.data.apiKey as { value: string }).value).toBe("sk-12345");
  });

  it("should copy warnings", () => {
    const result = optionFn
      .schema({
        host: optionFn.string({ defaultValue: "localhost" }),
      })
      .loadExtended({ env: false, args: false });

    const masked = maskSecrets(result);
    expect(masked.warnings).toEqual(result.warnings);
  });
});

describe("maskSecrets with plain config and schema", () => {
  const schema = {
    host: optionFn.string({ defaultValue: "localhost" }),
    apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
    db: optionFn.object({
      item: {
        host: optionFn.string({ defaultValue: "db.local" }),
        password: optionFn.string({
          defaultValue: "secret",
          sensitive: true,
        }),
      },
    }),
  };

  it("should mask top-level sensitive values", () => {
    const config = optionFn.schema(schema).load({ env: false, args: false });
    const masked = maskSecrets(config as Record<string, unknown>, schema);

    expect(masked.host).toBe("localhost");
    expect(masked.apiKey).toBe("***");
  });

  it("should mask nested sensitive values", () => {
    const config = optionFn.schema(schema).load({ env: false, args: false });
    const masked = maskSecrets(config as Record<string, unknown>, schema);
    const db = masked.db as { host: string; password: string };

    expect(db.host).toBe("db.local");
    expect(db.password).toBe("***");
  });

  it("should not mutate the original config", () => {
    const config = optionFn.schema(schema).load({ env: false, args: false });
    maskSecrets(config as Record<string, unknown>, schema);

    expect(config.apiKey).toBe("sk-12345");
  });

  it("should pass through keys not in schema", () => {
    const config = { host: "localhost", extra: "value" };
    const simpleSchema = {
      host: optionFn.string({ defaultValue: "localhost" }),
    };
    const masked = maskSecrets(config, simpleSchema);

    expect(masked.extra).toBe("value");
  });
});

describe("printConfig with sensitive fields", () => {
  it("should mask sensitive values in table output", () => {
    const result = optionFn
      .schema({
        host: optionFn.string({ defaultValue: "localhost" }),
        apiKey: optionFn.string({ defaultValue: "sk-12345", sensitive: true }),
      })
      .loadExtended({ env: false, args: false });

    const output = printConfig(result, { silent: true });

    expect(output).toContain("localhost");
    expect(output).toContain("***");
    expect(output).not.toContain("sk-12345");
  });

  it("should mask nested sensitive values in table output", () => {
    const result = optionFn
      .schema({
        db: optionFn.object({
          item: {
            host: optionFn.string({ defaultValue: "db.local" }),
            password: optionFn.string({
              defaultValue: "secret123",
              sensitive: true,
            }),
          },
        }),
      })
      .loadExtended({ env: false, args: false });

    const output = printConfig(result, { silent: true });

    expect(output).toContain("db.local");
    expect(output).toContain("***");
    expect(output).not.toContain("secret123");
  });
});
