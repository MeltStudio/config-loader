import * as fs from "fs";
import yaml from "js-yaml";
import SourceMap from "js-yaml-source-map";
import * as path from "path";

import { ConfigFileError } from "@/errors";
import type { ConfigFileData } from "@/types";

interface SourceLocation {
  line: number;
  column: number;
  position: number;
}

interface SourceMapLike {
  lookup(path: string | string[]): SourceLocation | undefined;
}

export interface LoadResult {
  data: ConfigFileData;
  sourceMap: SourceMapLike | null;
}

const fileCache = new Map<string, LoadResult>();

class JsonSourceMap implements SourceMapLike {
  private locations = new Map<string, SourceLocation>();

  constructor(content: string) {
    this.buildMap(content);
  }

  private buildMap(content: string, prefix: string[] = []): void {
    const lines = content.split("\n");
    // Match "key": patterns and record their positions
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match JSON keys: optional whitespace, then "key" followed by :
      const keyRegex = /^(\s*)"([^"]+)"\s*:/g;
      let match;
      while ((match = keyRegex.exec(line)) !== null) {
        const key = match[2];
        const column = match[1].length + 1; // 1-based, position of the opening quote
        this.locations.set(key, {
          line: i + 1,
          column,
          position: 0,
        });
      }
    }

    // Now do a recursive walk of the parsed data to build full paths
    try {
      const data = JSON.parse(content) as Record<string, unknown>;
      this.walkObject(data, prefix, lines);
    } catch {
      // If parsing fails, we still have top-level keys
    }
  }

  private walkObject(
    obj: Record<string, unknown>,
    prefix: string[],
    lines: string[],
  ): void {
    for (const key of Object.keys(obj)) {
      const fullPath = [...prefix, key].join(".");
      // Find the key in the content and record its position
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const keyPattern = `"${key}"`;
        const idx = line.indexOf(keyPattern);
        if (idx !== -1) {
          // Verify it's followed by a colon (it's a key, not a value)
          const afterKey = line.slice(idx + keyPattern.length).trim();
          if (afterKey.startsWith(":")) {
            this.locations.set(fullPath, {
              line: i + 1,
              column: idx + 1,
              position: 0,
            });
            break;
          }
        }
      }

      const val = obj[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        this.walkObject(
          val as Record<string, unknown>,
          [...prefix, key],
          lines,
        );
      }
    }
  }

  lookup(path: string | string[]): SourceLocation | undefined {
    const key = Array.isArray(path) ? path.join(".") : path;
    return this.locations.get(key);
  }
}

/**
 * Loads a config file and parses it based on its extension.
 * - `.json` files are parsed with JSON.parse
 * - `.yaml` / `.yml` files (and any other extension as fallback) are parsed with js-yaml
 * Throws ConfigFileError if the file cannot be parsed.
 * Results are cached by file path — repeated calls for the same path skip disk I/O.
 */
export function loadConfigFile(filePath: string): LoadResult {
  const cached = fileCache.get(filePath);
  if (cached) return cached;

  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".json") {
      const result: LoadResult = {
        data: JSON.parse(content) as ConfigFileData,
        sourceMap: new JsonSourceMap(content),
      };
      fileCache.set(filePath, result);
      return result;
    }

    const sourceMap = new SourceMap();
    const data = yaml.load(content, { listener: sourceMap.listen() });
    const result: LoadResult = { data: data as ConfigFileData, sourceMap };
    fileCache.set(filePath, result);
    return result;
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown parsing error";
    throw new ConfigFileError(
      `Failed to parse config file '${filePath}': ${message}`,
    );
  }
}

export function clearFileCache(): void {
  fileCache.clear();
}
