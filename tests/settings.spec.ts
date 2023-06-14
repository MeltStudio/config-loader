import { OptionErrors } from "@/option";
import Settings, { option } from "@/src";
import { InvalidValue } from "@/types";

import { addCliArg } from "./utils/cli";

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
// eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle
let _processArgs: string[];
beforeAll(() => {
  jest.spyOn(process, "exit").mockImplementation((code?: number) => {
    throw new Error(code?.toString());
  });
  _proccessEnv = process.env;
  _processArgs = process.argv;
});

beforeEach(() => {
  process.env = { ..._proccessEnv };
  process.argv = [..._processArgs];
  OptionErrors.clearAll();
});

afterEach(() => {
  OptionErrors.clearAll();
});

afterAll(() => {
  process.env = _proccessEnv;
  process.argv = _processArgs;
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

  describe("if the arguments are set via CLI", () => {
    describe("if no arguments are passed", () => {
      it("should return the object as it appears in the yaml file", () => {
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true, cli: true }),
                minRam: option.number({ required: true, cli: true }),
                openSource: option.bool({ required: true, cli: true }),
              },
            },
          },
          {
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
        });
      });
    });
    describe("if an argument is passed", () => {
      it("should overwrite the value if it is a string", () => {
        addCliArg("database.engine.name", "MySQL");
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true, cli: true }),
                minRam: option.number({ required: true, cli: true }),
                openSource: option.bool({ required: true, cli: true }),
              },
            },
          },
          {
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "MySQL", minRam: 8, openSource: true },
          },
        });
      });
      it("should overwrite the value if it is a number", () => {
        addCliArg("database.engine.minRam", "32");
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true, cli: true }),
                minRam: option.number({ required: true, cli: true }),
                openSource: option.bool({ required: true, cli: true }),
              },
            },
          },
          {
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 32, openSource: true },
          },
        });
      });
      it("should overwrite the value if it is a bool", () => {
        addCliArg("database.engine.openSource", "false");
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true, cli: true }),
                minRam: option.number({ required: true, cli: true }),
                openSource: option.bool({ required: true, cli: true }),
              },
            },
          },
          {
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: false },
          },
        });
      });
    });
    describe("if an unknown argument is passed", () => {
      it("should throw an error", () => {
        addCliArg("unknown.veryUnknown.name", "MySQL");
        expect(
          () =>
            new Settings(
              {
                database: {
                  engine: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                },
              },
              {
                env: false,
                args: true,
                files: "tests/__mocks__/settings/cli/data.yaml",
              }
            )
        ).toThrow();
      });
    });
    describe("if multiple arguments are passed", () => {
      it("should overwrite all the passed values", () => {
        addCliArg("database.engine.name", "MySQL");
        addCliArg("database.engine.minRam", "32");
        addCliArg("database.engine.openSource", "false");
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true, cli: true }),
                minRam: option.number({ required: true, cli: true }),
                openSource: option.bool({ required: true, cli: true }),
              },
            },
          },
          {
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "MySQL", minRam: 32, openSource: false },
          },
        });
      });
    });
  });

  describe("when the option doesn't have cli and env", () => {
    describe("when searching for a string nested inside an object", () => {
      it("should return the string value if it exists and is valid", () => {
        const settings = new Settings(
          {
            hardware: {
              type: option.string({ required: true, env: "SITE_ID" }),
            },
          },
          {
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedString.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          hardware: { type: "Disk drive" },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                hardware: {
                  type: option.string({ required: true, env: "SITE_ID" }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedStringNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'hardware.type' not provided."
        );
      });
    });

    describe("when searching for an string array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              engines: option.array({
                required: true,
                item: option.string({ required: true }),
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedStringArray.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: { engines: ["PostgreSQL", "MySQL", "Firestore"] },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  engines: option.array({
                    required: true,
                    item: option.string({ required: true }),
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedStringArrayNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'database.engines' not provided."
        );
      });
    });

    describe("when searching for a number array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              sizeOptions: option.array({
                required: true,
                item: option.number({ required: true }),
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedNumberArray.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: { sizeOptions: [1, 2, 4, 8] },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  sizeOptions: option.array({
                    required: true,
                    item: option.number({ required: true }),
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'database.sizeOptions' not provided."
        );
      });

      it("should throw an error if the array items cannot be parsed to number", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  sizeOptions: option.array({
                    required: true,
                    item: option.number({ required: true }),
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayWrongType.yaml",
              }
            )
        ).toThrow();
        [
          "Cannot convert value 'MySQL' for 'database.sizeOptions.0' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayWrongType.yaml.",
          "Cannot convert value 'Firebase' for 'database.sizeOptions.1' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayWrongType.yaml.",
        ].forEach((message) => {
          expect(OptionErrors.errors).toContain(message);
        });
      });
    });

    describe("when searching for a bool nested inside an object", () => {
      it("should return the bool if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              bool1: option.bool({ required: true }),
              bool2: option.bool({ required: true }),
              bool3: option.bool({ required: true }),
              bool4: option.bool({ required: true }),
              bool5: option.bool({ required: true }),
              bool6: option.bool({ required: true }),
              bool7: option.bool({ required: true }),
              bool8: option.bool({ required: true }),
              bool9: option.bool({ required: true }),
              bool10: option.bool({ required: true }),
            },
          },
          {
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedBool.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            bool1: true,
            bool2: false,
            bool3: true,
            bool4: false,
            bool5: true,
            bool6: false,
            bool7: true,
            bool8: false,
            bool9: true,
            bool10: false,
          },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  bool1: option.bool({ required: true }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedBoolNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'database.bool1' not provided."
        );
      });

      it("should throw an error if the array items cannot be parsed to boolean", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  bool1: option.bool({ required: true }),
                  bool2: option.bool({ required: true }),
                  bool3: option.bool({ required: true }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedBoolWrongType.yaml",
              }
            )
        ).toThrow();
        const errorMessages = [
          "Cannot convert value '2' for 'database.bool1' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolWrongType.yaml.",
          "Cannot convert value 'texto' for 'database.bool2' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolWrongType.yaml.",
          "Cannot convert value '-14' for 'database.bool3' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolWrongType.yaml.",
        ];
        errorMessages.forEach((message) => {
          expect(OptionErrors.errors).toContain(message);
        });
      });
    });

    describe("when searching for a bool array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              bools: option.array({
                required: true,
                item: option.bool({ required: true }),
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedBoolArray.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            bools: [
              true,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
              true,
              false,
            ],
          },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  bools: option.array({
                    required: true,
                    item: option.bool({ required: true }),
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'database.bools' not provided."
        );
      });

      it("should throw an error if the array items cannot be parsed to boolean", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  bools: option.array({
                    required: true,
                    item: option.bool({ required: true }),
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayWrongType.yaml",
              }
            )
        ).toThrow();
        const errorMessages = [
          "Cannot convert value '2' for 'database.bools.0' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayWrongType.yaml.",
          "Cannot convert value 'texto' for 'database.bools.1' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayWrongType.yaml.",
          "Cannot convert value '-14' for 'database.bools.2' to boolean in tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayWrongType.yaml.",
        ];
        errorMessages.forEach((message) => {
          expect(OptionErrors.errors).toContain(message);
        });
      });
    });

    describe("when searching for an object array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              engines: option.array({
                required: true,
                item: {
                  name: option.string({ required: true }),
                  minRam: option.number({ required: true }),
                  openSource: option.bool({ required: true }),
                },
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedObjectArray.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engines: [
              { name: "PostgreSQL", minRam: 8, openSource: true },
              { name: "MySQL", minRam: 4, openSource: true },
              { name: "Firestore", minRam: 16, openSource: false },
            ],
          },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  engines: option.array({
                    required: true,
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                    },
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedObjectArrayNotFound.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Required option 'database.engines' not provided."
        );
      });

      // eslint-disable-next-line jest/no-disabled-tests
      it("should throw an error if the array items aren't objects", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  engines: option.array({
                    required: true,
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                    },
                  }),
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedObjectArrayWrongType.yaml",
              }
            )
        ).toThrow();
        // TODO: Fix the messages thrown by this test, it should say that the problem is database.engines, not its children
        // expect(OptionErrors.errors).toContain(
        //   "Required option 'database.bools' not provided."
        // );
      });
    });

    describe("when searching for an object nested inside another object", () => {
      it("should return the object if it exists and is valid", () => {
        const settings = new Settings(
          {
            database: {
              engine: {
                name: option.string({ required: true }),
                minRam: option.number({ required: true }),
                openSource: option.bool({ required: true }),
              },
            },
          },
          {
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedObject.yaml",
          }
        );
        expect(settings.get()).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
        });
      });

      // eslint-disable-next-line jest/no-disabled-tests
      it("should throw an error if it doesn't exist", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  engine: {
                    name: option.string({ required: true }),
                    minRam: option.number({ required: true }),
                    openSource: option.bool({ required: true }),
                  },
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedObjectNotFound.yaml",
              }
            )
        ).toThrow();
        // TODO: Fix the messages thrown by this test, it should say that database.engine is required, not its children
        // expect(OptionErrors.errors).toContain(
        //   "Required option 'database.engine' not provided."
        // );
      });

      it("should throw an error if the object is of a different kind", () => {
        expect(
          () =>
            new Settings(
              {
                database: {
                  engine: {
                    name: option.string({ required: true }),
                    minRam: option.number({ required: true }),
                    openSource: option.bool({ required: true }),
                  },
                },
              },
              {
                env: false,
                args: false,
                files:
                  "tests/__mocks__/settings/no-cli-no-env/nestedObjectWrongType.yaml",
              }
            )
        ).toThrow();
        expect(OptionErrors.errors).toContain(
          "Cant get path from string value 'PostgreSQL'"
        );
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
    // eslint-disable-next-line jest/no-disabled-tests
    it("should throw an error", () => {
      jest.spyOn(process, "exit").mockImplementation((code?: number) => {
        throw new Error(code?.toString());
      });
      // const spyConsoleError = jest.spyOn(console, "error");
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
      // TODO: fix this test, it is throwing 7 error messages instead of 6 (one for each root element)
      // expect(spyConsoleError).toHaveBeenCalledTimes(6);
    });
  });
  describe("Implementation details", () => {
    describe("when using getValidatedArray", () => {
      // eslint-disable-next-line jest/no-disabled-tests
      it.skip("should return a number validated array", () => {
        const settings = new Settings(
          {
            database: {
              sizeOptions: option.array({
                required: true,
                item: option.number({ required: true }),
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/implementation-details/getValidatedArray.yaml",
          }
        );
        expect(
          // @ts-expect-error - To call a private method in a test
          settings.getValidatedArray(
            option.number({ required: true }),
            ["invalid1"],
            "tests/__mocks__/settings/implementation-details/getValidatedArray.yaml"
          )[0]
        ).toBeInstanceOf(InvalidValue);
        expect(OptionErrors.errors).toContain(
          "Cannot convert value 'invalid1' for 'database.sizeOptions.0' to number in tests/__mocks__/settings/implementation-details/getValidatedArray.yaml."
        );
      });

      // eslint-disable-next-line jest/no-disabled-tests
      it.skip("should return a boolean validated array", () => {
        const settings = new Settings(
          {
            database: {
              bools: option.array({
                required: true,
                item: option.bool({ required: true }),
              }),
            },
          },
          {
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/implementation-details/getValidatedArray.yaml",
          }
        );
        expect(
          // @ts-expect-error - To call a private method in a test
          settings.getValidatedArray(
            option.bool({ required: true }),
            ["invalid2"],
            "tests/__mocks__/settings/implementation-details/getValidatedArray.yaml"
          )[0]
        ).toBeInstanceOf(InvalidValue);
        expect(OptionErrors.errors).toContain(
          "Cannot convert value 'invalid2' for 'database.bools.0' to boolean in tests/__mocks__/settings/implementation-details/getValidatedArray.yaml."
        );
      });
    });
  });
});
