import { ConfigFileError } from "@/errors";
import { loadConfigFile } from "@/fileLoader";

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

  it("should return null sourceMap for JSON files", () => {
    const { sourceMap } = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(sourceMap).toBeNull();
  });

  it("should throw ConfigFileError for invalid YAML", () => {
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.yaml")).toThrow(
      ConfigFileError
    );
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.yaml")).toThrow(
      /Failed to parse config file/
    );
  });

  it("should throw ConfigFileError for invalid JSON", () => {
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.json")).toThrow(
      ConfigFileError
    );
    expect(() => loadConfigFile("tests/__mocks__/invalidSyntax.json")).toThrow(
      /Failed to parse config file/
    );
  });
});
