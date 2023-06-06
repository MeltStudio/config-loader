import type { ArrayValueContainer, Value } from "@/option";
import type { ArrayValue } from "@/types";

type SourceTypes = "file" | "env" | "args" | "default";

class ConfigNode {
  value: Value | ArrayValueContainer | null;

  path: string;

  source_type: SourceTypes;

  file: string | null;

  variable_name: string | null;

  arg_name: string | null;

  constructor(
    value: Value | ArrayValue | null,
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
