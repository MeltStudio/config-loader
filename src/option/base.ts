/* eslint-disable max-lines */
import type { EnvFileResult } from "@/envFileLoader";
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
import type OptionErrors from "./errors";

function valueToString(val: unknown): string {
  if (typeof val === "object" && val !== null) {
    return JSON.stringify(val);
  }
  return String(val);
}

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

function lookupLocation(
  sourceMap:
    | {
        lookup(
          path: string | string[],
        ): { line: number; column: number } | undefined;
      }
    | null
    | undefined,
  path: Path,
): { line: number; column: number } | null {
  if (!sourceMap) return null;
  const loc = sourceMap.lookup(path.map(String));
  if (!loc) return null;
  return { line: loc.line, column: loc.column };
}

function formatFileLocation(
  file: string,
  loc: { line: number; column: number } | null,
): string {
  if (!loc) return file;
  return `${file}:${loc.line}:${loc.column}`;
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
    objectFromArray?: {
      value: ConfigFileData;
      file: string;
      sourceMap?: {
        lookup(
          path: string | string[],
        ): { line: number; column: number } | undefined;
      } | null;
    },
    envFileResults?: EnvFileResult[],
    errors?: OptionErrors,
  ): ConfigNode | null {
    const ident = path.join(".");

    if (this.params.cli && args) {
      if (ident in args) {
        return new ConfigNode(
          this.checkType(args[ident], path, "args", errors),
          ident,
          "args",
          null,
          null,
          ident,
        );
      }
    }
    if (this.params.env && env) {
      if (this.params.env in env) {
        const val = env[this.params.env];
        if (val) {
          // Determine if this came from a .env file or process.env
          const envFileSource = this.findEnvFileSource(
            this.params.env,
            val,
            envFileResults,
          );
          if (envFileSource) {
            return new ConfigNode(
              this.checkType(val, path, "envFile", errors),
              ident,
              "envFile",
              envFileSource.filePath,
              this.params.env,
              null,
              envFileSource.line,
              envFileSource.column,
            );
          }
          return new ConfigNode(
            this.checkType(val, path, "env", errors),
            ident,
            "env",
            null,
            this.params.env,
            null,
          );
        }
      }
    }
    if (typeof sourceFile === "string") {
      const { data, sourceMap } = loadConfigFile(sourceFile);
      const val = this.findInObject(data || {}, path, errors);
      const loc = lookupLocation(sourceMap, path);
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(
            val,
            path,
            formatFileLocation(sourceFile, loc),
            errors,
          ),
          ident,
          "file",
          sourceFile,
          null,
          null,
          loc?.line ?? null,
          loc?.column ?? null,
        );
      }
      // the following line checks if the value is different to null or undefined
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(
            val,
            path,
            formatFileLocation(sourceFile, loc),
            errors,
          ),
          ident,
          "file",
          sourceFile,
          null,
          null,
          loc?.line ?? null,
          loc?.column ?? null,
        );
      }
    }

    if (Array.isArray(sourceFile)) {
      for (let index = 0; index < sourceFile.length; index += 1) {
        const file = sourceFile[index];
        const { data, sourceMap } = loadConfigFile(file);
        const val = this.findInObject(data || {}, path, errors);
        const loc = lookupLocation(sourceMap, path);
        if (val instanceof ArrayValueContainer) {
          return new ConfigNode(
            this.checkType(val, path, formatFileLocation(file, loc), errors),
            ident,
            "file",
            file,
            null,
            null,
            loc?.line ?? null,
            loc?.column ?? null,
          );
        }

        // the following line checks if the value is different to null or undefined
        if (!valueIsInvalid(val)) {
          return new ConfigNode(
            this.checkType(val, path, formatFileLocation(file, loc), errors),
            ident,
            "file",
            file,
            null,
            null,
            loc?.line ?? null,
            loc?.column ?? null,
          );
        }
      }
    }

    if (objectFromArray) {
      const loc = lookupLocation(objectFromArray.sourceMap, path);
      const val = this.findInObject(objectFromArray.value, path, errors);
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(
            val,
            path,
            formatFileLocation(objectFromArray.file, loc),
            errors,
          ),
          ident,
          "file",
          objectFromArray.file,
          null,
          null,
          loc?.line ?? null,
          loc?.column ?? null,
        );
      }
      // the following line checks if the value is different to null or undefined
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(
            val,
            path,
            formatFileLocation(objectFromArray.file, loc),
            errors,
          ),
          ident,
          "file",
          objectFromArray.file,
          null,
          null,
          loc?.line ?? null,
          loc?.column ?? null,
        );
      }
    }

    if (defaultValues) {
      const val = this.findInObject(
        defaultValues as ConfigFileData,
        path,
        errors,
      );
      if (val instanceof ArrayValueContainer) {
        return new ConfigNode(
          this.checkType(val, path, "default", errors),
          ident,
          "default",
          null,
          null,
          null,
        );
      }
      if (!valueIsInvalid(val)) {
        return new ConfigNode(
          this.checkType(val, path, "default", errors),
          ident,
          "default",
          null,
          null,
          null,
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
        defaultValue = this.buildArrayOption(defaultValue, errors);
      }
      if (!valueIsInvalid(defaultValue)) {
        return new ConfigNode(
          this.checkType(defaultValue, path, "default", errors),
          ident,
          "default",
          null,
          null,
          null,
        );
      }
    }

    // If required and no value anywhere
    if (this.params.required) {
      errors?.errors.push({
        message: `Required option '${ident}' not provided.`,
        path: ident,
        kind: "required",
      });
    }

    return null;
  }

  /**
   * Checks if the value for an env key came from a .env file rather than process.env.
   * A value is from a .env file if:
   * 1. The key exists in the .env file entries
   * 2. The value matches (meaning process.env didn't override it)
   */
  // eslint-disable-next-line class-methods-use-this
  private findEnvFileSource(
    envKey: string,
    currentValue: string,
    envFileResults?: EnvFileResult[],
  ): { filePath: string; line: number; column: number } | null {
    if (!envFileResults) return null;
    // Search in reverse order so later files take precedence
    for (let i = envFileResults.length - 1; i >= 0; i--) {
      const result = envFileResults[i];
      const entry = result.entries.get(envKey);
      if (entry && entry.value === currentValue) {
        return {
          filePath: result.filePath,
          line: entry.line,
          column: entry.column,
        };
      }
    }
    return null;
  }

  // eslint-disable-next-line class-methods-use-this
  protected checkNumberType(
    val: Value,
    pathStr: string,
    sourceOfVal: string,
    errors?: OptionErrors,
  ): Value {
    if (typeof val === "string") {
      const parseVal = parseInt(val, 10);
      if (Number.isNaN(parseVal)) {
        errors?.errors.push({
          message: `Cannot convert value '${val}' for '${pathStr}' to number in ${sourceOfVal}.`,
          path: pathStr,
          source: sourceOfVal,
          kind: "type_conversion",
        });
        return new InvalidValue();
      }
      errors?.warnings.push(
        `The option ${pathStr} is stated as a number but is provided as a string`,
      );
      return parseVal;
    }
    errors?.errors.push({
      message: `Invalid state. Invalid kind in ${sourceOfVal}`,
      source: sourceOfVal,
      kind: "invalid_state",
    });
    return new InvalidValue();
  }

  public checkType(
    val: Value,
    path: Path,
    sourceOfVal: string,
    errors?: OptionErrors,
  ): Value {
    const ident = path.join(".");

    if (valueIsInvalid(val)) {
      errors?.errors.push({
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
        errors?.warnings.push(
          `The option ${ident} is stated as a string but is provided as a number`,
        );
        return val.toString();
      }
      errors?.errors.push({
        message: `Cannot convert value '${valueToString(
          val,
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
      errors?.errors.push({
        message: `Cannot convert value '${valueToString(
          val,
        )}' for '${ident}' to boolean in ${sourceOfVal}.`,
        path: ident,
        source: sourceOfVal,
        kind: "type_conversion",
      });
      return new InvalidValue();
    }
    if (this.params.kind === "number") {
      return this.checkNumberType(val, ident, sourceOfVal, errors);
    }
    errors?.errors.push({
      message: `Invalid state. Invalid kind in ${sourceOfVal}`,
      source: sourceOfVal,
      kind: "invalid_state",
    });
    throw new Error(
      "Invalid kind. Must be 'string', 'number', 'boolean' or 'array'",
    );
  }

  protected findInObject(
    obj: ConfigFileData,
    path: Path,
    errors?: OptionErrors,
  ): Value | ArrayValue {
    if (path.length > 1) {
      const [child, ...rest] = path;
      const val = obj[child];

      if (typeof val === "string") {
        errors?.errors.push({
          message: `Cant get path from string value '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "number") {
        errors?.errors.push({
          message: `Cant get path from number value '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "boolean") {
        errors?.errors.push({
          message: `Cant get path from boolean value '${val.toString()}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (Array.isArray(val)) {
        errors?.errors.push({
          message: `Cant get path from array value '${valueToString(val)}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (val == null) {
        return new InvalidValue();
      }
      return this.findInObject(val, rest, errors);
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
        return this.buildArrayOption(val, errors);
      }
      errors?.errors.push({
        message: `Invalid path '${path.join(".")}': ${typeof val}`,
        kind: "invalid_path",
      });
      return new InvalidValue();
    }
    errors?.errors.push({
      message: `Invalid path '${path.join()}'`,
      kind: "invalid_path",
    });
    return new InvalidValue();
  }

  // eslint-disable-next-line class-methods-use-this
  buildArrayOption(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _val: string[] | ConfigFileData[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _errors?: OptionErrors,
  ): ArrayValueContainer | InvalidValue {
    return new InvalidValue();
  }
}
