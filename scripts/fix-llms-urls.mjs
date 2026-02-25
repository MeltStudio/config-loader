/**
 * Workaround for docusaurus-plugin-llms bugs when baseUrl != "/" and
 * routeBasePath is customised.
 *
 * Bug 1 – baseUrl stripped: The plugin constructs URLs with
 *   `new URL(siteUrl).origin`, which drops the pathname (baseUrl).
 *   e.g. https://meltstudio.github.io/docs/intro
 *        → https://meltstudio.github.io/config-loader/docs/intro
 *
 * Bug 2 – routeBasePath ignored: The plugin derives URL paths from the
 *   filesystem (docs/intro.md → /docs/intro) instead of honouring
 *   routeBasePath: "/" and slug frontmatter.
 *   e.g. https://meltstudio.github.io/config-loader/docs/intro
 *        → https://meltstudio.github.io/config-loader/
 *
 * See: https://github.com/fleeting/docusaurus-plugin-llms (processor.ts L146-147)
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUILD_DIR = join(import.meta.dirname, "..", "build");
const SITE_ORIGIN = "https://meltstudio.github.io";
const BASE_URL = "/config-loader/";
const SITE_ROOT = `${SITE_ORIGIN}${BASE_URL}`;

// Map of wrong paths → correct paths (relative to site root).
// The plugin derives paths from the filesystem; these map them to the
// actual Docusaurus routes based on routeBasePath and slug frontmatter.
const PATH_FIXES = new Map([
  // docs/intro.md has slug: / and routeBasePath: "/"
  ["docs/intro", ""],
]);

const files = ["llms.txt", "llms-full.txt"];

for (const file of files) {
  const filePath = join(BUILD_DIR, file);
  if (!existsSync(filePath)) continue;

  let content = readFileSync(filePath, "utf-8");
  let changed = false;

  // Fix 1: Add missing baseUrl prefix.
  // Replace origin-only URLs but skip URLs that already have the baseUrl.
  const baseUrlFixed = content.replaceAll(
    `${SITE_ORIGIN}/`,
    `${SITE_ORIGIN}${BASE_URL}`,
  );
  // Deduplicate in case the plugin is ever fixed upstream.
  content = baseUrlFixed.replaceAll(
    `${SITE_ROOT}${BASE_URL.slice(1)}`,
    SITE_ROOT,
  );

  // Fix 2: Rewrite filesystem-derived paths to actual routes.
  for (const [wrong, correct] of PATH_FIXES) {
    const wrongUrl = `${SITE_ROOT}${wrong}`;
    const correctUrl = `${SITE_ROOT}${correct}`;
    if (wrongUrl !== correctUrl) {
      content = content.replaceAll(wrongUrl, correctUrl);
    }
  }

  if (content !== readFileSync(filePath, "utf-8")) {
    writeFileSync(filePath, content, "utf-8");
    changed = true;
  }

  console.log(changed ? `Fixed URLs in ${file}` : `No fix needed for ${file}`);
}
