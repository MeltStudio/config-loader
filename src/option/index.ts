import ArrayOption from "./array";
import ArrayValueContainer from "./arrayOption";
import OptionBase, { type DefaultValue, type Node, type Value } from "./base";
import OptionErrors from "./errors";
import ObjectOption from "./object";
import PrimitiveOption from "./primitive";

export type OptionTypes = PrimitiveOption | ArrayOption | ObjectOption;

export {
  ArrayOption,
  ArrayValueContainer,
  DefaultValue,
  Node,
  ObjectOption,
  OptionBase,
  OptionErrors,
  PrimitiveOption,
  Value,
};
