import OptionErrors from "@/option/errors";
import c from "@/src";

afterEach(() => {
  new OptionErrors().clearAll();
});

describe("factory functions called with no arguments", () => {
  describe("c.string()", () => {
    it("should create a valid PrimitiveOption with correct default params", () => {
      const opt = c.string();
      expect(opt.params).toEqual({
        kind: "string",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
    });

    it("should return undefined for the field when loaded with no sources", () => {
      const config = c
        .schema({ value: c.string() })
        .load({ env: false, args: false });
      expect(config.value).toBeUndefined();
    });
  });

  describe("c.number()", () => {
    it("should create a valid PrimitiveOption with correct default params", () => {
      const opt = c.number();
      expect(opt.params).toEqual({
        kind: "number",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
    });

    it("should return undefined for the field when loaded with no sources", () => {
      const config = c
        .schema({ value: c.number() })
        .load({ env: false, args: false });
      expect(config.value).toBeUndefined();
    });
  });

  describe("c.bool()", () => {
    it("should create a valid PrimitiveOption with correct default params", () => {
      const opt = c.bool();
      expect(opt.params).toEqual({
        kind: "boolean",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
    });

    it("should return undefined for the field when loaded with no sources", () => {
      const config = c
        .schema({ value: c.bool() })
        .load({ env: false, args: false });
      expect(config.value).toBeUndefined();
    });
  });

  describe("schema with all three no-args factories", () => {
    it("should load successfully with env: false and args: false, returning undefined for all fields", () => {
      const config = c
        .schema({
          name: c.string(),
          port: c.number(),
          debug: c.bool(),
        })
        .load({ env: false, args: false });

      expect(config.name).toBeUndefined();
      expect(config.port).toBeUndefined();
      expect(config.debug).toBeUndefined();
    });
  });
});
