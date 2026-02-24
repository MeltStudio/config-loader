import type { ConfigFileData, Path, SchemaValue } from "@/types";
import { InvalidValue } from "@/types";

import type { OptionTypes } from ".";
import ArrayValueContainer from "./arrayOption";
import type { Value } from "./base";
import OptionBase from "./base";
import type OptionErrors from "./errors";
import ObjectOption from "./object";

interface ArrayOptionClassParams<T extends OptionTypes> {
  required: boolean;
  defaultValue?: SchemaValue<T>[] | (() => SchemaValue<T>[]);
  item: T;
}
export default class ArrayOption<
  T extends OptionTypes,
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
    val: string[] | ConfigFileData[],
    errors?: OptionErrors,
  ): ArrayValueContainer | InvalidValue {
    if (this.item === null) {
      errors?.errors.push({
        message: `Array item cannot be null`,
        kind: "invalid_state",
      });
      return new InvalidValue();
    }
    return new ArrayValueContainer(this.item, val);
  }

  public override checkType(
    val: Value,
    path: Path,
    sourceOfVal: string,
    errors?: OptionErrors,
  ): Value {
    if (val instanceof ArrayValueContainer) {
      val.val.forEach((v, i) => {
        if (
          this.item instanceof OptionBase &&
          !(this.item instanceof ObjectOption)
        ) {
          this.item.checkType(v, [...path, i], sourceOfVal, errors);
        }
      });
      return val;
    }
    errors?.errors.push({
      message: `Invalid state. Invalid kind in ${sourceOfVal}`,
      source: sourceOfVal,
      kind: "invalid_state",
    });
    return new InvalidValue();
  }
}
