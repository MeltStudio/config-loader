import ConfigNode from "@/nodes/configNode";
import ConfigNodeArray from "@/nodes/configNodeArray";
import type { ExtendedResult, NodeTree } from "@/types";

interface Row {
  path: string;
  value: string;
  source: string;
  detail: string;
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max - 3) + "...";
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "object") return JSON.stringify(val) ?? "";
  if (typeof val === "string") return val;
  return `${val as number | boolean}`;
}

function formatDetail(node: ConfigNode): string {
  const parts: string[] = [];

  if (node.sourceType === "file" || node.sourceType === "envFile") {
    if (node.file) {
      let loc = node.file;
      if (node.line != null) {
        loc += `:${node.line}`;
        if (node.column != null) loc += `:${node.column}`;
      }
      parts.push(loc);
    }
    if (node.sourceType === "envFile" && node.variableName) {
      parts.push(`(${node.variableName})`);
    }
  } else if (node.sourceType === "env" && node.variableName) {
    parts.push(node.variableName);
  } else if (node.sourceType === "args" && node.argName) {
    parts.push(`--${node.argName}`);
  }

  return parts.join(" ");
}

function flattenTree(tree: NodeTree, prefix: string = ""): Row[] {
  const rows: Row[] = [];

  for (const [key, entry] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (entry instanceof ConfigNode) {
      if (entry.value instanceof ConfigNodeArray) {
        for (let i = 0; i < entry.value.arrayValues.length; i++) {
          const child = entry.value.arrayValues[i];
          const arrayPath = `${path}[${i}]`;
          if (
            child.value &&
            typeof child.value === "object" &&
            !(child.value instanceof ConfigNodeArray)
          ) {
            const nested = child.value as unknown as NodeTree;
            rows.push(...flattenTree(nested, arrayPath));
          } else {
            rows.push({
              path: arrayPath,
              value: formatValue(child.value),
              source: child.sourceType,
              detail: formatDetail(child),
            });
          }
        }
      } else {
        rows.push({
          path,
          value: formatValue(entry.value),
          source: entry.sourceType,
          detail: formatDetail(entry),
        });
      }
    } else {
      rows.push(...flattenTree(entry, path));
    }
  }

  return rows;
}

function padRight(str: string, len: number): string {
  return str + " ".repeat(Math.max(0, len - str.length));
}

function buildTable(rows: Row[]): string {
  const headers = {
    path: "Path",
    value: "Value",
    source: "Source",
    detail: "Detail",
  };
  const widths = {
    path: Math.max(headers.path.length, ...rows.map((r) => r.path.length)),
    value: Math.max(headers.value.length, ...rows.map((r) => r.value.length)),
    source: Math.max(
      headers.source.length,
      ...rows.map((r) => r.source.length),
    ),
    detail: Math.max(
      headers.detail.length,
      ...rows.map((r) => r.detail.length),
    ),
  };

  const hr = `├${"─".repeat(widths.path + 2)}┼${"─".repeat(widths.value + 2)}┼${"─".repeat(widths.source + 2)}┼${"─".repeat(widths.detail + 2)}┤`;
  const top = `┌${"─".repeat(widths.path + 2)}┬${"─".repeat(widths.value + 2)}┬${"─".repeat(widths.source + 2)}┬${"─".repeat(widths.detail + 2)}┐`;
  const bottom = `└${"─".repeat(widths.path + 2)}┴${"─".repeat(widths.value + 2)}┴${"─".repeat(widths.source + 2)}┴${"─".repeat(widths.detail + 2)}┘`;

  const formatRow = (r: {
    path: string;
    value: string;
    source: string;
    detail: string;
  }): string =>
    `│ ${padRight(r.path, widths.path)} │ ${padRight(r.value, widths.value)} │ ${padRight(r.source, widths.source)} │ ${padRight(r.detail, widths.detail)} │`;

  const lines = [top, formatRow(headers), hr, ...rows.map(formatRow), bottom];
  return lines.join("\n");
}

/**
 * Formats the result of `loadExtended()` as a readable table showing each
 * resolved value and where it came from.
 *
 * @param result - The `ExtendedResult` returned by `loadExtended()`.
 * @param options - Optional settings.
 * @param options.maxValueLength - Maximum length for value column (default: 50). Values longer than this are truncated.
 * @returns The formatted table string. Also printed to `console.log` unless `options.silent` is `true`.
 *
 * @example
 * ```ts
 * const result = c.schema({ port: c.number({ env: "PORT" }) }).loadExtended({ env: true, args: false });
 * printConfig(result);
 * ```
 */
export function printConfig(
  result: ExtendedResult,
  options?: { silent?: boolean; maxValueLength?: number },
): string {
  const maxLen = options?.maxValueLength ?? 50;
  const rows = flattenTree(result.data).map((r) => ({
    ...r,
    value: truncate(r.value, maxLen),
  }));

  let output: string;

  if (rows.length === 0) {
    output = "No configuration values loaded.";
  } else {
    output = buildTable(rows);
  }

  if (result.warnings.length > 0) {
    output += "\n\nWarnings:";
    for (const w of result.warnings) {
      output += `\n  - ${w}`;
    }
  }

  if (!options?.silent) {
    console.log(output);
  }

  return output;
}
