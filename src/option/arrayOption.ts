import type { ArrayValue } from "@/types";

import type { Node, OptionTypes } from ".";

class ArrayValueContainer {
  public readonly val: ArrayValue;

  public readonly item: Node | OptionTypes;

  constructor(item: Node | OptionTypes, val: ArrayValue) {
    this.val = val;
    this.item = item;
  }
}

export default ArrayValueContainer;
