import * as fs from "fs";

import { clearFileCache } from "@/fileLoader";
import type { Node } from "@/option";
import Settings from "@/settings";
import { validateFiles } from "@/sourceValidation";
import type { SchemaValue, SettingsSources } from "@/types";

import type { ConfigChange } from "./diffConfig";
import { diffConfig } from "./diffConfig";

/** Options for the `watch()` method. */
export interface WatchOptions<T> {
  /** Called after a successful reload with the new config, old config, and list of changes. */
  onChange: (newConfig: T, oldConfig: T, changes: ConfigChange[]) => void;
  /** Called when a reload fails (parse error, validation error). The previous config is retained. */
  onError?: (error: Error) => void;
  /** Debounce interval in milliseconds. Default: 100. */
  debounce?: number;
}

/** Handle returned by `watch()`. Provides access to the current config and a `close()` method. */
export interface ConfigWatcher<T> {
  /** The current resolved configuration. Updated on each successful reload. */
  readonly config: T;
  /** Stop watching all files. Idempotent. */
  close(): void;
}

function resolveFilePaths(sources: SettingsSources<unknown>): string[] {
  const paths: string[] = [];

  // Config files
  const configFiles = validateFiles(
    sources.files ?? false,
    sources.dir ?? false,
  );
  if (Array.isArray(configFiles)) {
    paths.push(...configFiles);
  } else if (configFiles) {
    paths.push(configFiles);
  }

  // Env files
  if (sources.envFile) {
    const envFiles = Array.isArray(sources.envFile)
      ? sources.envFile
      : [sources.envFile];
    paths.push(...envFiles);
  }

  return paths;
}

/**
 * Creates a file watcher that reloads config on changes.
 * All `fs.watch` handles are `.unref()`'d so they don't keep the process alive.
 */
export function createWatcher<T extends Node>(
  schema: T,
  sources: SettingsSources<SchemaValue<T>>,
  options: WatchOptions<SchemaValue<T>>,
): ConfigWatcher<SchemaValue<T>> {
  const debounceMs = options.debounce ?? 100;

  // Initial load — throws on failure (not caught by onError)
  const initialSettings = new Settings(schema, sources);
  let currentConfig = initialSettings.get() as SchemaValue<T>;

  const filePaths = resolveFilePaths(sources);
  const watchers: fs.FSWatcher[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  function reload(): void {
    if (closed) return;

    try {
      clearFileCache();
      const settings = new Settings(schema, sources);
      const newConfig = settings.get() as SchemaValue<T>;

      const changes = diffConfig(
        currentConfig as Record<string, unknown>,
        newConfig as Record<string, unknown>,
        schema,
      );

      if (changes.length > 0) {
        const oldConfig = currentConfig;
        currentConfig = newConfig;
        options.onChange(newConfig, oldConfig, changes);
      }
    } catch (err) {
      if (options.onError) {
        options.onError(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }

  function scheduleReload(): void {
    if (closed) return;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(reload, debounceMs);
    debounceTimer.unref();
  }

  // Watch each file
  for (const filePath of filePaths) {
    try {
      const watcher = fs.watch(filePath, () => {
        scheduleReload();
      });
      watcher.unref();
      watchers.push(watcher);
    } catch {
      // File may not exist yet or may not be watchable — skip silently
    }
  }

  // If using dir, also watch the directory itself for new/deleted files
  if (sources.dir && typeof sources.dir === "string") {
    try {
      const dirWatcher = fs.watch(sources.dir, () => {
        scheduleReload();
      });
      dirWatcher.unref();
      watchers.push(dirWatcher);
    } catch {
      // Directory may not be watchable
    }
  }

  function close(): void {
    if (closed) return;
    closed = true;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    for (const watcher of watchers) {
      watcher.close();
    }
    watchers.length = 0;
  }

  return {
    get config(): SchemaValue<T> {
      return currentConfig;
    },
    close,
  };
}
