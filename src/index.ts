import { SettingsBuilder } from "@/builder";

import type { Node, OptionTypes } from "./option";
import { ArrayOption, PrimitiveOption } from "./option";
import type { SchemaValue } from "./types";

export type { ConfigErrorEntry } from "./errors";
export { ConfigFileError, ConfigLoadError } from "./errors";

interface OptionPropsArgs<T> {
  required?: boolean;
  env?: string | null;
  cli?: boolean;
  defaultValue?: T | (() => T);
  help?: string;
}
interface ArrayOptionPropsArgs<T extends Node | OptionTypes> {
  required?: boolean;
  item: T;
  defaultValue?: SchemaValue<T>[] | (() => SchemaValue<T>[]);
}

const DEFAULTS = {
  required: false,
  env: null,
  cli: false,
  help: "",
};

const string = (opts?: OptionPropsArgs<string>): PrimitiveOption<"string"> => {
  return new PrimitiveOption({
    kind: "string",
    ...DEFAULTS,
    ...opts,
  });
};
const number = (opts?: OptionPropsArgs<number>): PrimitiveOption<"number"> => {
  return new PrimitiveOption({
    kind: "number",
    ...DEFAULTS,
    ...opts,
  });
};
const bool = (opts?: OptionPropsArgs<boolean>): PrimitiveOption<"boolean"> => {
  return new PrimitiveOption({
    kind: "boolean",
    ...DEFAULTS,
    ...opts,
  });
};
const array = <T extends Node | OptionTypes>(
  opts: ArrayOptionPropsArgs<T>
): ArrayOption<T> => {
  return new ArrayOption<T>({
    ...DEFAULTS,
    ...opts,
  });
};

const schema = <T extends Node>(theSchema: T): SettingsBuilder<T> => {
  return new SettingsBuilder(theSchema);
};

const option = {
  string,
  number,
  bool,
  array,
  schema,
};

export default option;
