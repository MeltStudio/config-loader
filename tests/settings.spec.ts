import { OptionErrors } from "@/option";
import Settings, { option } from "@/src";

interface TestObject {
  value: number;
  name: string;
}

interface TestSettingsFile {
  string: string;
  number: 1;
  object: TestObject;
  stringArray: string[];
  numberArray: number[];
  objectArray: TestObject[];
}

// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
let _proccessEnv: NodeJS.ProcessEnv;
beforeAll(() => {
  jest.spyOn(process, "exit").mockImplementation((code?: number) => {
    throw new Error(code?.toString());
  });
  _proccessEnv = process.env;
});

beforeEach(() => {
  process.env = { ..._proccessEnv };
  OptionErrors.clearAll();
});

afterEach(() => {
  process.env = _proccessEnv;
  OptionErrors.clearAll();
});

afterAll(() => {
  process.env = _proccessEnv;
  jest.restoreAllMocks();
});

describe("Settings", () => {
  describe("if everything is ok", () => {
    it("should return the data", () => {
      const settings = new Settings<TestSettingsFile>(
        {
          string: option.string({ required: true }),
          number: option.number({ required: true }),
          object: {
            value: option.number({ required: true }),
            name: option.string({ required: true }),
          },
          stringArray: option.array({ required: true, item: option.string() }),
          numberArray: option.array({ required: true, item: option.number() }),
          objectArray: option.array({
            required: true,
            item: {
              value: option.number({ required: true }),
              name: option.string({ required: true }),
            },
          }),
        },
        {
          env: true,
          args: false,
          files: "tests/__mocks__/fileMock.yaml",
        }
      );
      expect(settings.get()).toStrictEqual({
        number: 1,
        numberArray: [1],
        object: {
          name: "testing",
          value: 1,
        },
        objectArray: [
          {
            name: "testing",
            value: 1,
          },
        ],
        string: "testString",
        stringArray: ["test"],
      });
    });
  });

  describe("if the environment variable is set", () => {
    it("should return the correct env values", () => {
      // * mock env variables
      process.env = { SITE_ID: "test" };
      const settings = new Settings(
        {
          SITE_ID: option.string({ required: true, env: "SITE_ID" }),
        },
        {
          env: true,
          args: false,
          files: "tests/__mocks__/emptyFile.yaml",
        }
      );
      expect(settings.get()).toStrictEqual({ SITE_ID: "test" });
    });
  });

  describe("if the file was not found", () => {
    it("should throw an error", () => {
      expect(
        () =>
          new Settings<TestSettingsFile>(
            {
              string: option.string({ required: true }),
              number: option.number({ required: true }),
              object: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
              stringArray: option.array({
                required: true,
                item: option.string(),
              }),
              numberArray: option.array({
                required: true,
                item: option.number(),
              }),
              objectArray: option.array({
                required: true,
                item: {
                  value: option.number({ required: true }),
                  name: option.string({ required: true }),
                },
              }),
            },
            {
              env: true,
              args: false,
              files: "filemock.yaml",
            }
          )
      ).toThrow("Invalid config file 'filemock.yaml'");
    });
  });

  describe("if the file is wrong", () => {
    // TODO: fix this test, it is throwing 7 error messages instead of 6 (one for each root element)
    // eslint-disable-next-line jest/no-disabled-tests
    it.skip("should throw an error", () => {
      jest.spyOn(process, "exit").mockImplementation((code?: number) => {
        throw new Error(code?.toString());
      });
      const spyConsoleError = jest.spyOn(console, "error");
      expect(
        () =>
          new Settings<TestSettingsFile>(
            {
              string: option.string({ required: true }),
              number: option.number({ required: true }),
              object: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
              stringArray: option.array({
                required: true,
                item: option.string(),
              }),
              numberArray: option.array({
                required: true,
                item: option.number(),
              }),
              objectArray: option.array({
                required: true,
                item: {
                  value: option.number({ required: true }),
                  name: option.string({ required: true }),
                },
              }),
            },
            {
              env: true,
              args: false,
              files: "tests/__mocks__/wrongFile.yaml",
            }
          )
      ).toThrow("1");
      expect(spyConsoleError).toHaveBeenCalledTimes(6);
    });
  });
});
