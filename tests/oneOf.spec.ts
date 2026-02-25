import { ConfigLoadError } from "@/errors";
import OptionErrors from "@/option/errors";
import optionFn from "@/src";

afterEach(() => {
  new OptionErrors().clearAll();
});

function getLoadError(fn: () => unknown): ConfigLoadError {
  try {
    fn();
  } catch (e) {
    if (e instanceof ConfigLoadError) return e;
    throw e;
  }
  throw new Error("Expected function to throw");
}

describe("oneOf validation", () => {
  it("should accept a value in the allowed set", () => {
    const config = optionFn
      .schema({
        env: optionFn.string({
          defaultValue: "production",
          oneOf: ["development", "staging", "production"],
        }),
      })
      .load({ env: false, args: false });

    expect(config.env).toBe("production");
  });

  it("should reject a string value not in the allowed set", () => {
    const err = getLoadError(() =>
      optionFn
        .schema({
          env: optionFn.string({
            defaultValue: "debug",
            oneOf: ["development", "staging", "production"],
          }),
        })
        .load({ env: false, args: false }),
    );

    expect(err.errors).toHaveLength(1);
    expect(err.errors[0]).toMatchObject({
      kind: "validation",
      path: "env",
      message: expect.stringContaining("is not one of"),
    });
    expect(err.errors[0].message).toContain("'debug'");
    expect(err.errors[0].message).toContain("'development'");
    expect(err.errors[0].message).toContain("'staging'");
    expect(err.errors[0].message).toContain("'production'");
  });

  it("should accept a number value in the allowed set", () => {
    const config = optionFn
      .schema({
        level: optionFn.number({
          defaultValue: 2,
          oneOf: [0, 1, 2, 3],
        }),
      })
      .load({ env: false, args: false });

    expect(config.level).toBe(2);
  });

  it("should reject a number value not in the allowed set", () => {
    const err = getLoadError(() =>
      optionFn
        .schema({
          level: optionFn.number({
            defaultValue: 5,
            oneOf: [0, 1, 2, 3],
          }),
        })
        .load({ env: false, args: false }),
    );

    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].message).toContain("'5'");
    expect(err.errors[0].message).toContain("is not one of");
  });

  it("should validate after type coercion from env", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NODE_ENV: "production" };
    try {
      const config = optionFn
        .schema({
          env: optionFn.string({
            env: "NODE_ENV",
            oneOf: ["development", "staging", "production"],
          }),
        })
        .load({ env: true, args: false });

      expect(config.env).toBe("production");
    } finally {
      process.env = originalEnv;
    }
  });

  it("should reject an env value not in the allowed set", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, NODE_ENV: "debug" };
    try {
      const err = getLoadError(() =>
        optionFn
          .schema({
            env: optionFn.string({
              env: "NODE_ENV",
              oneOf: ["development", "staging", "production"],
            }),
          })
          .load({ env: true, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].message).toContain("'debug'");
      expect(err.errors[0].source).toBe("NODE_ENV");
    } finally {
      process.env = originalEnv;
    }
  });

  it("should validate coerced number from env string", () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, LOG_LEVEL: "2" };
    try {
      const config = optionFn
        .schema({
          level: optionFn.number({
            env: "LOG_LEVEL",
            oneOf: [0, 1, 2, 3],
          }),
        })
        .load({ env: true, args: false });

      expect(config.level).toBe(2);
    } finally {
      process.env = originalEnv;
    }
  });

  it("should skip validate when oneOf fails", () => {
    const validateCalls: unknown[] = [];
    const mockValidator = {
      "~standard": {
        version: 1 as const,
        vendor: "test",
        validate(value: unknown) {
          validateCalls.push(value);
          return { value };
        },
      },
    };

    const err = getLoadError(() =>
      optionFn
        .schema({
          env: optionFn.string({
            defaultValue: "invalid",
            oneOf: ["a", "b", "c"],
            validate: mockValidator,
          }),
        })
        .load({ env: false, args: false }),
    );

    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].message).toContain("is not one of");
    expect(validateCalls).toHaveLength(0);
  });

  it("should run validate when oneOf passes", () => {
    const validateCalls: unknown[] = [];
    const mockValidator = {
      "~standard": {
        version: 1 as const,
        vendor: "test",
        validate(value: unknown) {
          validateCalls.push(value);
          return { value };
        },
      },
    };

    optionFn
      .schema({
        env: optionFn.string({
          defaultValue: "a",
          oneOf: ["a", "b", "c"],
          validate: mockValidator,
        }),
      })
      .load({ env: false, args: false });

    expect(validateCalls).toEqual(["a"]);
  });

  it("should work with file sources", () => {
    const err = getLoadError(() =>
      optionFn
        .schema({
          test: optionFn.object({
            item: {
              string: optionFn.string({
                required: true,
                oneOf: ["allowed1", "allowed2"],
              }),
            },
          }),
        })
        .load({
          env: false,
          args: false,
          files: "./tests/__mocks__/fileMock.yaml",
        }),
    );

    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].message).toContain("is not one of");
    expect(err.errors[0].message).toContain("'test'");
  });

  it("should append oneOf values to existing help text for CLI", () => {
    // This test exercises the branch where help is already set and oneOf is added
    // We verify the config loads successfully with cli: true, help, and oneOf together
    const config = optionFn
      .schema({
        env: optionFn.string({
          defaultValue: "production",
          cli: true,
          help: "Application environment",
          oneOf: ["development", "staging", "production"],
        }),
      })
      .load({ env: false, args: true });

    expect(config.env).toBe("production");
  });

  it("should not check oneOf when value is not provided and not required", () => {
    const config = optionFn
      .schema({
        env: optionFn.string({
          oneOf: ["a", "b", "c"],
        }),
      })
      .load({ env: false, args: false });

    expect(config.env).toBeUndefined();
  });
});
