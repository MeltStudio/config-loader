import type { ConfigFileData } from "@/types";

import type { OptionTypes } from ".";
import ArrayValueContainer from "./arrayOption";
import type { DefaultValue } from "./base";
import OptionBase from "./base";
import OptionErrors from "./errors";

interface ArrayOptionClassParams {
  required: boolean;
  defaultValue?: DefaultValue;
  item: OptionTypes;
}
export default class ArrayOption extends OptionBase {
  item: OptionTypes;

  constructor(params: ArrayOptionClassParams) {
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
  ): ArrayValueContainer | null {
    if (this.item === null) {
      OptionErrors.errors.push(`Array item cannot be null`);
      return null;
    }
    return new ArrayValueContainer(this.item.params.kind, val);
  }
}
