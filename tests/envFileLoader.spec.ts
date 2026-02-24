import * as fs from "fs";

import { clearEnvFileCache, loadEnvFile } from "@/envFileLoader";

afterEach(() => {
  clearEnvFileCache();
});

describe("loadEnvFile", () => {
  it("should parse basic KEY=VALUE pairs", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(entries.get("DB_HOST")).toEqual(
      expect.objectContaining({ value: "localhost" }),
    );
    expect(entries.get("DEBUG")).toEqual(
      expect.objectContaining({ value: "true" }),
    );
  });

  it("should skip comments and blank lines", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    // Comments starting with # should not appear as keys
    const keys = Array.from(entries.keys());
    expect(keys).not.toContain("#");
    expect(keys).not.toContain("# Database config");
    // Only actual key-value pairs should be present
    expect(keys).toContain("DB_HOST");
    expect(keys).toContain("DB_PORT");
    expect(keys).toContain("DB_PASSWORD");
    expect(keys).toContain("APP_NAME");
    expect(keys).toContain("DEBUG");
    expect(keys).toContain("EMPTY_VAL");
  });

  it("should strip double quotes from values", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(entries.get("DB_PASSWORD")!.value).toBe("s3cret");
  });

  it("should strip single quotes from values", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(entries.get("APP_NAME")!.value).toBe("My App");
  });

  it("should handle empty values", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(entries.get("EMPTY_VAL")!.value).toBe("");
  });

  it("should track line numbers correctly", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    // Line 1 is "# Database config" (comment)
    // Line 2 is DB_HOST=localhost
    expect(entries.get("DB_HOST")!.line).toBe(2);
    // Line 3 is DB_PORT=5432
    expect(entries.get("DB_PORT")!.line).toBe(3);
    // Line 4 is DB_PASSWORD="s3cret"
    expect(entries.get("DB_PASSWORD")!.line).toBe(4);
  });

  it("should track column numbers correctly", () => {
    const { entries } = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    // Keys start at column 1 (no leading whitespace)
    expect(entries.get("DB_HOST")!.column).toBe(1);
    expect(entries.get("DB_PORT")!.column).toBe(1);
  });

  it("should store the filePath", () => {
    const result = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(result.filePath).toBe("tests/__mocks__/settings/env-file/.env");
  });

  it("should cache results for repeated calls", () => {
    const first = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    const second = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(second).toBe(first);
  });

  it("should re-read from disk after clearEnvFileCache()", () => {
    const first = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    clearEnvFileCache();
    const second = loadEnvFile("tests/__mocks__/settings/env-file/.env");
    expect(second).not.toBe(first);
    expect(second.entries.get("DB_HOST")!.value).toBe(
      first.entries.get("DB_HOST")!.value,
    );
  });

  it("should throw for missing files", () => {
    expect(() => loadEnvFile("tests/__mocks__/nonexistent.env")).toThrow();
  });

  it("should skip lines without = sign", () => {
    // Create a temporary .env file with an invalid line
    const tmpPath = "tests/__mocks__/tmp_test.env";
    fs.writeFileSync(tmpPath, "VALID=yes\nINVALID_LINE\nALSO_VALID=yes\n");
    try {
      const { entries } = loadEnvFile(tmpPath);
      expect(entries.has("VALID")).toBe(true);
      expect(entries.has("INVALID_LINE")).toBe(false);
      expect(entries.has("ALSO_VALID")).toBe(true);
    } finally {
      clearEnvFileCache();
      fs.unlinkSync(tmpPath);
    }
  });

  it("should handle values containing = signs", () => {
    const tmpPath = "tests/__mocks__/tmp_eq.env";
    fs.writeFileSync(
      tmpPath,
      "CONNECTION=postgres://user:pass@host/db?opt=val\n",
    );
    try {
      const { entries } = loadEnvFile(tmpPath);
      expect(entries.get("CONNECTION")!.value).toBe(
        "postgres://user:pass@host/db?opt=val",
      );
    } finally {
      clearEnvFileCache();
      fs.unlinkSync(tmpPath);
    }
  });
});
