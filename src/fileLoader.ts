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

/**
 * Loads a config file and parses it based on its extension.
 * - `.json` files are parsed with JSON.parse
 * - `.yaml` / `.yml` files (and any other extension as fallback) are parsed with js-yaml
 * Throws ConfigFileError if the file cannot be parsed.
 */
export function loadConfigFile(filePath: string): LoadResult {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  try {
    if (ext === ".json") {
      return { data: JSON.parse(content) as ConfigFileData, sourceMap: null };
    }

    const sourceMap = new SourceMap();
    const data = yaml.load(content, { listener: sourceMap.listen() });
    return { data: data as ConfigFileData, sourceMap };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown parsing error";
    throw new ConfigFileError(
      `Failed to parse config file '${filePath}': ${message}`
    );
  }
}
