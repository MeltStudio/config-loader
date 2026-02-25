import ConfigNode from "@/nodes/configNode";
import ConfigNodeArray from "@/nodes/configNodeArray";
import { printConfig } from "@/printConfig";
import type { ExtendedResult } from "@/types";

function makeNode(
  value: unknown,
  path: string,
  sourceType: "file" | "env" | "envFile" | "args" | "default",
  opts?: {
    file?: string;
    variableName?: string;
    argName?: string;
    line?: number;
    column?: number;
  },
): ConfigNode {
  return new ConfigNode(
    value as string,
    path,
    sourceType,
    opts?.file ?? null,
    opts?.variableName ?? null,
    opts?.argName ?? null,
    opts?.line ?? null,
    opts?.column ?? null,
  );
}

describe("printConfig", () => {
  it("should format a simple config table", () => {
    const result: ExtendedResult = {
      data: {
        host: makeNode("localhost", "host", "default"),
        port: makeNode(8080, "port", "env", { variableName: "PORT" }),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("host");
    expect(output).toContain("localhost");
    expect(output).toContain("default");
    expect(output).toContain("port");
    expect(output).toContain("8080");
    expect(output).toContain("env");
    expect(output).toContain("PORT");
  });

  it("should show file source with line and column", () => {
    const result: ExtendedResult = {
      data: {
        host: makeNode("db.local", "host", "file", {
          file: "config.yaml",
          line: 3,
          column: 5,
        }),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("config.yaml:3:5");
  });

  it("should show CLI args with -- prefix", () => {
    const result: ExtendedResult = {
      data: {
        debug: makeNode(true, "debug", "args", { argName: "debug" }),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("--debug");
  });

  it("should show envFile source with file path and variable name", () => {
    const result: ExtendedResult = {
      data: {
        apiKey: makeNode("secret123", "apiKey", "envFile", {
          file: ".env",
          variableName: "API_KEY",
          line: 2,
          column: 1,
        }),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain(".env:2:1");
    expect(output).toContain("(API_KEY)");
  });

  it("should handle nested objects", () => {
    const result: ExtendedResult = {
      data: {
        db: {
          host: makeNode("localhost", "db.host", "file", {
            file: "config.yaml",
          }),
          port: makeNode(5432, "db.port", "default"),
        },
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("db.host");
    expect(output).toContain("db.port");
  });

  it("should handle arrays with ConfigNodeArray", () => {
    const arrayNode = makeNode(null, "tags", "file", { file: "config.yaml" });
    arrayNode.value = new ConfigNodeArray([
      makeNode("prod", "tags[0]", "file", { file: "config.yaml", line: 10 }),
      makeNode("web", "tags[1]", "file", { file: "config.yaml", line: 11 }),
    ]);

    const result: ExtendedResult = {
      data: { tags: arrayNode },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("tags[0]");
    expect(output).toContain("prod");
    expect(output).toContain("tags[1]");
    expect(output).toContain("web");
  });

  it("should handle arrays of objects with ConfigNodeArray", () => {
    const arrayNode = makeNode(null, "servers", "file", {
      file: "config.yaml",
    });
    const serverNode0 = makeNode(null, "servers[0]", "file", {
      file: "config.yaml",
    });
    serverNode0.value = {
      host: makeNode("db1.local", "servers[0].host", "file", {
        file: "config.yaml",
        line: 5,
      }),
      port: makeNode(5432, "servers[0].port", "file", {
        file: "config.yaml",
        line: 6,
      }),
    } as unknown as typeof serverNode0.value;

    arrayNode.value = new ConfigNodeArray([serverNode0]);

    const result: ExtendedResult = {
      data: { servers: arrayNode },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("servers[0].host");
    expect(output).toContain("db1.local");
    expect(output).toContain("servers[0].port");
    expect(output).toContain("5432");
  });

  it("should truncate long values", () => {
    const longValue = "a".repeat(100);
    const result: ExtendedResult = {
      data: {
        key: makeNode(longValue, "key", "default"),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true, maxValueLength: 20 });
    expect(output).toContain("aaaaaaaaaaaaaaaaa...");
    expect(output).not.toContain(longValue);
  });

  it("should show warnings", () => {
    const result: ExtendedResult = {
      data: {
        port: makeNode(8080, "port", "env", { variableName: "PORT" }),
      },
      warnings: [
        "The option port is stated as a number but is provided as a string",
      ],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toContain("Warnings:");
    expect(output).toContain(
      "The option port is stated as a number but is provided as a string",
    );
  });

  it("should handle empty config", () => {
    const result: ExtendedResult = {
      data: {},
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toBe("No configuration values loaded.");
  });

  it("should print to console by default", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const result: ExtendedResult = {
      data: {
        port: makeNode(3000, "port", "default"),
      },
      warnings: [],
    };

    printConfig(result);
    expect(consoleSpy).toHaveBeenCalledTimes(1);
    expect(consoleSpy.mock.calls[0][0]).toContain("port");
    consoleSpy.mockRestore();
  });

  it("should not print to console when silent is true", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation();
    const result: ExtendedResult = {
      data: {
        port: makeNode(3000, "port", "default"),
      },
      warnings: [],
    };

    printConfig(result, { silent: true });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("should draw proper table borders", () => {
    const result: ExtendedResult = {
      data: {
        port: makeNode(3000, "port", "default"),
      },
      warnings: [],
    };

    const output = printConfig(result, { silent: true });
    expect(output).toMatch(/^┌/);
    expect(output).toMatch(/┘$/);
    expect(output).toContain("├");
    expect(output).toContain("┤");
    expect(output).toContain("│ Path");
    expect(output).toContain("│ Value");
    expect(output).toContain("│ Source");
    expect(output).toContain("│ Detail");
  });
});
