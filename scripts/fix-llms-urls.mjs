/**
 * Workaround for docusaurus-plugin-llms baseUrl bug.
 *
 * The plugin constructs URLs with `new URL(siteUrl).origin`, which strips
 * the pathname (baseUrl). This script patches the generated llms*.txt files
 * so that links include the correct /config-loader/ prefix.
 *
 * See: https://github.com/fleeting/docusaurus-plugin-llms (processor.ts L146-147)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = join(import.meta.dirname, "..", "build");
const SITE_ORIGIN = "https://meltstudio.github.io";
const BASE_URL = "/config-loader/";

const files = ["llms.txt", "llms-full.txt"];

for (const file of files) {
  const filePath = join(BUILD_DIR, file);
  if (!existsSync(filePath)) continue;

  const content = readFileSync(filePath, "utf-8");

  // Replace origin-only URLs with origin + baseUrl.
  // Matches https://meltstudio.github.io/docs/... but NOT
  // https://meltstudio.github.io/config-loader/... (already correct).
  const fixed = content.replaceAll(
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}${BASE_URL}`,
  );

  // Avoid double-prefixing if the plugin is ever fixed.
  const dedoubled = fixed.replaceAll(
    `${SITE_ORIGIN}${BASE_URL}${BASE_URL.slice(1)}`,
    `${SITE_ORIGIN}${BASE_URL}`,
  );

  if (dedoubled !== content) {
    writeFileSync(filePath, dedoubled, "utf-8");
    console.log(`Fixed baseUrl in ${file}`);
  } else {
    console.log(`No fix needed for ${file}`);
  }
}
