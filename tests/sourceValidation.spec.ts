import { loadEnvFiles } from "../src/sourceValidation";

describe("loadEnvFiles", () => {
  it("should skip envData entries with undefined values", () => {
    const envData: { [key: string]: string | undefined } = {
      DEFINED_KEY: "value",
      UNDEFINED_KEY: undefined,
    };
    const { mergedEnvData } = loadEnvFiles(
      "tests/__mocks__/settings/env-file/.env",
      envData,
    );
    // DEFINED_KEY from envData should override .env values
    expect(mergedEnvData.DEFINED_KEY).toBe("value");
    // UNDEFINED_KEY should not appear in merged data (skipped by the undefined check)
    expect(mergedEnvData.UNDEFINED_KEY).toBeUndefined();
    // .env file values should still be present
    expect(mergedEnvData.DB_HOST).toBe("localhost");
  });
});
