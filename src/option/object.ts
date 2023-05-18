import type { Node } from "./base";
import OptionBase from "./base";

interface ObjectOptionClassParams {
  required: boolean;
  item: Node;
}
export default class ObjectOption extends OptionBase {
  item: Node;

  constructor(params: ObjectOptionClassParams) {
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
