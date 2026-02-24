import type { Node } from "./base";
import OptionBase from "./base";

interface ObjectOptionClassParams<T extends Node> {
  required: boolean;
  item: T;
}

export default class ObjectOption<
  T extends Node = Node
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
