import { OptionKind } from "./types";

class ArrayValueContainer {
  public readonly val: Array<any>;
  public readonly item: OptionKind;

  constructor(item: OptionKind, val: Array<any>) {
    this.val = val;
    this.item = item;
  }
}

export default ArrayValueContainer;
