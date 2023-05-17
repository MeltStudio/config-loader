export type OptionKind =
  | "boolean"
  | "string"
  | "number"
  | "any"
  | "array"
  | "object";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArrayOptionVal = Array<any>;
class ArrayOptionWrapper {
  public readonly val: ArrayOptionVal;

  public readonly item: OptionKind;

  constructor(item: OptionKind, val: ArrayOptionVal) {
    this.val = val;
    this.item = item;
  }
}
export default ArrayOptionWrapper;
