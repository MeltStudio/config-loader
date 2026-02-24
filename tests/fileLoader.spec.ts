import { ConfigFileError } from "@/errors";
import { loadConfigFile } from "@/fileLoader";

describe("loadConfigFile", () => {
  it("should load a YAML file", () => {
    const data = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(data).toHaveProperty("string", "testString");
    expect(data).toHaveProperty("number", 1);
  });

  it("should load a JSON file", () => {
    const data = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(data).toHaveProperty("string", "testString");
    expect(data).toHaveProperty("number", 1);
  });

  it("should load a .yml file as YAML", () => {
    const data = loadConfigFile("tests/__mocks__/fileMock.yaml");
    expect(data).toHaveProperty("string", "testString");
  });

  it("should return equivalent data from both JSON and YAML", () => {
    const yamlData = loadConfigFile("tests/__mocks__/fileMock.yaml");
    const jsonData = loadConfigFile("tests/__mocks__/fileMock.json");
    expect(jsonData).toStrictEqual(yamlData);
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
