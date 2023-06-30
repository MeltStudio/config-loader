import type { Node } from "@/option";
import Settings from "@/settings";
import type { SettingsSources } from "@/types";

export class SettingsBuilder {
  private readonly schema: Node;

  constructor(schema: Node) {
    this.schema = schema;
  }

  public load<T>(sources: SettingsSources<T>): T {
    const settings = new Settings(this.schema, sources);
    return settings.get();
  }
}
