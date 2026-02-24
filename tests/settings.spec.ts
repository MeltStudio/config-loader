import ConfigNode from "@/nodes/configNode";
import { OptionErrors } from "@/option";
import option from "@/src";

import { addCliArg } from "./utils/cli";

let savedProcessEnv: NodeJS.ProcessEnv;

let savedProcessArgs: string[];
beforeAll(() => {
  savedProcessEnv = process.env;
  savedProcessArgs = process.argv;
});

beforeEach(() => {
  process.env = { ...savedProcessEnv };
  process.argv = [...savedProcessArgs];
  OptionErrors.clearAll();
});

afterEach(() => {
  OptionErrors.clearAll();
});

afterAll(() => {
  process.env = savedProcessEnv;
  process.argv = savedProcessArgs;
});

describe("Settings", () => {
  describe("if everything is ok", () => {
    it("should return the data", () => {
      const data = option
        .schema({
          string: option.string({ required: true }),
          number: option.number({ required: true }),
          object: option.object({
            item: {
              value: option.number({ required: true }),
              name: option.string({ required: true }),
            },
          }),
          stringArray: option.array({ required: true, item: option.string() }),
          numberArray: option.array({ required: true, item: option.number() }),
          objectArray: option.array({
            required: true,
            item: option.object({
              item: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
            }),
          }),
        })
        .load({
          env: true,
          args: false,
          files: "tests/__mocks__/fileMock.yaml",
        });
      expect(data).toStrictEqual({
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
      const data = option
        .schema({
          SITE_ID: option.string({ required: true, env: "SITE_ID" }),
        })
        .load({
          env: true,
          args: false,
          files: "tests/__mocks__/emptyFile.yaml",
        });
      expect(data).toStrictEqual({ SITE_ID: "test" });
    });
  });

  describe("if the arguments are set via CLI", () => {
    describe("if no arguments are passed", () => {
      it("should return the object as it appears in the yaml file", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
        });
      });
    });
    describe("if an argument is passed", () => {
      it("should overwrite the value if it is a string", () => {
        addCliArg("database.engine.name", "MySQL");
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "MySQL", minRam: 8, openSource: true },
          },
        });
      });
      it("should overwrite the value if it is a number", () => {
        addCliArg("database.engine.minRam", "32");
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 32, openSource: true },
          },
        });
      });
      it("should overwrite the value if it is a bool", () => {
        addCliArg("database.engine.openSource", "false");
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: false },
          },
        });
      });
    });
    describe("if an unknown argument is passed", () => {
      it("should be ignored", () => {
        addCliArg("unknown.veryUnknown.name", "MySQL");
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({}),
                    minRam: option.number({}),
                    openSource: option.bool({}),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
        });
      });
    });
    describe("if multiple arguments are passed", () => {
      it("should overwrite all the passed values", () => {
        addCliArg("database.engine.name", "MySQL");
        addCliArg("database.engine.minRam", "32");
        addCliArg("database.engine.openSource", "false");
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: true,
            files: "tests/__mocks__/settings/cli/data.yaml",
          });
        expect(data).toStrictEqual({
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
        const data = option
          .schema({
            hardware: option.object({
              item: {
                type: option.string({ required: true, env: "SITE_ID" }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedString.yaml",
          });
        expect(data).toStrictEqual({
          hardware: { type: "Disk drive" },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(() =>
          option
            .schema({
              hardware: option.object({
                item: {
                  type: option.string({ required: true, env: "SITE_ID" }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedStringNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'hardware.type' not provided.",
          }),
        );
      });

      // TODO: Error message for array says required option not provided, instead of wrong type
      it("should throw an error if the value is wrong type (object or array)", () => {
        expect(() =>
          option
            .schema({
              hardware: option.object({
                item: {
                  size: option.string({ required: true }),
                  brand: option.string({ required: true }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedStringWrongType.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message: expect.stringMatching(
              /Cannot convert value '\{"max":400,"min":200\}' for 'hardware\.size' to string in tests\/__mocks__\/settings\/no-cli-no-env\/nestedStringWrongType\.yaml(:\d+:\d+)?\./,
            ),
          }),
        );
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'hardware.brand' not provided.",
          }),
        );
      });
    });

    describe("when searching for an string array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engines: option.array({
                  required: true,
                  item: option.string({ required: true }),
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedStringArray.yaml",
          });
        expect(data).toStrictEqual({
          database: { engines: ["PostgreSQL", "MySQL", "Firestore"] },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engines: option.array({
                    required: true,
                    item: option.string({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedStringArrayNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.engines' not provided.",
          }),
        );
      });
    });

    describe("when searching for a number nested inside an object", () => {
      it("should return the number if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                ram: option.number({ required: true }),
                cpus: option.number({ required: true }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedNumber.yaml",
          });
        expect(data).toStrictEqual({
          database: { ram: 16, cpus: 32 },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  ram: option.number({ required: true }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedNumberNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.ram' not provided.",
          }),
        );
      });

      it("should throw an error if the value cannot be parsed to number", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  ram1: option.number({ required: true }),
                  ram2: option.number({ required: true }),
                  ram3: option.number({ required: true }),
                  ram4: option.number({ required: true }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedNumberWrongType.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toHaveLength(4);
        // TODO: fix error messages
        /* [
          "Cannot convert value 'MySQL' for 'database.ram1' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberWrongType.yaml.",
          "Cannot convert value 'MySQL' for 'database.ram2' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberWrongType.yaml.",
          "Cannot convert value 'MySQL' for 'database.ram3' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberWrongType.yaml.",
          "Cannot convert value 'MySQL' for 'database.ram4' to number in tests/__mocks__/settings/no-cli-no-env/nestedNumberWrongType.yaml.",
        ].forEach((message) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({ message })
          );
        }); */
      });
    });

    describe("when searching for a number array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                sizeOptions: option.array({
                  required: true,
                  item: option.number({ required: true }),
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedNumberArray.yaml",
          });
        expect(data).toStrictEqual({
          database: { sizeOptions: [1, 2, 4, 8] },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  sizeOptions: option.array({
                    required: true,
                    item: option.number({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.sizeOptions' not provided.",
          }),
        );
      });

      it("should throw an error if the array items cannot be parsed to number", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  sizeOptions: option.array({
                    required: true,
                    item: option.number({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayWrongItemType.yaml",
            }),
        ).toThrow();
        [
          /Cannot convert value 'MySQL' for 'database\.sizeOptions\.0' to number in tests\/__mocks__\/settings\/no-cli-no-env\/nestedNumberArrayWrongItemType\.yaml(:\d+:\d+)?\./,
          /Cannot convert value 'Firebase' for 'database\.sizeOptions\.1' to number in tests\/__mocks__\/settings\/no-cli-no-env\/nestedNumberArrayWrongItemType\.yaml(:\d+:\d+)?\./,
        ].forEach((pattern) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              message: expect.stringMatching(pattern),
            }),
          );
        });
      });

      it("should throw an error if the value is not an array", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  sizeOptions: option.array({
                    required: true,
                    item: option.number({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedNumberArrayWrongType.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            message: expect.stringMatching(
              /Invalid state\. Invalid kind in tests\/__mocks__\/settings\/no-cli-no-env\/nestedNumberArrayWrongType\.yaml(:\d+:\d+)?/,
            ),
          }),
        );
      });
    });

    describe("when searching for a bool nested inside an object", () => {
      it("should return the bool if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
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
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedBool.yaml",
          });
        expect(data).toStrictEqual({
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
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  bool1: option.bool({ required: true }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedBoolNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.bool1' not provided.",
          }),
        );
      });

      it("should throw an error if the array items cannot be parsed to boolean", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  bool1: option.bool({ required: true }),
                  bool2: option.bool({ required: true }),
                  bool3: option.bool({ required: true }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedBoolWrongType.yaml",
            }),
        ).toThrow();
        const errorPatterns = [
          /Cannot convert value '2' for 'database\.bool1' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolWrongType\.yaml(:\d+:\d+)?\./,
          /Cannot convert value 'texto' for 'database\.bool2' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolWrongType\.yaml(:\d+:\d+)?\./,
          /Cannot convert value '-14' for 'database\.bool3' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolWrongType\.yaml(:\d+:\d+)?\./,
        ];
        errorPatterns.forEach((pattern) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              message: expect.stringMatching(pattern),
            }),
          );
        });
      });
    });

    describe("when searching for a bool array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                bools: option.array({
                  required: true,
                  item: option.bool({ required: true }),
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedBoolArray.yaml",
          });
        expect(data).toStrictEqual({
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
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  bools: option.array({
                    required: true,
                    item: option.bool({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.bools' not provided.",
          }),
        );
      });

      it("should throw an error if the array items cannot be parsed to boolean", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  bools: option.array({
                    required: true,
                    item: option.bool({ required: true }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedBoolArrayWrongType.yaml",
            }),
        ).toThrow();
        const errorPatterns = [
          /Cannot convert value '2' for 'database\.bools\.0' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolArrayWrongType\.yaml(:\d+:\d+)?\./,
          /Cannot convert value 'texto' for 'database\.bools\.1' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolArrayWrongType\.yaml(:\d+:\d+)?\./,
          /Cannot convert value '-14' for 'database\.bools\.2' to boolean in tests\/__mocks__\/settings\/no-cli-no-env\/nestedBoolArrayWrongType\.yaml(:\d+:\d+)?\./,
        ];
        errorPatterns.forEach((pattern) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              message: expect.stringMatching(pattern),
            }),
          );
        });
      });
    });

    describe("when searching for an object array nested inside an object", () => {
      it("should return the array if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engines: option.array({
                  required: true,
                  item: option.object({
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                    },
                  }),
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedObjectArray.yaml",
          });
        expect(data).toStrictEqual({
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
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engines: option.array({
                    required: true,
                    item: option.object({
                      item: {
                        name: option.string({ required: true }),
                        minRam: option.number({ required: true }),
                        openSource: option.bool({ required: true }),
                      },
                    }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedObjectArrayNotFound.yaml",
            }),
        ).toThrow();
        expect(OptionErrors.errors).toContainEqual(
          expect.objectContaining({
            message: "Required option 'database.engines' not provided.",
          }),
        );
      });

      it("should throw an error if the array items aren't objects", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engines: option.array({
                    required: true,
                    item: option.object({
                      item: {
                        name: option.string({ required: true }),
                        minRam: option.number({ required: true }),
                        openSource: option.bool({ required: true }),
                      },
                    }),
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedObjectArrayWrongType.yaml",
            }),
        ).toThrow();
        // TODO: Fix the messages thrown by this test, it should say that the problem is database.engines, not its children
        // expect(OptionErrors.errors).toContain(
        //   "Required option 'database.bools' not provided."
        // );
      });
    });

    describe("when searching for an object nested inside another object", () => {
      it("should return the object if it exists and is valid", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true }),
                    minRam: option.number({ required: true }),
                    openSource: option.bool({ required: true }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/no-cli-no-env/nestedObject.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
        });
      });

      it("should throw an error if it doesn't exist", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedObjectNotFound.yaml",
            }),
        ).toThrow();
        // TODO: Fix the messages thrown by this test, it should say that database.engine is required, not its children
        // expect(OptionErrors.errors).toContain(
        //   "Required option 'database.engine' not provided."
        // );
      });

      it("should throw an error if the object is of a different kind", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                    },
                  }),
                  cpu: option.object({
                    item: {
                      brand: option.string({ required: true }),
                      cores: option.number({ required: true }),
                      power: option.bool({ required: true }),
                    },
                  }),
                  openSource: option.object({
                    item: {
                      url: option.string({ required: true }),
                    },
                  }),
                  date: option.object({
                    item: {
                      start: option.string({ required: true }),
                      end: option.string({ required: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files:
                "tests/__mocks__/settings/no-cli-no-env/nestedObjectWrongType.yaml",
            }),
        ).toThrow();
        [
          "Cant get path from string value 'PostgreSQL'",
          "Cant get path from number value '4'",
          "Cant get path from boolean value 'true'",
          "Cant get path from array value '[1986,1990,1995]'",
        ].forEach((error) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({ message: error }),
          );
        });
      });
    });
  });

  describe("if setting a default value for the option", () => {
    describe("if no value is provided in the file", () => {
      describe("when providing default as value", () => {
        it("should return the default value", () => {
          const data = option
            .schema({
              name: option.string({
                cli: false,
                defaultValue: "MySQL",
              }),
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({
                        cli: false,
                        defaultValue: "MySQL",
                      }),
                      minRam: option.number({
                        cli: false,
                        defaultValue: 64,
                      }),
                      openSource: option.bool({
                        cli: false,
                        defaultValue: false,
                      }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: "tests/__mocks__/settings/defaults/empty.yaml",
            });
          expect(data).toStrictEqual({
            name: "MySQL",
            database: {
              engine: {
                name: "MySQL",
                minRam: 64,
                openSource: false,
              },
            },
          });
        });
      });
      describe("when providing default as function", () => {
        it("should return the default value", () => {
          const data = option
            .schema({
              name: option.string({
                cli: false,
                defaultValue: () => "MySQL",
              }),
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({
                        cli: false,
                        defaultValue: () => "MySQL",
                      }),
                      minRam: option.number({
                        cli: false,
                        defaultValue: () => 64,
                      }),
                      openSource: option.bool({
                        cli: false,
                        defaultValue: () => false,
                      }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: "tests/__mocks__/settings/defaults/empty.yaml",
            });
          expect(data).toStrictEqual({
            name: "MySQL",
            database: {
              engine: {
                name: "MySQL",
                minRam: 64,
                openSource: false,
              },
            },
          });
        });
      });
    });

    describe("if no value is provided in the file and the default is an array", () => {
      describe("when providing default as value", () => {
        it("should return the default array", () => {
          const data = option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      versions: option.array({
                        required: true,
                        item: option.string({ required: true }),
                        defaultValue: ["1.0.0", "1.1.0", "1.2.0"],
                      }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: "tests/__mocks__/settings/defaults/empty.yaml",
            });
          expect(data).toStrictEqual({
            database: {
              engine: {
                versions: ["1.0.0", "1.1.0", "1.2.0"],
              },
            },
          });
        });
      });
      describe("when providing default as function", () => {
        it("should return the default array", () => {
          const data = option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      versions: option.array({
                        required: true,
                        item: option.string({ required: true }),
                        defaultValue: () => ["1.0.0", "1.1.0", "1.2.0"],
                      }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: "tests/__mocks__/settings/defaults/empty.yaml",
            });
          expect(data).toStrictEqual({
            database: {
              engine: {
                versions: ["1.0.0", "1.1.0", "1.2.0"],
              },
            },
          });
        });
      });
    });

    describe("if some value is provided in the file", () => {
      it("should override the default value", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({
                      cli: false,
                      defaultValue: "MySQL",
                    }),
                    minRam: option.number({
                      cli: false,
                      defaultValue: 64,
                    }),
                    openSource: option.bool({
                      cli: false,
                      defaultValue: false,
                    }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/defaults/data.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: {
              name: "PostgreSQL",
              minRam: 8,
              openSource: true,
            },
          },
        });
      });
    });

    describe("if some value is provided in the file (for arrays)", () => {
      it("should override the default value", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    versions: option.array({
                      required: true,
                      item: option.string({ required: true }),
                      defaultValue: ["1.0.0", "1.1.0", "1.2.0"],
                    }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/defaults/data-array.yaml",
          });
        expect(data).toStrictEqual({
          database: {
            engine: {
              versions: ["1.4.0", "2.4.1", "5.7.6"],
            },
          },
        });
      });
    });
  });

  describe("if setting a default value for the settings", () => {
    describe("if no value is provided in the file", () => {
      it("should return the default value", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({}),
                    minRam: option.number({}),
                    openSource: option.bool({}),
                    versions: option.array({ item: option.string() }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/defaults/empty.yaml",
            defaults: {
              database: {
                engine: {
                  name: "MySQL",
                  minRam: 64,
                  openSource: false,
                  versions: ["1.4.0", "2.4.1", "5.7.6"],
                },
              },
            },
          });
        expect(data).toStrictEqual({
          database: {
            engine: {
              name: "MySQL",
              minRam: 64,
              openSource: false,
              versions: ["1.4.0", "2.4.1", "5.7.6"],
            },
          },
        });
      });
    });

    describe("if some value is provided in the file", () => {
      it("should override the default value", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({}),
                    minRam: option.number({}),
                    openSource: option.bool({}),
                    cpus: option.number({}),
                    versions: option.array({ item: option.string() }),
                  },
                }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/settings/defaults/data-array.yaml",
            defaults: {
              database: {
                engine: {
                  name: "MySQL",
                  minRam: 64,
                  openSource: false,
                  cpus: 4,
                  versions: ["1.2.3", "3.2.1", "4.4.4"],
                },
              },
            },
          });
        expect(data).toStrictEqual({
          database: {
            engine: {
              name: "PostgreSQL",
              minRam: 8,
              openSource: true,
              cpus: 4,
              versions: ["1.4.0", "2.4.1", "5.7.6"],
            },
          },
        });
      });
    });
  });

  describe("if multiple files are loaded", () => {
    describe("if data has no collisions", () => {
      it("should set all values", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
            features: option.array({
              required: true,
              item: option.object({
                item: {
                  name: option.string({ required: true }),
                  enabled: option.bool({ required: true }),
                },
              }),
            }),
            version: option.string({ required: true }),
            upgraded: option.bool({ required: true }),
            cpus: option.number({ required: true }),
          })
          .load({
            env: false,
            args: false,
            files: [
              "tests/__mocks__/settings/multiple-files/no-collision/file-1.yaml",
              "tests/__mocks__/settings/multiple-files/no-collision/file-2.yaml",
              "tests/__mocks__/settings/multiple-files/no-collision/file-3.yaml",
            ],
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
          features: [
            { name: "Store", enabled: true },
            { name: "Admin", enabled: false },
          ],
          version: "0.1.2",
          upgraded: true,
          cpus: 4,
        });
      });
    });

    describe("if data has collisions on primitive values", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            file1Data: option.object({
              item: {
                unique: option.bool({ required: true }),
              },
            }),
            file2Data: option.object({
              item: {
                unique: option.bool({ required: true }),
              },
            }),
            version: option.string({ required: true }),
            upgraded: option.bool({ required: true }),
            cpus: option.number({ required: true }),
            numberData: option.number({ required: true }),
          })
          .load({
            env: false,
            args: false,
            files: [
              "tests/__mocks__/settings/multiple-files/primitive-collision/file-1.yaml",
              "tests/__mocks__/settings/multiple-files/primitive-collision/file-2.yaml",
            ],
          });
        expect(data).toStrictEqual({
          file1Data: { unique: true },
          file2Data: { unique: true },
          version: "0.1.2",
          upgraded: true,
          cpus: 16,
          numberData: 256,
        });
      });
    });

    describe("if data has collisions on objects", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                name: option.string({ required: true }),
                minRam: option.number({ required: true }),
                openSource: option.bool({ required: true }),
                maxRam: option.number({ required: true }),
                version: option.string({ required: true }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: [
              "tests/__mocks__/settings/multiple-files/object-collision/file-1.yaml",
              "tests/__mocks__/settings/multiple-files/object-collision/file-2.yaml",
            ],
          });
        expect(data).toStrictEqual({
          database: {
            name: "MySQL",
            minRam: 2,
            openSource: false,
            maxRam: 32,
            version: "1.2.3",
          },
        });
      });
    });

    describe("if data has collisions on arrays", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            ramSizes: option.array({ item: option.number(), required: true }),
          })
          .load({
            env: false,
            args: false,
            files: [
              "tests/__mocks__/settings/multiple-files/array-collision/file-1.yaml",
              "tests/__mocks__/settings/multiple-files/array-collision/file-2.yaml",
            ],
          });
        expect(data).toStrictEqual({
          ramSizes: [2, 4, 8, 16],
        });
      });
    });

    describe("if a required setting doesn't appear on any of the files", () => {
      it("should throw an error", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                      // control test, this value should appear on the files
                      launchDate: option.string({ required: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: [
                "tests/__mocks__/settings/multiple-files/argument-not-found/file-1.yaml",
                "tests/__mocks__/settings/multiple-files/argument-not-found/file-2.yaml",
                "tests/__mocks__/settings/multiple-files/argument-not-found/file-3.yaml",
              ],
            }),
        ).toThrow();
        const errors = [
          "Required option 'database.engine.name' not provided.",
          "Required option 'database.engine.minRam' not provided.",
          "Required option 'database.engine.openSource' not provided.",
        ];
        errors.forEach((error) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({ message: error }),
          );
        });
      });
    });

    describe("if some file doesn't exist", () => {
      it("should throw an error", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true, cli: true }),
                      minRam: option.number({ required: true, cli: true }),
                      openSource: option.bool({ required: true, cli: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: [
                "tests/__mocks__/settings/multiple-files/file-not-found/file-1.yaml",
                "tests/__mocks__/settings/multiple-files/file-not-found/missing-file.yaml",
              ],
            }),
        ).toThrow(
          "Invalid config file 'tests/__mocks__/settings/multiple-files/file-not-found/missing-file.yaml'",
        );
      });
    });

    describe("if dir argument is also specified", () => {
      it("should throw an error", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true, cli: true }),
                      minRam: option.number({ required: true, cli: true }),
                      openSource: option.bool({ required: true, cli: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              files: [
                "tests/__mocks__/settings/multiple-files/no-collision/file-1.yaml",
                "tests/__mocks__/settings/multiple-files/no-collision/file-2.yaml",
                "tests/__mocks__/settings/multiple-files/no-collision/file-3.yaml",
              ],
              dir: "tests/__mocks__/settings/multiple-files/no-collision",
            }),
        ).toThrow("Dir and files are specified, choose one");
      });
    });
  });

  describe("if a directory is loaded", () => {
    describe("if data has no collisions", () => {
      it("should set all values", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                engine: option.object({
                  item: {
                    name: option.string({ required: true, cli: true }),
                    minRam: option.number({ required: true, cli: true }),
                    openSource: option.bool({ required: true, cli: true }),
                  },
                }),
              },
            }),
            features: option.array({
              required: true,
              item: option.object({
                item: {
                  name: option.string({ required: true }),
                  enabled: option.bool({ required: true }),
                },
              }),
            }),
            version: option.string({ required: true }),
            upgraded: option.bool({ required: true }),
            cpus: option.number({ required: true }),
          })
          .load({
            env: false,
            args: false,
            dir: "tests/__mocks__/settings/multiple-files/no-collision",
          });
        expect(data).toStrictEqual({
          database: {
            engine: { name: "PostgreSQL", minRam: 8, openSource: true },
          },
          features: [
            { name: "Store", enabled: true },
            { name: "Admin", enabled: false },
          ],
          version: "0.1.2",
          upgraded: true,
          cpus: 4,
        });
      });
    });

    describe("if data has collisions on primitive values", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            file1Data: option.object({
              item: {
                unique: option.bool({ required: true }),
              },
            }),
            file2Data: option.object({
              item: {
                unique: option.bool({ required: true }),
              },
            }),
            version: option.string({ required: true }),
            upgraded: option.bool({ required: true }),
            cpus: option.number({ required: true }),
            numberData: option.number({ required: true }),
          })
          .load({
            env: false,
            args: false,
            dir: "tests/__mocks__/settings/multiple-files/primitive-collision",
          });
        expect(data).toStrictEqual({
          file1Data: { unique: true },
          file2Data: { unique: true },
          version: "0.1.2",
          upgraded: true,
          cpus: 16,
          numberData: 256,
        });
      });
    });

    describe("if data has collisions on objects", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            database: option.object({
              item: {
                name: option.string({ required: true }),
                minRam: option.number({ required: true }),
                openSource: option.bool({ required: true }),
                maxRam: option.number({ required: true }),
                version: option.string({ required: true }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            dir: "tests/__mocks__/settings/multiple-files/object-collision",
          });
        expect(data).toStrictEqual({
          database: {
            name: "MySQL",
            minRam: 2,
            openSource: false,
            maxRam: 32,
            version: "1.2.3",
          },
        });
      });
    });

    describe("if data has collisions on arrays", () => {
      it("should prioritize first loaded file", () => {
        const data = option
          .schema({
            ramSizes: option.array({ item: option.number(), required: true }),
          })
          .load({
            env: false,
            args: false,
            dir: "tests/__mocks__/settings/multiple-files/array-collision",
          });
        expect(data).toStrictEqual({
          ramSizes: [2, 4, 8, 16],
        });
      });
    });

    describe("if a required setting doesn't appear on any of the files", () => {
      it("should throw an error", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true }),
                      minRam: option.number({ required: true }),
                      openSource: option.bool({ required: true }),
                      // control test, this value should appear on the files
                      launchDate: option.string({ required: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              dir: "tests/__mocks__/settings/multiple-files/argument-not-found",
            }),
        ).toThrow();
        const errors = [
          "Required option 'database.engine.name' not provided.",
          "Required option 'database.engine.minRam' not provided.",
          "Required option 'database.engine.openSource' not provided.",
        ];
        errors.forEach((error) => {
          expect(OptionErrors.errors).toContainEqual(
            expect.objectContaining({ message: error }),
          );
        });
      });
    });

    describe("if the directory doesn't exist", () => {
      it("should throw an error", () => {
        expect(() =>
          option
            .schema({
              database: option.object({
                item: {
                  engine: option.object({
                    item: {
                      name: option.string({ required: true, cli: true }),
                      minRam: option.number({ required: true, cli: true }),
                      openSource: option.bool({ required: true, cli: true }),
                    },
                  }),
                },
              }),
            })
            .load({
              env: false,
              args: false,
              dir: "tests/__mocks__/settings/missing-dir",
            }),
        ).toThrow(
          "'tests/__mocks__/settings/missing-dir' not exists or is not a dir",
        );
      });
    });
  });

  describe("if the file was not found", () => {
    it("should throw an error", () => {
      expect(() =>
        option
          .schema({
            string: option.string({ required: true }),
            number: option.number({ required: true }),
            object: option.object({
              item: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
            }),
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
              item: option.object({
                item: {
                  value: option.number({ required: true }),
                  name: option.string({ required: true }),
                },
              }),
            }),
          })
          .load({
            env: true,
            args: false,
            files: "filemock.yaml",
          }),
      ).toThrow("Invalid config file 'filemock.yaml'");
    });
  });

  describe("if the file is wrong", () => {
    it("should throw a ConfigLoadError", () => {
      expect(() =>
        option
          .schema({
            string: option.string({ required: true }),
            number: option.number({ required: true }),
            object: option.object({
              item: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
            }),
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
              item: option.object({
                item: {
                  value: option.number({ required: true }),
                  name: option.string({ required: true }),
                },
              }),
            }),
          })
          .load({
            env: true,
            args: false,
            files: "tests/__mocks__/wrongFile.yaml",
          }),
      ).toThrow("Configuration loading failed");
    });
  });

  describe("JSON file support", () => {
    describe("if loading from a JSON file", () => {
      it("should return the data", () => {
        const data = option
          .schema({
            string: option.string({ required: true }),
            number: option.number({ required: true }),
            object: option.object({
              item: {
                value: option.number({ required: true }),
                name: option.string({ required: true }),
              },
            }),
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
              item: option.object({
                item: {
                  value: option.number({ required: true }),
                  name: option.string({ required: true }),
                },
              }),
            }),
          })
          .load({
            env: true,
            args: false,
            files: "tests/__mocks__/fileMock.json",
          });
        expect(data).toStrictEqual({
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

    describe("if environment variable is set with a JSON file", () => {
      it("should return the correct env values", () => {
        process.env = { SITE_ID: "test" };
        const data = option
          .schema({
            SITE_ID: option.string({ required: true, env: "SITE_ID" }),
          })
          .load({
            env: true,
            args: false,
            files: "tests/__mocks__/emptyFile.json",
          });
        expect(data).toStrictEqual({ SITE_ID: "test" });
      });
    });

    describe("if loading nested values from a JSON file", () => {
      it("should return nested object values", () => {
        const data = option
          .schema({
            test: option.object({
              item: {
                boolean: option.bool({ required: true }),
                number: option.number({ required: true }),
                string: option.string({ required: true }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files: "tests/__mocks__/fileMock.json",
          });
        expect(data).toStrictEqual({
          test: {
            boolean: true,
            number: 1883,
            string: "test",
          },
        });
      });
    });

    describe("if loading from multiple files including JSON", () => {
      it("should merge data from YAML and JSON files", () => {
        const data = option
          .schema({
            string: option.string({ required: true }),
            number: option.number({ required: true }),
          })
          .load({
            env: false,
            args: false,
            files: [
              "tests/__mocks__/fileMock.yaml",
              "tests/__mocks__/fileMock.json",
            ],
          });
        expect(data).toStrictEqual({
          string: "testString",
          number: 1,
        });
      });
    });
  });

  describe("loadExtended", () => {
    it("should return a NodeTree with ConfigNode instances containing source metadata", () => {
      const result = option
        .schema({
          string: option.string({ required: true }),
          number: option.number({ required: true }),
          object: option.object({
            item: {
              value: option.number({ required: true }),
              name: option.string({ required: true }),
            },
          }),
        })
        .loadExtended({
          env: false,
          args: false,
          files: "tests/__mocks__/fileMock.yaml",
        });

      // Top-level keys should be ConfigNode instances
      expect(result.string).toBeInstanceOf(ConfigNode);
      expect(result.number).toBeInstanceOf(ConfigNode);

      // Verify source metadata on a ConfigNode
      const stringNode = result.string as unknown as ConfigNode;
      expect(stringNode.value).toBe("testString");
      expect(stringNode.sourceType).toBe("file");
      expect(stringNode.file).toBe("tests/__mocks__/fileMock.yaml");
      expect(stringNode.variableName).toBeNull();
      expect(stringNode.argName).toBeNull();

      const numberNode = result.number as unknown as ConfigNode;
      expect(numberNode.value).toBe(1);
      expect(numberNode.sourceType).toBe("file");

      // Nested object should contain ConfigNode instances
      const objectNode = result.object as unknown as {
        value: ConfigNode;
        name: ConfigNode;
      };
      expect(objectNode.value).toBeInstanceOf(ConfigNode);
      expect(objectNode.name).toBeInstanceOf(ConfigNode);
      expect(objectNode.value.value).toBe(1);
      expect(objectNode.name.value).toBe("testing");
      expect(objectNode.name.sourceType).toBe("file");
    });

    it("should reflect env source metadata when loaded from environment", () => {
      process.env = { MY_VAR: "from-env" };
      const result = option
        .schema({
          myVar: option.string({ required: true, env: "MY_VAR" }),
        })
        .loadExtended({
          env: true,
          args: false,
          files: "tests/__mocks__/emptyFile.yaml",
        });

      const node = result.myVar as unknown as ConfigNode;
      expect(node).toBeInstanceOf(ConfigNode);
      expect(node.value).toBe("from-env");
      expect(node.sourceType).toBe("env");
      expect(node.variableName).toBe("MY_VAR");
      expect(node.file).toBeNull();
      expect(node.argName).toBeNull();
    });
  });

  describe("line and column metadata", () => {
    it("should populate line and column for values from YAML files", () => {
      const result = option
        .schema({
          object: option.object({
            item: {
              value: option.number({ required: true }),
              name: option.string({ required: true }),
            },
          }),
        })
        .loadExtended({
          env: false,
          args: false,
          files: "tests/__mocks__/fileMock.yaml",
        });

      const nameNode = (result.object as unknown as { name: ConfigNode }).name;
      expect(nameNode).toBeInstanceOf(ConfigNode);
      expect(nameNode.sourceType).toBe("file");
      expect(typeof nameNode.line).toBe("number");
      expect(typeof nameNode.column).toBe("number");
    });

    it("should have null line and column for env-sourced values", () => {
      process.env.MY_VAR = "env-value";
      const result = option
        .schema({
          myVar: option.string({ env: "MY_VAR" }),
        })
        .loadExtended({
          env: true,
          args: false,
          files: "tests/__mocks__/emptyFile.yaml",
        });

      const node = result.myVar as unknown as ConfigNode;
      expect(node).toBeInstanceOf(ConfigNode);
      expect(node.sourceType).toBe("env");
      expect(node.line).toBeNull();
      expect(node.column).toBeNull();
    });

    it("should have null line and column for default values", () => {
      const result = option
        .schema({
          myVar: option.string({ defaultValue: "fallback" }),
        })
        .loadExtended({
          env: false,
          args: false,
          files: "tests/__mocks__/emptyFile.yaml",
        });

      const node = result.myVar as unknown as ConfigNode;
      expect(node).toBeInstanceOf(ConfigNode);
      expect(node.sourceType).toBe("default");
      expect(node.line).toBeNull();
      expect(node.column).toBeNull();
    });

    it("should have null line and column for CLI arg values", () => {
      addCliArg("myVar", "cli-value");
      const result = option
        .schema({
          myVar: option.string({ cli: true }),
        })
        .loadExtended({
          env: false,
          args: true,
          files: "tests/__mocks__/emptyFile.yaml",
        });

      const node = result.myVar as unknown as ConfigNode;
      expect(node).toBeInstanceOf(ConfigNode);
      expect(node.sourceType).toBe("args");
      expect(node.line).toBeNull();
      expect(node.column).toBeNull();
    });

    it("should include line and column for JSON file values", () => {
      const result = option
        .schema({
          string: option.string({ required: true }),
        })
        .loadExtended({
          env: false,
          args: false,
          files: "tests/__mocks__/fileMock.json",
        });

      const node = result.string as unknown as ConfigNode;
      expect(node).toBeInstanceOf(ConfigNode);
      expect(node.sourceType).toBe("file");
      expect(node.line).toBeGreaterThan(0);
      expect(node.column).toBeGreaterThan(0);
    });

    it("should include line and column for nested JSON values", () => {
      const result = option
        .schema({
          object: option.object({
            item: {
              name: option.string({ required: true }),
            },
          }),
        })
        .loadExtended({
          env: false,
          args: false,
          files: "tests/__mocks__/fileMock.json",
        });

      const objectNode = result.object as unknown as { name: ConfigNode };
      expect(objectNode.name).toBeInstanceOf(ConfigNode);
      expect(objectNode.name.line).toBeGreaterThan(0);
      expect(objectNode.name.column).toBeGreaterThan(0);
    });

    it("should include line numbers in error messages for YAML-sourced values", () => {
      expect(() =>
        option
          .schema({
            hardware: option.object({
              item: {
                size: option.string({ required: true }),
              },
            }),
          })
          .load({
            env: false,
            args: false,
            files:
              "tests/__mocks__/settings/no-cli-no-env/nestedStringWrongType.yaml",
          }),
      ).toThrow();
      const errorWithLine = OptionErrors.errors.find(
        (e) => e.path === "hardware.size",
      );
      expect(errorWithLine).toBeDefined();
      expect(errorWithLine!.message).toMatch(/\.yaml:\d+:\d+\./);
    });
  });

  describe("env file support", () => {
    it("should load values from a .env file", () => {
      const data = option
        .schema({
          host: option.string({ env: "DB_HOST" }),
          port: option.number({ env: "DB_PORT" }),
        })
        .load({
          env: false,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      expect(data).toStrictEqual({
        host: "localhost",
        port: 5432,
      });
    });

    it("should give process.env priority over .env file", () => {
      process.env.DB_HOST = "prod-server";
      const data = option
        .schema({
          host: option.string({ env: "DB_HOST" }),
          port: option.number({ env: "DB_PORT" }),
        })
        .load({
          env: true,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      expect(data.host).toBe("prod-server");
      // DB_PORT not in process.env, should come from .env
      expect(data.port).toBe(5432);
    });

    it("should give env file priority over config files", () => {
      const data = option
        .schema({
          host: option.string({ env: "DB_HOST" }),
          port: option.number({ env: "DB_PORT" }),
          name: option.string({ required: true }),
        })
        .load({
          env: false,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
          files: "tests/__mocks__/settings/env-file/data.yaml",
        });
      // env file should win over yaml for fields with env mapping
      expect(data.host).toBe("localhost");
      expect(data.port).toBe(5432);
      // field without env mapping should come from yaml
      expect(data.name).toBe("from-yaml");
    });

    it("should support multiple .env files (later overrides earlier)", () => {
      const data = option
        .schema({
          port: option.number({ env: "DB_PORT" }),
          logLevel: option.string({ env: "LOG_LEVEL" }),
          host: option.string({ env: "DB_HOST" }),
        })
        .load({
          env: false,
          args: false,
          envFile: [
            "tests/__mocks__/settings/env-file/.env",
            "tests/__mocks__/settings/env-file/.env.override",
          ],
        });
      // DB_PORT is in both files — override file should win
      expect(data.port).toBe(3306);
      // LOG_LEVEL only in override file
      expect(data.logLevel).toBe("debug");
      // DB_HOST only in first file
      expect(data.host).toBe("localhost");
    });

    it("should report envFile sourceType in loadExtended()", () => {
      const extended = option
        .schema({
          host: option.string({ env: "DB_HOST" }),
          port: option.number({ env: "DB_PORT" }),
        })
        .loadExtended({
          env: false,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      const hostNode = extended.host as ConfigNode;
      expect(hostNode.sourceType).toBe("envFile");
      expect(hostNode.file).toBe("tests/__mocks__/settings/env-file/.env");
      expect(hostNode.variableName).toBe("DB_HOST");
      expect(hostNode.line).toBe(2);
      expect(hostNode.column).toBe(1);
    });

    it("should report env sourceType when process.env overrides .env file", () => {
      process.env.DB_HOST = "override-host";
      const extended = option
        .schema({
          host: option.string({ env: "DB_HOST" }),
        })
        .loadExtended({
          env: true,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      const hostNode = extended.host as ConfigNode;
      expect(hostNode.sourceType).toBe("env");
      expect(hostNode.file).toBeNull();
      expect(hostNode.value).toBe("override-host");
    });

    it("should throw for missing .env file", () => {
      expect(() =>
        option.schema({ port: option.number({ env: "PORT" }) }).load({
          env: false,
          args: false,
          envFile: "tests/__mocks__/nonexistent.env",
        }),
      ).toThrow(/Invalid env file/);
    });

    it("should handle envFile: false (no .env loading)", () => {
      const data = option
        .schema({
          host: option.string({ env: "DB_HOST", defaultValue: "fallback" }),
        })
        .load({
          env: false,
          args: false,
          envFile: false,
        });
      expect(data.host).toBe("fallback");
    });

    it("should handle .env file with quoted values", () => {
      const data = option
        .schema({
          password: option.string({ env: "DB_PASSWORD" }),
          appName: option.string({ env: "APP_NAME" }),
        })
        .load({
          env: false,
          args: false,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      expect(data.password).toBe("s3cret");
      expect(data.appName).toBe("My App");
    });

    it("should combine .env file with CLI args (CLI wins)", () => {
      addCliArg("host", "cli-host");
      const data = option
        .schema({
          host: option.string({ env: "DB_HOST", cli: true }),
          port: option.number({ env: "DB_PORT" }),
        })
        .load({
          env: false,
          args: true,
          envFile: "tests/__mocks__/settings/env-file/.env",
        });
      expect(data.host).toBe("cli-host");
      expect(data.port).toBe(5432);
    });
  });
});
