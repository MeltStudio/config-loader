import { ConfigLoadError } from "@/errors";
import optionFn from "@/src";
import type { StandardSchemaV1 } from "@/types";

/**
 * Helper: creates a Standard Schema v1 validator from a predicate function.
 */
function createValidator<T>(
  predicate: (value: unknown) => boolean,
  message: string,
): StandardSchemaV1<T> {
  return {
    "~standard": {
      version: 1,
      vendor: "test",
      validate(value: unknown) {
        if (predicate(value)) {
          return { value: value as T };
        }
        return { issues: [{ message }] };
      },
    },
  };
}

const FILE = "./tests/__mocks__/fileMock.yaml";

function getLoadError(fn: () => unknown): ConfigLoadError {
  try {
    fn();
  } catch (err) {
    if (err instanceof ConfigLoadError) return err;
    throw err;
  }
  throw new Error("Expected ConfigLoadError to be thrown");
}

describe("Standard Schema validation", () => {
  describe("primitive options", () => {
    it("should pass when validation succeeds", () => {
      const config = optionFn
        .schema({
          number: optionFn.number({
            defaultValue: 3000,
            validate: createValidator<number>(
              (v) => typeof v === "number" && v >= 1 && v <= 65535,
              "must be between 1 and 65535",
            ),
          }),
        })
        .load({ env: false, args: false });

      expect(config.number).toBe(3000);
    });

    it("should throw ConfigLoadError with kind 'validation' when validation fails", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            number: optionFn.number({
              defaultValue: 99999,
              validate: createValidator<number>(
                (v) => typeof v === "number" && v >= 1 && v <= 65535,
                "must be between 1 and 65535",
              ),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]).toMatchObject({
        kind: "validation",
        path: "number",
        message: expect.stringContaining("must be between 1 and 65535"),
      });
    });

    it("should validate after type coercion (env string → number)", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_PORT: "8080" };
      try {
        const config = optionFn
          .schema({
            port: optionFn.number({
              env: "TEST_PORT",
              validate: createValidator<number>(
                (v) => typeof v === "number" && v >= 1 && v <= 65535,
                "must be a valid port",
              ),
            }),
          })
          .load({ env: true, args: false });

        expect(config.port).toBe(8080);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should fail validation on coerced env value", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_PORT: "0" };
      try {
        const err = getLoadError(() =>
          optionFn
            .schema({
              port: optionFn.number({
                env: "TEST_PORT",
                validate: createValidator<number>(
                  (v) => typeof v === "number" && v >= 1,
                  "must be positive",
                ),
              }),
            })
            .load({ env: true, args: false }),
        );

        expect(err.errors).toHaveLength(1);
        expect(err.errors[0].kind).toBe("validation");
      } finally {
        process.env = originalEnv;
      }
    });

    it("should validate string options", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            host: optionFn.string({
              defaultValue: "not-a-url",
              validate: createValidator<string>(
                (v) => typeof v === "string" && v.startsWith("https://"),
                "must start with https://",
              ),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]).toMatchObject({
        kind: "validation",
        message: expect.stringContaining("must start with https://"),
      });
    });

    it("should validate boolean options", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            flag: optionFn.bool({
              defaultValue: false,
              validate: createValidator<boolean>(
                (v) => v === true,
                "must be true",
              ),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });

    it("should collect multiple validation errors from multiple fields", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            port: optionFn.number({
              defaultValue: -1,
              validate: createValidator<number>(
                (v) => typeof v === "number" && v > 0,
                "must be positive",
              ),
            }),
            host: optionFn.string({
              defaultValue: "",
              validate: createValidator<string>(
                (v) => typeof v === "string" && v.length > 0,
                "must not be empty",
              ),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(2);
      expect(err.errors[0].kind).toBe("validation");
      expect(err.errors[1].kind).toBe("validation");
    });

    it("should collect multiple issues from a single validator", () => {
      const multiIssueValidator: StandardSchemaV1<number> = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate() {
            return {
              issues: [{ message: "too small" }, { message: "not even" }],
            };
          },
        },
      };

      const err = getLoadError(() =>
        optionFn
          .schema({
            value: optionFn.number({
              defaultValue: 3,
              validate: multiIssueValidator,
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(2);
      expect(err.errors[0].message).toContain("too small");
      expect(err.errors[1].message).toContain("not even");
    });
  });

  describe("with file sources", () => {
    it("should validate values loaded from a YAML file", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            number: optionFn.number({
              validate: createValidator<number>(
                (v) => typeof v === "number" && v > 9999,
                "must be greater than 9999",
              ),
            }),
          })
          .load({ env: false, args: false, files: FILE }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]).toMatchObject({
        kind: "validation",
        path: "number",
        source: FILE,
      });
    });

    it("should pass validation for valid file values", () => {
      const config = optionFn
        .schema({
          number: optionFn.number({
            validate: createValidator<number>(
              (v) => typeof v === "number" && v > 0,
              "must be positive",
            ),
          }),
        })
        .load({ env: false, args: false, files: FILE });

      expect(config.number).toBe(1);
    });
  });

  describe("without validate option", () => {
    it("should not run any validation when validate is not set", () => {
      const config = optionFn
        .schema({
          number: optionFn.number({ defaultValue: -1 }),
        })
        .load({ env: false, args: false });

      expect(config.number).toBe(-1);
    });
  });

  describe("with loadExtended", () => {
    it("should report validation warnings alongside other warnings", () => {
      const config = optionFn
        .schema({
          number: optionFn.number({
            defaultValue: 42,
            validate: createValidator<number>(
              (v) => typeof v === "number" && v > 0,
              "must be positive",
            ),
          }),
        })
        .loadExtended({ env: false, args: false });

      expect(config.data).toBeDefined();
      expect(config.warnings).toEqual([]);
    });
  });

  describe("with strict mode", () => {
    it("should include validation errors even in strict mode", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            port: optionFn.number({
              defaultValue: -1,
              validate: createValidator<number>(
                (v) => typeof v === "number" && v > 0,
                "must be positive",
              ),
            }),
          })
          .load({ env: false, args: false, strict: true }),
      );

      const validationErrors = err.errors.filter(
        (e) => e.kind === "validation",
      );
      expect(validationErrors).toHaveLength(1);
    });
  });

  describe("async validators", () => {
    it("should throw when validator returns a Promise", () => {
      const asyncValidator: StandardSchemaV1<number> = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate() {
            return Promise.resolve({ value: 42 });
          },
        },
      };

      expect(() =>
        optionFn
          .schema({
            port: optionFn.number({
              defaultValue: 3000,
              validate: asyncValidator,
            }),
          })
          .load({ env: false, args: false }),
      ).toThrow("Async validators are not supported");
    });
  });

  describe("skips validation on missing optional values", () => {
    it("should not validate when optional value is not provided", () => {
      const neverValidValidator: StandardSchemaV1<string> = {
        "~standard": {
          version: 1,
          vendor: "test",
          validate() {
            return { issues: [{ message: "should not be called" }] };
          },
        },
      };

      const config = optionFn
        .schema({
          optional: optionFn.string({
            validate: neverValidValidator,
          }),
        })
        .load({ env: false, args: false });

      // Optional field not provided — validator not invoked, no error
      expect(config.optional).toBeUndefined();
    });
  });
});
