import ArrayOption from "./array";
import ArrayValueContainer from "./arrayOption";
import OptionBase, { type Node } from "./base";
import OptionErrors from "./errors";
import PrimitiveOption from "./primitive";

export type OptionTypes = PrimitiveOption | ArrayOption<Node | OptionTypes>;

export {
  ArrayOption,
  ArrayValueContainer,
  Node,
  OptionBase,
  OptionErrors,
  PrimitiveOption,
};
