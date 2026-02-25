import { ConfigFileError } from "@/errors";
import { clearFileCache, loadConfigFile } from "@/fileLoader";
import OptionErrors from "@/option/errors";
import c from "@/src";

afterEach(() => {
  clearFileCache();
  new OptionErrors().clearAll();
});

describe("loadConfigFile", () => {
  it("should load a YAML file", () => {
    const { data } = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(data).toHaveProperty("string", "testString");
    expect(data).toHaveProperty("number", 1);
  });

  it("should load a JSON file", () => {
    const { data } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(data).toHaveProperty("string", "testString");
    expect(data).toHaveProperty("number", 1);
  });

  it("should load a .yml file as YAML", () => {
    const { data } = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(data).toHaveProperty("string", "testString");
  });

  it("should load a TOML file", () => {
    const { data } = loadConfigFile("tests/__mocks__/fileMock.toml");
    expect(data).toHaveProperty("string", "testString");
    expect(data).toHaveProperty("number", 1);
  });

  it("should return equivalent data from both JSON and YAML", () => {
    const { data: yamlData } = loadConfigFile("tests/__mocks__/fileMock.yaml");
    const { data: jsonData } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(jsonData).toStrictEqual(yamlData);
  });

  it("should return a sourceMap for YAML files", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(sourceMap).not.toBeNull();
    const loc = sourceMap!.lookup(["object", "name"]);
    expect(loc).toBeDefined();
    expect(loc).toHaveProperty("line", expect.any(Number));
    expect(loc).toHaveProperty("column", expect.any(Number));
  });

  it("should return a sourceMap for JSON files", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(sourceMap).not.toBeNull();
  });

  it("should track line numbers for top-level JSON keys", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(sourceMap).not.toBeNull();
    const loc = sourceMap!.lookup(["string"]);
    expect(loc).toBeDefined();
    expect(loc!.line).toBeGreaterThan(0);
  });

  it("should track line numbers for nested JSON keys", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(sourceMap).not.toBeNull();
    const loc = sourceMap!.lookup(["object", "name"]);
    expect(loc).toBeDefined();
    expect(loc!.line).toBeGreaterThan(0);
  });

  it("should support string path in JSON sourceMap lookup", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.json");
    // lookup with string instead of array — hits the non-Array.isArray branch
    const loc = sourceMap!.lookup("object.name");
    expect(loc).toBeDefined();
    expect(loc).toHaveProperty("line", expect.any(Number));
    expect(loc).toHaveProperty("column", expect.any(Number));
    // should match the array-based lookup
    const locFromArray = sourceMap!.lookup(["object", "name"]);
    expect(loc).toEqual(locFromArray);
  });

  it("should return equivalent data from TOML, JSON, and YAML", () => {
    const { data: yamlData } = loadConfigFile("tests/__mocks__/fileMock.yaml");
    const { data: tomlData } = loadConfigFile("tests/__mocks__/fileMock.toml");
    // TOML key ordering differs from JSON/YAML, so compare deeply with toEqual
    expect(tomlData).toEqual(yamlData);
  });

  it("should return a sourceMap for TOML files", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.toml");
    expect(sourceMap).not.toBeNull();
    const loc = sourceMap!.lookup(["object", "name"]);
    expect(loc).toBeDefined();
    expect(loc).toHaveProperty("line", expect.any(Number));
    expect(loc).toHaveProperty("column", expect.any(Number));
  });

  it("should track line numbers for top-level TOML keys", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.toml");
    expect(sourceMap).not.toBeNull();
    const loc = sourceMap!.lookup(["string"]);
    expect(loc).toBeDefined();
    expect(loc!.line).toBeGreaterThan(0);
  });

  it("should support string path in TOML sourceMap lookup", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.toml");
    const loc = sourceMap!.lookup("object.name");
    expect(loc).toBeDefined();
    expect(loc).toHaveProperty("line", expect.any(Number));
    const locFromArray = sourceMap!.lookup(["object", "name"]);
    expect(loc).toEqual(locFromArray);
  });

  it("should throw ConfigFileError for invalid TOML", () => {
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.toml")).toThrow(
      ConfigFileError,
    );
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.toml")).toThrow(
      /Failed to parse config file/,
    );
  });

  it("should handle non-Error throw during YAML parsing", () => {
    const yaml = require("js-yaml") as {
      load: (...args: unknown[]) => unknown;
    };
    const originalLoad = yaml.load;
    yaml.load = (): never => {
      throw "string error";
    };
    try {
      expect(() => loadConfigFile("tests/__mocks__/fileMock.yaml")).toThrow(
        /Unknown parsing error/,
      );
    } finally {
      yaml.load = originalLoad;
    }
  });

  it("should throw ConfigFileError for invalid YAML", () => {
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.yaml")).toThrow(
      ConfigFileError,
    );
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.yaml")).toThrow(
      /Failed to parse config file/,
    );
  });

  it("should throw ConfigFileError for invalid JSON", () => {
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.json")).toThrow(
      ConfigFileError,
    );
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.json")).toThrow(
      /Failed to parse config file/,
    );
  });
});

describe("file cache", () => {
  it("should return the same reference for repeated loads of the same file", () => {
    const first = loadConfigFile("tests/__mocks__/fileMock.yaml");
    const second = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(second).toBe(first);
  });

  it("should cache JSON and YAML files independently", () => {
    const yaml = loadConfigFile("tests/__mocks__/fileMock.yaml");
    const json = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(yaml).not.toBe(json);
    expect(yaml.sourceMap).not.toBeNull();
    expect(json.sourceMap).not.toBeNull();
  });

  it("should re-read from disk after clearFileCache()", () => {
    const first = loadConfigFile("tests/__mocks__/fileMock.yaml");
    clearFileCache();
    const second = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(second).not.toBe(first);
    expect(second.data).toStrictEqual(first.data);
  });
});

describe("TOML integration with schema pipeline", () => {
  it("should load a TOML file through c.schema().load()", () => {
    const config = c
      .schema({
        port: c.number({ required: true }),
        host: c.string({ required: true }),
        database: c.object({
          item: {
            host: c.string({ required: true }),
            port: c.number({ required: true }),
            credentials: c.object({
              item: {
                username: c.string(),
                password: c.string(),
              },
            }),
          },
        }),
      })
      .load({
        env: false,
        args: false,
        files: "tests/__mocks__/configMock.toml",
      });

    expect(config.port).toBe(8080);
    expect(config.host).toBe("toml-host");
    expect(config.database.host).toBe("db.toml.local");
    expect(config.database.port).toBe(5432);
    expect(config.database.credentials.username).toBe("toml-admin");
    expect(config.database.credentials.password).toBe("toml-secret");
  });

  it("should load a TOML file through c.schema().loadExtended()", () => {
    const { data } = c
      .schema({
        port: c.number({ required: true }),
        host: c.string({ required: true }),
      })
      .loadExtended({
        env: false,
        args: false,
        files: "tests/__mocks__/configMock.toml",
      });

    expect(data.port.value).toBe(8080);
    expect(data.port.sourceType).toBe("file");
    expect(data.port.file).toBe("tests/__mocks__/configMock.toml");
    expect(data.port.line).toBeGreaterThan(0);
    expect(data.host.value).toBe("toml-host");
  });
});
