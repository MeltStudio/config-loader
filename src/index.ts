import type { DefaultValue, Node, OptionTypes } from "./option";
import { ArrayOption, PrimitiveOption } from "./option";
import Settings from "./settings";

export default Settings;

interface OptionPropsArgs {
  required?: boolean;
  env?: string | null;
  cli?: boolean;
  defaultValue?: DefaultValue;
  help?: string;
}
interface ArrayOptionPropsArgs {
  required?: boolean;
  item: Node | OptionTypes;
  defaultValue?: DefaultValue;
}
// interface ObjectOptionPropsArgs {
//   required?: boolean;
//   item: Node;
// }

const DEFAULTS = {
  required: false,
  env: null,
  cli: false,
  help: "",
  // properties: {},
};

const string = (opts?: OptionPropsArgs): PrimitiveOption => {
  return new PrimitiveOption({
    kind: "string",
    ...DEFAULTS,
    ...opts,
  });
};
const number = (opts?: OptionPropsArgs): PrimitiveOption => {
  return new PrimitiveOption({
    kind: "number",
    ...DEFAULTS,
    ...opts,
  });
};
const bool = (opts?: OptionPropsArgs): PrimitiveOption => {
  return new PrimitiveOption({
    kind: "boolean",
    ...DEFAULTS,
    ...opts,
  });
};
const array = (opts: ArrayOptionPropsArgs): ArrayOption => {
  return new ArrayOption({
    ...DEFAULTS,
    ...opts,
  });
};
// const object = (opts: ObjectOptionPropsArgs): ObjectOption => {
//   return new ObjectOption({
//     ...DEFAULTS,
//     ...opts,
//   });
// };
export const option = {
  string,
  number,
  bool,
  // object,
  array,
};
