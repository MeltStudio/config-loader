import * as fs from "fs";
import yaml from "js-yaml";
import SourceMap from "js-yaml-source-map";
import * as path from "path";

import { ConfigFileError } from "@/errors";
import type { ConfigFileData } from "@/types";

export interface LoadResult {
  data: ConfigFileData;
  sourceMap: SourceMap | null;
}

const fileCache = new Map<string, LoadResult>();

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
        sourceMap: null,
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
      `Failed to parse config file '${filePath}': ${message}`
    );
  }
}

export function clearFileCache(): void {
  fileCache.clear();
}
