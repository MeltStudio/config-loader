import ArrayOption from "./array";
import ArrayValueContainer from "./arrayOption";
import OptionBase, { type Node } from "./base";
import OptionErrors from "./errors";
import ObjectOption from "./object";
import PrimitiveOption from "./primitive";

export type OptionTypes =
  | PrimitiveOption
  | ArrayOption<OptionTypes>
  | ObjectOption<Node>;

export {
  ArrayOption,
  ArrayValueContainer,
  Node,
  ObjectOption,
  OptionBase,
  OptionErrors,
  PrimitiveOption,
};
