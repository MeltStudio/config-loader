import type {
  ArrayOption,
  ObjectOption,
  PrimitiveOption,
  Value,
} from "./option";

type SourceTypes = "file" | "env" | "args" | "default";

class ConfigNode {
  value:
    | Value
    | { val: Array<any>; item: PrimitiveOption | ArrayOption | ObjectOption };

  path: string;

  source_type: SourceTypes;

  file: string | null;

  variable_name: string | null;

  arg_name: string | null;

  constructor(
    value: Value | ArrayOption,
    path: string,
    source_type: SourceTypes,
    file: string | null,
    variable_name: string | null,
    arg_name: string | null
  ) {
    this.value = value;
    this.path = path;
    this.source_type = source_type;
    this.file = file;
    this.variable_name = variable_name;
    this.arg_name = arg_name;
  }
}

export default ConfigNode;
