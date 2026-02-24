import type { PrimitiveKind } from "@/types";

import OptionBase from "./base";

export default class PrimitiveOption<
  T extends PrimitiveKind = PrimitiveKind,
> extends OptionBase<T> {}
