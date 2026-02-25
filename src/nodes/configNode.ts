import type ArrayValueContainer from "@/option/arrayOption";
import type { Value } from "@/option/base";
import type { ArrayValue } from "@/types";

type SourceTypes = "file" | "env" | "envFile" | "args" | "default";

class ConfigNode {
  value: Value | ArrayValueContainer;

  path: string;

  sourceType: SourceTypes;

  file: string | null;

  variableName: string | null;

  argName: string | null;

  line: number | null;

  column: number | null;

  sensitive: boolean;

  constructor(
    value: Value | ArrayValue,
    path: string,
    sourceType: SourceTypes,
    file: string | null,
    variableName: string | null,
    argName: string | null,
    line: number | null = null,
    column: number | null = null,
    sensitive: boolean = false,
  ) {
    this.value = value;
    this.path = path;
    this.sourceType = sourceType;
    this.file = file;
    this.variableName = variableName;
    this.argName = argName;
    this.line = line;
    this.column = column;
    this.sensitive = sensitive;
  }
}

export default ConfigNode;
