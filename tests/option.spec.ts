import ConfigNode from "@/nodes/configNode";
import {
  ArrayOption,
  ArrayValueContainer,
  OptionErrors,
  PrimitiveOption,
} from "@/option";
import optionFn from "@/src";

const FILE = "./tests/__mocks__/fileMock.yaml";

const ENV = {};

beforeEach(() => {
  OptionErrors.clearAll();
});

afterEach(() => {
  OptionErrors.clearAll();
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
        option.getValue(FILE, ENV, { "site.id": "10" }, ["site", "id"])
      ).toEqual({
        argName: "site.id",
        file: null,
        path: "site.id",
        sourceType: "args",
        value: "10",
        variableName: null,
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
        expect(option.getValue(FILE, {}, {}, ["site", "test"])).toEqual({
          argName: null,
          file: null,
          path: "site.test",
          sourceType: "default",
          value: "10",
          variableName: null,
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
        expect(option.getValue(FILE, {}, {}, ["site", "test"])).toEqual({
          argName: null,
          file: null,
          path: "site.test",
          sourceType: "default",
          value: "15",
          variableName: null,
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
        "./tests/__mocks__/fileMock.yaml"
      );
      expect(OptionErrors.errors).toContainEqual(
        expect.objectContaining({
          message: "Required option 'site.test' not provided.",
        })
      );
    });
  });
  describe("if the option kind is an array", () => {
    it("return the array value as arrayOption", () => {
      const option = new ArrayOption({
        required: true,
        item: optionFn.string({ required: true }),
      });
      const value = option.getValue(FILE, ENV, {}, ["test", "array"]);
      expect(value).toEqual(
        new ConfigNode(
          new ArrayValueContainer(
            new PrimitiveOption({
              kind: "string",
              required: true,
              env: null,
              cli: false,
              help: "",
            }),
            ["test", "test2"]
          ), // COSA
          "test.array",
          "file",
          "./tests/__mocks__/fileMock.yaml",
          null,
          null
        )
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
      const value = option.getValue(FILE, ENV, {}, ["test", "boolean"]);
      expect(value).toEqual({
        argName: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.boolean",
        sourceType: "file",
        value: true,
        variableName: null,
      });
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
      const value = option.getValue(FILE, ENV, {}, ["test", "number"]);
      expect(value).toEqual({
        argName: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.number",
        sourceType: "file",
        value: "1883",
        variableName: null,
      });
    });
    describe("if the option value is different of a number", () => {
      it("should save an error", () => {
        const option = new PrimitiveOption({
          kind: "string",
          required: true,
          env: null,
          cli: false,
          help: "",
        });
        option.getValue(FILE, ENV, {}, ["test", "boolean"]);
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message:
              "Cannot convert value 'true' for 'test.boolean' to string in ./tests/__mocks__/fileMock.yaml.",
          })
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
        const value = option.getValue(FILE, ENV, {}, [
          "test",
          "booleanAsString",
        ]);
        expect(value).toEqual({
          argName: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.booleanAsString",
          sourceType: "file",
          value: true,
          variableName: null,
        });
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
        option.getValue(FILE, ENV, {}, ["test", "string"]);
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message:
              "Cannot convert value 'test' for 'test.string' to boolean in ./tests/__mocks__/fileMock.yaml.",
          })
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
        const value = option.getValue(FILE, ENV, {}, ["test", "number"]);
        expect(value).toEqual({
          argName: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.number",
          sourceType: "file",
          value: 1883,
          variableName: null,
        });
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
          const value = option.getValue(FILE, ENV, {}, [
            "test",
            "numberAsString",
          ]);
          expect(value).toEqual({
            argName: null,
            file: "./tests/__mocks__/fileMock.yaml",
            path: "test.numberAsString",
            sourceType: "file",
            value: 1883,
            variableName: null,
          });
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
          option.getValue(FILE, ENV, {}, ["test", "string"]);
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({
              message:
                "Cannot convert value 'test' for 'test.string' to number in ./tests/__mocks__/fileMock.yaml.",
            })
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
          option.getValue(FILE, ENV, {}, ["test", "undefined"]);
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({
              message: "Required option 'test.undefined' not provided.",
            })
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
      expect(() => option.getValue(FILE, ENV, {}, ["test", "any"])).toThrow(
        new Error(
          "Invalid kind. Must be 'string', 'number', 'boolean' or 'array'"
        )
      );
      expect(OptionErrors.errors).toContainEqual(
        expect.objectContaining({
          message:
            "Invalid state. Invalid kind in ./tests/__mocks__/fileMock.yaml",
        })
      );
    });
  });
});
