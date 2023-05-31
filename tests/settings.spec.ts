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

describe("Settings", () => {
  describe("if everything is ok", () => {
    it("should return the data", () => {
      jest.spyOn(process, "exit").mockImplementation((code?: number) => {
        throw new Error(code?.toString());
      });
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
    it("should throw an error", () => {
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
