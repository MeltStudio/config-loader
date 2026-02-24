/* eslint-disable max-lines */
import { loadConfigFile } from "@/fileLoader";
import ConfigNode from "@/nodes/configNode";
import type {
  ArrayValue,
  ConfigFileData,
  OptionKind,
  Path,
  PrimitiveKind,
  TypeOfPrimitiveKind,
} from "@/types";
import { InvalidValue } from "@/types";
import { valueIsInvalid } from "@/utils";

import ArrayValueContainer from "./arrayOption";

function valueToString(val: unknown): string {
  if (typeof val === "object" && val !== null) {
    return JSON.stringify(val);
  }
  return String(val);
}
import OptionErrors from "./errors";

export type Value = boolean | string | number | object | InvalidValue;
export type DefaultValue =
  | Value
  | (() => string)
  | (() => number)
  | (() => boolean);

export type TypedDefaultValue<T extends OptionKind> = T extends PrimitiveKind
  ? TypeOfPrimitiveKind<T> | (() => TypeOfPrimitiveKind<T>)
  : DefaultValue;

export interface Node {
  [key: string]: OptionBase;
}

interface OptionClassParams<T extends OptionKind> {
  kind: T;
  required: boolean;
  env: string | null;
  cli: boolean;
  help: string;
  defaultValue?: TypedDefaultValue<T>;
  // properties: {
  //   [key: string]: Option;
  // };
}

export default class OptionBase<T extends OptionKind = OptionKind> {
  public readonly params: OptionClassParams<T>;

  constructor(params: OptionClassParams<T>) {
    this.params = params;
  }

  public getValue<U>(
    sourceFile: string | string[],
    env: { [key: string]: string | undefined },
    args: { [key: string]: string | boolean },
    path: Path,
    defaultValues?: Partial<U>,
    objectFromArray?: { value: ConfigFileData; file: string }
  ): ConfigNode | null {
    const ident = path.join(".");

    if (this.params.cli && args) {
      if (ident in args) {
        return new ConfigNode(
          this.checkType(args[ident], path, "args"),
          ident,
          "args",
          null,
          null,
          ident
        );
      }
    }
    if (this.params.env && env) {
      if (this.params.env in env) {
        const val = env[this.params.env];
        if (val) {
          return new ConfigNode(
            this.checkType(val, path, "env"),
            ident,
            "env",
            null,
            this.params.env,
            null
          );
        }
      }
    }
    if (typeof sourceFile === "string") {
      const data = loadConfigFile(sourceFile);
      const val = this.findInObject(data || {}, path);
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(val, path, sourceFile),
          ident,
          "file",
          sourceFile,
          null,
          null
        );
      }
      // the following line checks if the value is different to null or undefined
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(val, path, sourceFile),
          ident,
          "file",
          sourceFile,
          null,
          null
        );
      }
    }

    if (Array.isArray(sourceFile)) {
      for (let index = 0; index < sourceFile.length; index += 1) {
        const file = sourceFile[index];
        const data = loadConfigFile(file);
        const val = this.findInObject(data || {}, path);
        if (val instanceof ArrayValueContainer) {
          return new ConfigNode(
            this.checkType(val, path, file),
            ident,
            "file",
            file,
            null,
            null
          );
        }

        // the following line checks if the value is different to null or undefined
        if (!valueIsInvalid(val)) {
          return new ConfigNode(
            this.checkType(val, path, file),
            ident,
            "file",
            file,
            null,
            null
          );
        }
      }
    }

    if (objectFromArray) {
      const val = this.findInObject(objectFromArray.value, path);
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(val, path, objectFromArray.file),
          ident,
          "file",
          objectFromArray.file,
          null,
          null
        );
      }
      // the following line checks if the value is different to null or undefined
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(val, path, objectFromArray.file),
          ident,
          "file",
          objectFromArray.file,
          null,
          null
        );
      }
    }

    if (defaultValues) {
      const val = this.findInObject(defaultValues as ConfigFileData, path);
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(val, path, "default"),
          ident,
          "default",
          null,
          null,
          null
        );
      }
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(val, path, "default"),
          ident,
          "default",
          null,
          null,
          null
        );
      }
    }

    // If value not found but has default value
    if (this.params.defaultValue !== undefined) {
      let defaultValue: DefaultValue;
      if (typeof this.params.defaultValue === "function") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        defaultValue = this.params.defaultValue();
      } else {
        defaultValue = this.params.defaultValue;
      }
      if (this.params.kind === "array" && Array.isArray(defaultValue)) {
        defaultValue = this.buildArrayOption(defaultValue);
      }
      if (!valueIsInvalid(defaultValue)) {
        return new ConfigNode(
          this.checkType(defaultValue, path, "default"),
          ident,
          "default",
          null,
          null,
          null
        );
      }
    }

    // If required and no value anywhere
    if (this.params.required) {
      OptionErrors.errors.push({
        message: `Required option '${ident}' not provided.`,
        path: ident,
        kind: "required",
      });
    }

    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  protected checkNumberType(
    val: Value,
    pathStr: string,
    sourceOfVal: string
  ): Value {
    if (typeof val === "string") {
      const parseVal = parseInt(val, 10);
      if (Number.isNaN(parseVal)) {
        OptionErrors.errors.push({
          message: `Cannot convert value '${val}' for '${pathStr}' to number in ${sourceOfVal}.`,
          path: pathStr,
          source: sourceOfVal,
          kind: "type_conversion",
        });
        return new InvalidValue();
      }
      OptionErrors.warnings.push(
        `The option ${pathStr} is stated as a number but is provided as a string`
      );
      return parseVal;
    }
    OptionErrors.errors.push({
      message: `Invalid state. Invalid kind in ${sourceOfVal}`,
      source: sourceOfVal,
      kind: "invalid_state",
    });
    return new InvalidValue();
  }

  public checkType(val: Value, path: Path, sourceOfVal: string): Value {
    const ident = path.join(".");

    if (valueIsInvalid(val)) {
      OptionErrors.errors.push({
        message: `Invalid state. Invalid kind in ${sourceOfVal}`,
        source: sourceOfVal,
        kind: "invalid_state",
      });
      return val;
    }

    if (typeof val === this.params.kind) {
      return val;
    }

    if (this.params.kind === "string") {
      if (typeof val === "number") {
        OptionErrors.warnings.push(
          `The option ${ident} is stated as a string but is provided as a number`
        );
        return val.toString();
      }
      OptionErrors.errors.push({
        message: `Cannot convert value '${valueToString(
          val
        )}' for '${ident}' to string in ${sourceOfVal}.`,
        path: ident,
        source: sourceOfVal,
        kind: "type_conversion",
      });
      return new InvalidValue();
    }
    if (this.params.kind === "boolean") {
      if (typeof val !== "boolean" && typeof val !== "object") {
        if ([1, "1", "true"].includes(val)) {
          return true;
        }
        if ([0, "0", "false"].includes(val)) {
          return false;
        }
      }
      OptionErrors.errors.push({
        message: `Cannot convert value '${valueToString(
          val
        )}' for '${ident}' to boolean in ${sourceOfVal}.`,
        path: ident,
        source: sourceOfVal,
        kind: "type_conversion",
      });
      return new InvalidValue();
    }
    if (this.params.kind === "number") {
      return this.checkNumberType(val, ident, sourceOfVal);
    }
    OptionErrors.errors.push({
      message: `Invalid state. Invalid kind in ${sourceOfVal}`,
      source: sourceOfVal,
      kind: "invalid_state",
    });
    throw new Error(
      "Invalid kind. Must be 'string', 'number', 'boolean' or 'array'"
    );
  }

  protected findInObject(obj: ConfigFileData, path: Path): Value | ArrayValue {
    if (path.length > 1) {
      const [child, ...rest] = path;
      const val = obj[child];

      if (typeof val === "string") {
        OptionErrors.errors.push({
          message: `Cant get path from string value '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "number") {
        OptionErrors.errors.push({
          message: `Cant get path from number value '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "boolean") {
        OptionErrors.errors.push({
          message: `Cant get path from boolean value '${val.toString()}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (Array.isArray(val)) {
        OptionErrors.errors.push({
          message: `Cant get path from array value '${valueToString(val)}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (val == null) {
        return new InvalidValue();
      }
      return this.findInObject(val, rest);
    }
    if (path.length === 1) {
      const val = obj[path[0]];

      if (
        (!Array.isArray(val) && typeof val === "object" && val) ||
        typeof val === "string" ||
        typeof val === "number" ||
        typeof val === "boolean" ||
        typeof val === "undefined"
      ) {
        return val;
      }
      if (Array.isArray(val)) {
        return this.buildArrayOption(val);
      }
      OptionErrors.errors.push({
        message: `Invalid path '${path.join(".")}': ${typeof val}`,
        kind: "invalid_path",
      });
      return new InvalidValue();
    }
    OptionErrors.errors.push({
      message: `Invalid path '${path.join()}'`,
      kind: "invalid_path",
    });
    return new InvalidValue();
  }

  // eslint-disable-next-line class-methods-use-this
  buildArrayOption(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _val: string[] | ConfigFileData[]
  ): ArrayValueContainer | InvalidValue {
    return new InvalidValue();
  }
}
