import { SettingsBuilder } from "@/builder";

import type { Node, OptionTypes } from "./option";
import { ArrayOption, ObjectOption, PrimitiveOption } from "./option";
import type { SchemaValue } from "./types";

export type { ConfigErrorEntry } from "./errors";
export { ConfigFileError, ConfigLoadError } from "./errors";
export type { ExtendedResult } from "./types";

interface OptionPropsArgs<T> {
  required?: boolean;
  env?: string | null;
  cli?: boolean;
  defaultValue?: T | (() => T);
  help?: string;
}
interface ArrayOptionPropsArgs<T extends OptionTypes> {
  required?: boolean;
  item: T;
  defaultValue?: SchemaValue<T>[] | (() => SchemaValue<T>[]);
}
interface ObjectOptionPropsArgs<T extends Node> {
  required?: boolean;
  item: T;
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
const array = <T extends OptionTypes>(
  opts: ArrayOptionPropsArgs<T>,
): ArrayOption<T> => {
  return new ArrayOption<T>({
    ...DEFAULTS,
    ...opts,
  });
};
const object = <T extends Node>(
  opts: ObjectOptionPropsArgs<T>,
): ObjectOption<T> => {
  return new ObjectOption<T>({
    required: false,
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
  object,
  schema,
};

export default option;
