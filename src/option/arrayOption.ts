import type { ArrayValue, OptionKind } from "@/types";

class ArrayValueContainer {
  public readonly val: ArrayValue;

  public readonly item: OptionKind;

  constructor(item: OptionKind, val: ArrayValue) {
    this.val = val;
    this.item = item;
  }
}

export default ArrayValueContainer;
