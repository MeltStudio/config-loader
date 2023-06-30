import type { ConfigFileData, Path } from "@/types";
import { InvalidValue } from "@/types";

import type { OptionTypes } from ".";
import ArrayValueContainer from "./arrayOption";
import type { DefaultValue, Node, Value } from "./base";
import OptionBase from "./base";
import OptionErrors from "./errors";

interface ArrayOptionClassParams<T extends Node | OptionTypes> {
  required: boolean;
  defaultValue?: DefaultValue;
  item: T;
}
export default class ArrayOption<
  T extends Node | OptionTypes
> extends OptionBase<"array"> {
  item: T;

  constructor(params: ArrayOptionClassParams<T>) {
    super({
      kind: "array",
      env: null,
      cli: false,
      help: "",
      ...params,
    });
    this.item = params.item;
  }

  public override buildArrayOption(
    val: string[] | ConfigFileData[]
  ): ArrayValueContainer | InvalidValue {
    if (this.item === null) {
      OptionErrors.errors.push(`Array item cannot be null`);
      return new InvalidValue();
    }
    return new ArrayValueContainer(this.item, val);
  }

  // eslint-disable-next-line class-methods-use-this
  public override checkType(
    val: Value,
    path: Path,
    sourceOfVal: string
  ): Value {
    if (val instanceof ArrayValueContainer) {
      val.val.forEach((v, i) => {
        if (this.item instanceof OptionBase) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.item.checkType(v, [...path, i], sourceOfVal);
        }
      });
      return val;
    }
    OptionErrors.errors.push(`Invalid state. Invalid kind in ${sourceOfVal}`);
    return new InvalidValue();
  }
}
