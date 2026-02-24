import * as fs from "fs";
import yaml from "js-yaml";
import * as path from "path";

import type { ConfigFileData } from "@/types";

/**
 * Loads a config file and parses it based on its extension.
 * - `.json` files are parsed with JSON.parse
 * - `.yaml` / `.yml` files (and any other extension as fallback) are parsed with js-yaml
 */
export function loadConfigFile(filePath: string): ConfigFileData {
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".json") {
    return JSON.parse(content) as ConfigFileData;
  }

  return yaml.load(content) as ConfigFileData;
}
