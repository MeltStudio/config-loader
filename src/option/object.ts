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
