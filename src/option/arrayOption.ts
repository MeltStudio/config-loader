import type { ArrayValue } from "@/types";

import type { OptionTypes } from ".";

class ArrayValueContainer {
  public readonly val: ArrayValue;

  public readonly item: OptionTypes;

  constructor(item: OptionTypes, val: ArrayValue) {
    this.val = val;
    this.item = item;
  }
}

export default ArrayValueContainer;
