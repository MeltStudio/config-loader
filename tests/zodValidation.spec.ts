import { z } from "zod";

import { ConfigLoadError } from "@/errors";
import optionFn from "@/src";

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

describe("Zod integration", () => {
  describe("number validation", () => {
    it("should pass with a valid port number", () => {
      const config = optionFn
        .schema({
          port: optionFn.number({
            defaultValue: 3000,
            validate: z.number().min(1).max(65535),
          }),
        })
        .load({ env: false, args: false });

      expect(config.port).toBe(3000);
    });

    it("should fail when number is out of range", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            port: optionFn.number({
              defaultValue: 99999,
              validate: z.number().min(1).max(65535),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
      expect(err.errors[0].path).toBe("port");
    });

    it("should validate an integer constraint", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            count: optionFn.number({
              defaultValue: 3.14,
              validate: z.number().int(),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });
  });

  describe("string validation", () => {
    it("should pass with a valid email", () => {
      const config = optionFn
        .schema({
          email: optionFn.string({
            defaultValue: "user@example.com",
            validate: z.string().email(),
          }),
        })
        .load({ env: false, args: false });

      expect(config.email).toBe("user@example.com");
    });

    it("should fail with an invalid email", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            email: optionFn.string({
              defaultValue: "not-an-email",
              validate: z.string().email(),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
      expect(err.errors[0].path).toBe("email");
    });

    it("should validate with z.enum()", () => {
      const config = optionFn
        .schema({
          env: optionFn.string({
            defaultValue: "production",
            validate: z.enum(["development", "staging", "production"]),
          }),
        })
        .load({ env: false, args: false });

      expect(config.env).toBe("production");
    });

    it("should fail with an invalid enum value", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            env: optionFn.string({
              defaultValue: "invalid",
              validate: z.enum(["development", "staging", "production"]),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });

    it("should validate a URL", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            url: optionFn.string({
              defaultValue: "not-a-url",
              validate: z.string().url(),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });

    it("should validate min/max length", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            token: optionFn.string({
              defaultValue: "ab",
              validate: z.string().min(8).max(64),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });
  });

  describe("boolean validation", () => {
    it("should pass with a valid boolean", () => {
      const config = optionFn
        .schema({
          debug: optionFn.bool({
            defaultValue: true,
            validate: z.boolean(),
          }),
        })
        .load({ env: false, args: false });

      expect(config.debug).toBe(true);
    });
  });

  describe("coercion before validation", () => {
    it("should validate env string as number after coercion", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_PORT: "8080" };
      try {
        const config = optionFn
          .schema({
            port: optionFn.number({
              env: "TEST_PORT",
              validate: z.number().min(1).max(65535),
            }),
          })
          .load({ env: true, args: false });

        expect(config.port).toBe(8080);
      } finally {
        process.env = originalEnv;
      }
    });

    it("should fail validation on coerced env value out of range", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_PORT: "0" };
      try {
        const err = getLoadError(() =>
          optionFn
            .schema({
              port: optionFn.number({
                env: "TEST_PORT",
                validate: z.number().min(1),
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

    it("should validate boolean coerced from env string", () => {
      const originalEnv = process.env;
      process.env = { ...originalEnv, TEST_DEBUG: "true" };
      try {
        const config = optionFn
          .schema({
            debug: optionFn.bool({
              env: "TEST_DEBUG",
              validate: z.boolean(),
            }),
          })
          .load({ env: true, args: false });

        expect(config.debug).toBe(true);
      } finally {
        process.env = originalEnv;
      }
    });
  });

  describe("with file sources", () => {
    it("should validate values from YAML files", () => {
      const config = optionFn
        .schema({
          string: optionFn.string({
            validate: z.string().min(1),
          }),
          number: optionFn.number({
            validate: z.number().positive(),
          }),
        })
        .load({ env: false, args: false, files: FILE });

      expect(config.string).toBe("testString");
      expect(config.number).toBe(1);
    });

    it("should fail validation on file values", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            string: optionFn.string({
              validate: z.string().min(100),
            }),
          })
          .load({ env: false, args: false, files: FILE }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0]).toMatchObject({
        kind: "validation",
        path: "string",
        source: FILE,
      });
    });
  });

  describe("multiple fields with validation", () => {
    it("should collect errors from multiple fields", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            port: optionFn.number({
              defaultValue: -1,
              validate: z.number().positive(),
            }),
            host: optionFn.string({
              defaultValue: "",
              validate: z.string().min(1),
            }),
            debug: optionFn.bool({
              defaultValue: false,
              validate: z.literal(true),
            }),
          })
          .load({ env: false, args: false }),
      );

      const validationErrors = err.errors.filter(
        (e) => e.kind === "validation",
      );
      expect(validationErrors).toHaveLength(3);
      expect(validationErrors.map((e) => e.path).sort()).toEqual([
        "debug",
        "host",
        "port",
      ]);
    });
  });

  describe("with loadExtended", () => {
    it("should return data and no warnings when validation passes", () => {
      const { data, warnings } = optionFn
        .schema({
          port: optionFn.number({
            defaultValue: 3000,
            validate: z.number().min(1).max(65535),
          }),
        })
        .loadExtended({ env: false, args: false });

      expect(data).toBeDefined();
      expect(warnings).toEqual([]);
    });
  });

  describe("regex validation", () => {
    it("should validate with a regex pattern", () => {
      const config = optionFn
        .schema({
          version: optionFn.string({
            defaultValue: "1.2.3",
            validate: z.string().regex(/^\d+\.\d+\.\d+$/),
          }),
        })
        .load({ env: false, args: false });

      expect(config.version).toBe("1.2.3");
    });

    it("should fail with an invalid pattern", () => {
      const err = getLoadError(() =>
        optionFn
          .schema({
            version: optionFn.string({
              defaultValue: "not-a-version",
              validate: z.string().regex(/^\d+\.\d+\.\d+$/),
            }),
          })
          .load({ env: false, args: false }),
      );

      expect(err.errors).toHaveLength(1);
      expect(err.errors[0].kind).toBe("validation");
    });
  });
});
