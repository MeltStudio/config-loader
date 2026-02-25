import type { PrimitiveKind, TypeOfPrimitiveKind } from "@/types";

import OptionBase from "./base";

export default class PrimitiveOption<
  T extends PrimitiveKind = PrimitiveKind,
  // @ts-expect-error phantom type parameter — used by SchemaValue for oneOf narrowing
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Narrowed = TypeOfPrimitiveKind<T>,
> extends OptionBase<T> {}
