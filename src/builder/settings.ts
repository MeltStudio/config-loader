import type { Node } from "@/option";
import type { SchemaValue } from "@/settings";
import Settings from "@/settings";
import type { SettingsSources } from "@/types";

export class SettingsBuilder<T extends Node> {
  private readonly schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  public load(sources: SettingsSources<SchemaValue<T>>): SchemaValue<T> {
    const settings = new Settings(this.schema, sources);
    return settings.get();
  }
}
