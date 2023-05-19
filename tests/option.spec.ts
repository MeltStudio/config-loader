import ConfigNode from "@/nodes/configNode";
import {
  ArrayOption,
  ArrayValueContainer,
  OptionErrors,
  PrimitiveOption,
} from "@/option";
import { option as optionFn } from "@/src";

const FILE = "./tests/__mocks__/fileMock.yaml";

const ENV = {};

describe("option", () => {
  // eslint-disable-next-line jest/no-disabled-tests
  it.skip("should return the option", () => {
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

  describe("when the option has env", () => {
    it.skip("should return the env value", () => {
      const option = new PrimitiveOption({
        kind: "string",
        required: false,
        env: "SITE_ID",
        cli: true,
        help: "",
      });
      console.log(process.cwd());
      expect(option.getValue(FILE, ENV, {}, ["site", "id"])).toEqual({
        arg_name: null,
        file: null,
        path: "site.id",
        source_type: "env",
        value: "107",
        variable_name: "SITE_ID",
      });
    });
  });
  describe("when the option has not cli and env", () => {
    describe("if the option is not instance of ArrayOption", () => {
      it.skip("should return the normal value", () => {
        const option = new PrimitiveOption({
          kind: "string",
          required: false,
          env: null,
          cli: false,
          help: "",
        });
        expect(option.getValue(FILE, ENV, {}, ["hardware", "type"])).toEqual({
          arg_name: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "hardware.type",
          source_type: "file",
          value: "TDD",
          variable_name: null,
        });
      });
    });
    describe("if the option is instance of ArrayOption", () => {
      it.skip("should return the array value", () => {
        const option = new ArrayOption({
          required: false,
          item: optionFn.string(),
        });
        expect(
          option.getValue(FILE, ENV, {}, ["device", "datapoints"])
        ).toEqual(
          new ConfigNode(
            new ArrayValueContainer("string", [
              {
                defaultValue: 0,
                flags: {
                  hidden: false,
                  log: false,
                },
                index: 0,
                magnitude: 1,
                maxValue: 0,
                minChange: 0,
                minValue: 0,
                name: "uptime",
                units: "seconds",
              },
            ]),
            "device.datapoints",
            "file",
            "./tests/__mocks__/fileMock.yaml",
            null,
            null
          )
        );
      });
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
        arg_name: "site.id",
        file: null,
        path: "site.id",
        source_type: "args",
        value: "10",
        variable_name: null,
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
          arg_name: null,
          file: null,
          path: "site.test",
          source_type: "default",
          value: "10",
          variable_name: null,
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
          arg_name: null,
          file: null,
          path: "site.test",
          source_type: "default",
          value: "15",
          variable_name: null,
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
      expect(OptionErrors.errors).toContain(
        "Required option 'site.test' not provided."
      );
    });
  });
  describe("if the option kind is an array", () => {
    it("return the array value as arrayOption", () => {
      const option = new ArrayOption({
        required: false,
        item: optionFn.string(),
      });
      const value = option.getValue(FILE, ENV, {}, ["test", "array"]);
      expect(value).toEqual(
        new ConfigNode(
          new ArrayValueContainer("string", ["test", "test2"]), // COSA
          "test.array",
          "file",
          "./tests/__mocks__/fileMock.yaml",
          null,
          null
        )
      );
    });
    describe("if the item is null", () => {
      it.skip("should save an error", () => {
        const option = new ArrayOption({
          required: false,
          item: optionFn.string(),
        });
        option.getValue(FILE, ENV, {}, ["test", "array"]);
        expect(OptionErrors.errors).toContain("Array item cannot be null");
      });
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
        arg_name: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.boolean",
        source_type: "file",
        value: true,
        variable_name: null,
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
        arg_name: null,
        file: "./tests/__mocks__/fileMock.yaml",
        path: "test.number",
        source_type: "file",
        value: "1883",
        variable_name: null,
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
        expect(OptionErrors.errors).toContain(
          "Cannot convert value 'true' for 'test.boolean' to string in ./tests/__mocks__/fileMock.yaml."
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
          arg_name: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.booleanAsString",
          source_type: "file",
          value: true,
          variable_name: null,
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
        expect(OptionErrors.errors).toContain(
          "Cannot convert value 'test' for 'test.string' to boolean in ./tests/__mocks__/fileMock.yaml."
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
          arg_name: null,
          file: "./tests/__mocks__/fileMock.yaml",
          path: "test.number",
          source_type: "file",
          value: 1883,
          variable_name: null,
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
            arg_name: null,
            file: "./tests/__mocks__/fileMock.yaml",
            path: "test.numberAsString",
            source_type: "file",
            value: 1883,
            variable_name: null,
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
          expect(OptionErrors.errors).toContain(
            "Cannot convert value 'test' for 'test.string' to number in ./tests/__mocks__/fileMock.yaml."
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
          expect(OptionErrors.errors).toContain(
            "Required option 'test.undefined' not provided."
          );
        });
      });
    });
  });

  describe("if the option kind is any", () => {
    it("should return the value", () => {
      const option = new PrimitiveOption({
        kind: "any",
        required: false,
        env: null,
        cli: false,
        help: "",
      });
      const value = option.getValue(FILE, ENV, {}, ["test", "any"]);
      expect(value).toEqual(
        new ConfigNode(
          {},
          "test.any",
          "file",
          "./tests/__mocks__/fileMock.yaml",
          null,
          null
        )
      );
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
      option.getValue(FILE, ENV, {}, ["test", "any"]);
      expect(OptionErrors.errors).toContain(
        "Invalid state. Invalid kind in ./tests/__mocks__/fileMock.yaml"
      );
    });
  });
});
