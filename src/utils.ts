import type { Value } from "./option/base";
import { InvalidValue } from "./types";

export function valueIsInvalid(val: Value): boolean {
  return val instanceof InvalidValue || val === null || val === undefined;
}
