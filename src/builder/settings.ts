import type { Node } from "@/option";
import Settings from "@/settings";
import type { ExtendedResult, SchemaValue, SettingsSources } from "@/types";

export class SettingsBuilder<T extends Node> {
  private readonly schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  public load(sources: SettingsSources<SchemaValue<T>>): SchemaValue<T> {
    const settings = new Settings(this.schema, sources);
    return settings.get();
  }

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
