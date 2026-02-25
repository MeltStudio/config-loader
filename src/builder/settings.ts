import type { Node } from "@/option";
import Settings from "@/settings";
import type { ExtendedResult, SchemaValue, SettingsSources } from "@/types";

/** Fluent builder that takes a schema and resolves configuration from multiple sources. */
export class SettingsBuilder<T extends Node> {
  private readonly schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  /**
   * Loads and validates configuration, returning a fully-typed plain object.
   * @param sources - Which sources to read (env, args, files, etc.).
   * @returns The resolved configuration object matching the schema type.
   * @throws {ConfigLoadError} If validation fails (missing required fields, type errors, etc.).
   */
  public load(sources: SettingsSources<SchemaValue<T>>): SchemaValue<T> {
    const settings = new Settings(this.schema, sources);
    return settings.get();
  }

  /**
   * Loads configuration and returns raw node data with source metadata alongside warnings.
   * @param sources - Which sources to read (env, args, files, etc.).
   * @returns An `ExtendedResult` containing the node tree and any warnings.
   * @throws {ConfigLoadError} If validation fails.
   */
  public loadExtended(
    sources: SettingsSources<SchemaValue<T>>,
  ): ExtendedResult {
    const settings = new Settings(this.schema, sources);
    return {
      data: settings.getExtended(),
      warnings: settings.getWarnings(),
    };
  }
}
