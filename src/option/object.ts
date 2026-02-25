import type { StandardSchemaV1 } from "@/types";

import type { Node } from "./base";
import OptionBase from "./base";

interface ObjectOptionClassParams<T extends Node> {
  required: boolean;
  item: T;
  validate?: StandardSchemaV1;
}

export default class ObjectOption<
  T extends Node = Node,
> extends OptionBase<"object"> {
  item: T;

  constructor(params: ObjectOptionClassParams<T>) {
    // Detect common mistake: passing schema fields directly instead of wrapping in { item: { ... } }
    if (!params.item) {
      const hasOptionValues = Object.values(params).some(
        (v) => v instanceof OptionBase,
      );
      if (hasOptionValues) {
        throw new Error(
          "Invalid c.object() call: schema fields were passed directly instead of wrapped in { item: { ... } }. " +
            "Use c.object({ item: { host: c.string() } }) instead of c.object({ host: c.string() }).",
        );
      }
      throw new Error(
        "Invalid c.object() call: missing required 'item' property. " +
          "Use c.object({ item: { host: c.string(), port: c.number() } }).",
      );
    }

    super({
      kind: "object",
      env: null,
      cli: false,
      help: "",
      ...params,
    });
    this.item = params.item;
  }
}
