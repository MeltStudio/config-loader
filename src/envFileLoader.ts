import * as fs from "fs";

export interface EnvFileEntry {
  value: string;
  line: number;
  column: number;
}

export interface EnvFileResult {
  entries: Map<string, EnvFileEntry>;
  filePath: string;
}

const envFileCache = new Map<string, EnvFileResult>();

/**
 * Parses a .env file into a map of key→value entries with line/column metadata.
 * - Lines starting with # are comments
 * - Empty/whitespace-only lines are skipped
 * - Format: KEY=VALUE (trimmed)
 * - Quoted values ("..." or '...') have quotes stripped
 * - No variable expansion
 * Results are cached by file path.
 */
export function loadEnvFile(filePath: string): EnvFileResult {
  const cached = envFileCache.get(filePath);
  if (cached) return cached;

  const content = fs.readFileSync(filePath, "utf-8");
  const entries = new Map<string, EnvFileEntry>();
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    if (key === "") continue;

    let value = trimmed.slice(eqIndex + 1).trim();

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Column is 1-based, pointing to the start of the key in the raw line
    const column = raw.indexOf(key) + 1;

    entries.set(key, {
      value,
      line: i + 1,
      column,
    });
  }

  const result: EnvFileResult = { entries, filePath };
  envFileCache.set(filePath, result);
  return result;
}

export function clearEnvFileCache(): void {
  envFileCache.clear();
}
