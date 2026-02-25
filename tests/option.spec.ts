import {
  ArrayOption,
  ArrayValueContainer,
  OptionErrors,
  PrimitiveOption,
} from "@/option";
import type { Value } from "@/option/base";
import OptionBase from "@/option/base";
import optionFn from "@/src";
import type { ConfigFileData, Path } from "@/types";
import { InvalidValue } from "@/types";

const FILE = "./tests/__mocks__/fileMock.yaml";

const ENV = {};

let errors: OptionErrors;

beforeEach(() => {
  errors = new OptionErrors();
});

afterEach(() => {
  errors.clearAll();
});

describe("option", () => {
  it("should return the option", () => {
    const option = new PrimitiveOption({
      kind: "string",
      required: false,
      env: "SITE_ID",
      cli: true,
      help: "",
    });
    expect(option).toEqual({
      params: {
        kind: "string",
        required: false,
        env: "SITE_ID",
        cli: true,
        help: "",
      },
    });
  });

  describe("when the option has cli and args", () => {
    it("should return the args value", () => {
      const option = new PrimitiveOption({
        kind: "string",
        required: false,
        env: null,
        cli: true,
        help: "",
      });
      expect(
        option.getValue(
          FILE,
          ENV,
          { "site.id": "10" },
          ["site", "id"],
          undefined,
          undefined,
          undefined,
          errors,
        ),
      ).toMatchObject({
        argName: "site.id",
        file: null,
        path: "site.id",
        sourceType: "args",
        value: "10",
        variableName: null,
        line: null,
        column: null,
      });
    });
  });
  describe("when the option has default value", () => {
    describe("when the default value is a function", () => {
      it("should return the default value", () => {
        const option = new PrimitiveOption({
          kind: "string",
          required: false,
          env: null,
          cli: false,
          defaultValue: (): string => "10",
          help: "",
        });
        expect(
          option.getValue(
            FILE,
            {},
            {},
            ["site", "test"],
            undefined,
            undefined,
            undefined,
            errors,
          ),
        ).toMatchObject({
          argName: null,
          file: null,
          path: "site.test",
          sourceType: "default",
          value: "10",
          variableName: null,
          line: null,
          column: null,
        });
      });
    });
    describe("when the default value is not a function", () => {
      it("should return the default value", () => {
        const option = new PrimitiveOption({
          kind: "string",
          required: false,
          env: null,
          cli: false,
          defaultValue: "15",
          help: "",
        });
        expect(
          option.getValue(
            FILE,
            {},
            {},
            ["site", "test"],
            undefined,
            undefined,
            undefined,
            errors,
          ),
        ).toMatchObject({
          argName: null,
          file: null,
          path: "site.test",
          sourceType: "default",
          value: "15",
          variableName: null,
          line: null,
          column: null,
        });
      });
    });
  });
  describe("when the option is required but it has not a value", () => {
    it("should save an error", () => {
      const option = new PrimitiveOption({
        kind: "string",
        required: true,
        env: null,
        cli: false,
        help: "",
      });
      option.getValue(
        FILE,
        {},
        {},
        ["site", "test"],
        "./tests/__mocks__/fileMock.yaml",
        undefined,
        undefined,
        errors,
      );
      expect(errors.errors).toContainEqual(
        expect.objectContaining({
          message:
            "Required option 'site.test' is missing. Set it via config file key: site.test.",
        }),
      );
    });
  });
  describe("if the option kind is an array", () => {
    it("return the array value as arrayOption", () => {
      const option = new ArrayOption({
        required: true,
        item: optionFn.string({ required: true }),
      });
      const value = option.getValue(
        FILE,
        ENV,
        {},
        ["test", "array"],
        undefined,
        undefined,
        undefined,
        errors,
      );
      expect(value).toMatchObject({
        value: new ArrayValueContainer(
          new PrimitiveOption({
            kind: "string",
            required: true,
            env: null,
            cli: false,
            help: "",
          }),
          ["test", "test2"],
        ),
        path: "test.array",
        sourceType: "file",
        file: "./tests/__mocks__/fileMock.yaml",
        variableName: null,
        argName: null,
      });
      expect(typeof value?.line === "number" || value?.line === null).toBe(
        true,
      );
      expect(typeof value?.column === "number" || value?.column === null).toBe(
        true,
      );
    });
  });

  describe("if option kind is equal to the type of the val", () => {
    it("should return the value", () => {
      const option = new PrimitiveOption({
        kind: "boolean",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      const value = option.getValue(
        FILE,
        ENV,
        {},
        ["test", "boolean"],
        undefined,
        undefined,
        undefined,
        errors,
      );
      expect(value).toMatchObject({
        argName: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.boolean",
        sourceType: "file",
        value: true,
        variableName: null,
      });
      expect(typeof value?.line === "number" || value?.line === null).toBe(
        true,
      );
      expect(typeof value?.column === "number" || value?.column === null).toBe(
        true,
      );
    });
  });

  describe("when the option kind is string but the value is a number", () => {
    it("should convert the value to string", () => {
      const option = new PrimitiveOption({
        kind: "string",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      const value = option.getValue(
        FILE,
        ENV,
        {},
        ["test", "number"],
        undefined,
        undefined,
        undefined,
        errors,
      );
      expect(value).toMatchObject({
        argName: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.number",
        sourceType: "file",
        value: "1883",
        variableName: null,
      });
      expect(typeof value?.line === "number" || value?.line === null).toBe(
        true,
      );
      expect(typeof value?.column === "number" || value?.column === null).toBe(
        true,
      );
    });
    describe("if the option value is a boolean", () => {
      it("should coerce to string with a warning", () => {
        const option = new PrimitiveOption({
          kind: "string",
          required: true,
          env: null,
          cli: false,
          help: "",
        });
        const result = option.getValue(
          FILE,
          ENV,
          {},
          ["test", "boolean"],
          undefined,
          undefined,
          undefined,
          errors,
        );
        expect(result).toMatchObject({
          value: "true",
          sourceType: "file",
        });
        expect(errors.warnings).toContainEqual(
          expect.stringContaining(
            "stated as a string but is provided as a boolean",
          ),
        );
      });
    });
  });

  describe("when the option kind is boolean but the value is not a boolean and an object", () => {
    describe("if the option value is a boolean but is a number or a string", () => {
      it("should convert the value to boolean", () => {
        const option = new PrimitiveOption({
          kind: "boolean",
          required: false,
          env: null,
          cli: false,
          help: "",
        });
        const value = option.getValue(
          FILE,
          ENV,
          {},
          ["test", "booleanAsString"],
          undefined,
          undefined,
          undefined,
          errors,
        );
        expect(value).toMatchObject({
          argName: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.booleanAsString",
          sourceType: "file",
          value: true,
          variableName: null,
        });
        expect(typeof value?.line === "number" || value?.line === null).toBe(
          true,
        );
        expect(
          typeof value?.column === "number" || value?.column === null,
        ).toBe(true);
      });
    });
    describe("if the option value is not a boolean or is a object", () => {
      it("should save an error", () => {
        const option = new PrimitiveOption({
          kind: "boolean",
          required: false,
          env: null,
          cli: false,
          help: "",
        });
        option.getValue(
          FILE,
          ENV,
          {},
          ["test", "string"],
          undefined,
          undefined,
          undefined,
          errors,
        );
        expect(errors.errors).toContainEqual(
          expect.objectContaining({
            message: expect.stringMatching(
              /Cannot convert value 'test' for 'test\.string' to boolean in \.\/tests\/__mocks__\/fileMock\.yaml(:\d+:\d+)?\./,
            ),
          }),
        );
      });
    });

    describe("whe the option kind is a number", () => {
      it("should return the number value", () => {
        const option = new PrimitiveOption({
          kind: "number",
          required: false,
          env: null,
          cli: false,
          help: "",
        });
        const value = option.getValue(
          FILE,
          ENV,
          {},
          ["test", "number"],
          undefined,
          undefined,
          undefined,
          errors,
        );
        expect(value).toMatchObject({
          argName: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.number",
          sourceType: "file",
          value: 1883,
          variableName: null,
        });
        expect(typeof value?.line === "number" || value?.line === null).toBe(
          true,
        );
        expect(
          typeof value?.column === "number" || value?.column === null,
        ).toBe(true);
      });
      describe("if the value is a number as string", () => {
        it("should convert the value to number", () => {
          const option = new PrimitiveOption({
            kind: "number",
            required: false,
            env: null,
            cli: false,
            help: "",
          });
          const value = option.getValue(
            FILE,
            ENV,
            {},
            ["test", "numberAsString"],
            undefined,
            undefined,
            undefined,
            errors,
          );
          expect(value).toMatchObject({
            argName: null,
            file: "./tests/__mocks__/fileMock.yaml",
            path: "test.numberAsString",
            sourceType: "file",
            value: 1883,
            variableName: null,
          });
          expect(typeof value?.line === "number" || value?.line === null).toBe(
            true,
          );
          expect(
            typeof value?.column === "number" || value?.column === null,
          ).toBe(true);
        });
      });
      describe("if the value is a string of letters", () => {
        it("should save an error", () => {
          const option = new PrimitiveOption({
            kind: "number",
            required: false,
            env: null,
            cli: false,
            help: "",
          });
          option.getValue(
            FILE,
            ENV,
            {},
            ["test", "string"],
            undefined,
            undefined,
            undefined,
            errors,
          );
          expect(errors.errors).toContainEqual(
            expect.objectContaining({
              message: expect.stringMatching(
                /Cannot convert value 'test' for 'test\.string' to number in \.\/tests\/__mocks__\/fileMock\.yaml(:\d+:\d+)?\./,
              ),
            }),
          );
        });
      });
      describe("if the values is not a number or a number as string and it is required", () => {
        it("should save an error", () => {
          const option = new PrimitiveOption({
            kind: "number",
            required: true,
            env: null,
            cli: false,
            help: "",
          });
          option.getValue(
            FILE,
            ENV,
            {},
            ["test", "undefined"],
            undefined,
            undefined,
            undefined,
            errors,
          );
          expect(errors.errors).toContainEqual(
            expect.objectContaining({
              message:
                "Required option 'test.undefined' is missing. Set it via config file key: test.undefined.",
            }),
          );
        });
      });
    });
  });

  describe("if the option kind is not supported", () => {
    it("should save an error", () => {
      const option = new PrimitiveOption({
        // @ts-expect-error - To test the validation
        kind: "test",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      expect(() =>
        option.getValue(
          FILE,
          ENV,
          {},
          ["test", "any"],
          undefined,
          undefined,
          undefined,
          errors,
        ),
      ).toThrow(
        new Error(
          "Invalid kind. Must be 'string', 'number', 'boolean' or 'array'",
        ),
      );
      expect(errors.errors).toContainEqual(
        expect.objectContaining({
          message: expect.stringMatching(
            /Invalid state\. Invalid kind in \.\/tests\/__mocks__\/fileMock\.yaml(:\d+:\d+)?/,
          ),
        }),
      );
    });
  });

  describe("when checkType receives an InvalidValue", () => {
    it("should push an invalid_state error", () => {
      const option = new PrimitiveOption({
        kind: "string",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      option.checkType(
        new InvalidValue(),
        ["test", "path"],
        "testFile.yaml",
        errors,
      );
      expect(errors.errors).toHaveLength(1);
      expect(errors.errors[0].kind).toBe("invalid_state");
    });
  });

  describe("when ArrayOption.buildArrayOption receives a null item", () => {
    it("should push an invalid_state error", () => {
      const arrayOpt = new ArrayOption({
        // @ts-expect-error - To test null item validation
        kind: "array",
        required: false,
        env: null,
        cli: false,
        help: "",
        item: null as any,
      });
      const result = arrayOpt.buildArrayOption(["a", "b"], errors);
      expect(result).toBeInstanceOf(InvalidValue);
      expect(errors.errors).toHaveLength(1);
      expect(errors.errors[0].kind).toBe("invalid_state");
    });
  });

  describe("findInObject with empty path", () => {
    // Subclass to expose the protected findInObject method
    class TestableOption extends OptionBase {
      public exposedFindInObject(
        obj: ConfigFileData,
        path: Path,
        optionErrors?: OptionErrors,
      ): Value {
        return this.findInObject(obj, path, optionErrors) as Value;
      }
    }

    it("should push an invalid_path error when path is empty", () => {
      const opt = new TestableOption({
        kind: "string",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      const result = opt.exposedFindInObject({ key: "value" }, [], errors);
      expect(result).toBeInstanceOf(InvalidValue);
      expect(errors.errors).toHaveLength(1);
      expect(errors.errors[0].kind).toBe("invalid_path");
    });

    it("should push an invalid_path error for unsupported value types", () => {
      const opt = new TestableOption({
        kind: "string",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      // Force a bigint value to hit the fallthrough branch
      const obj = { key: BigInt(42) } as any;
      const result = opt.exposedFindInObject(obj, ["key"], errors);
      expect(result).toBeInstanceOf(InvalidValue);
      expect(errors.errors).toHaveLength(1);
      expect(errors.errors[0].kind).toBe("invalid_path");
    });
  });
});
