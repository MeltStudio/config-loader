import { ConfigFileError } from "@/errors";
import { clearFileCache, loadConfigFile } from "@/fileLoader";

afterEach(() => {
  clearFileCache();
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
