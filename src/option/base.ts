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
  StandardSchemaV1,
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
  sensitive?: boolean;
  defaultValue?: TypedDefaultValue<T>;
  oneOf?: ReadonlyArray<string | number | boolean>;
  validate?: StandardSchemaV1;
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

/**
 * Checks if the value for an env key came from a .env file rather than process.env.
 * A value is from a .env file if:
 * 1. The key exists in the .env file entries
 * 2. The value matches (meaning process.env didn't override it)
 */
function findEnvFileSource(
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

function checkNumberType(
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
    const resolved = this.resolveValue(
      sourceFile,
      env,
      args,
      path,
      defaultValues,
      objectFromArray,
      envFileResults,
      errors,
    );

    if (resolved && this.params.sensitive) {
      resolved.sensitive = true;
    }

    if (resolved && this.params.oneOf) {
      const passed = this.runOneOfCheck(resolved, path, errors);
      if (!passed) return resolved;
    }

    if (resolved && this.params.validate) {
      this.runValidation(resolved, path, errors);
    }

    return resolved;
  }

  private resolveValue<U>(
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
          this.checkType(args[ident], path, `CLI argument --${ident}`, errors),
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
        if (val !== undefined) {
          // Determine if this came from a .env file or process.env
          const envFileSource = findEnvFileSource(
            this.params.env,
            val,
            envFileResults,
          );
          if (envFileSource) {
            return new ConfigNode(
              this.checkType(
                val,
                path,
                `env file ${envFileSource.filePath} (${this.params.env})`,
                errors,
              ),
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
            this.checkType(
              val,
              path,
              `environment variable ${this.params.env}`,
              errors,
            ),
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
      const node = this.resolveFromFileData(
        data || {},
        sourceFile,
        sourceMap,
        path,
        ident,
        errors,
      );
      if (node) return node;
    }

    if (Array.isArray(sourceFile)) {
      for (let index = 0; index < sourceFile.length; index += 1) {
        const file = sourceFile[index];
        const { data, sourceMap } = loadConfigFile(file);
        const node = this.resolveFromFileData(
          data || {},
          file,
          sourceMap,
          path,
          ident,
          errors,
        );
        if (node) return node;
      }
    }

    if (objectFromArray) {
      const node = this.resolveFromFileData(
        objectFromArray.value,
        objectFromArray.file,
        objectFromArray.sourceMap ?? null,
        path,
        ident,
        errors,
      );
      if (node) return node;
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
      const rawDefault = this.params.defaultValue;
      if (typeof rawDefault === "function") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- deferred conditional type: TypedDefaultValue<T> can't be narrowed by typeof
        defaultValue = rawDefault();
      } else {
        defaultValue = rawDefault;
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
      const hints: string[] = [];
      if (this.params.env)
        hints.push(`environment variable ${this.params.env}`);
      if (this.params.cli) hints.push(`CLI argument --${ident}`);
      hints.push(`config file key: ${ident}`);
      const hint = hints.join(", ");
      errors?.errors.push({
        message: `Required option '${ident}' is missing. Set it via ${hint}.`,
        path: ident,
        kind: "required",
      });
    }

    return null;
  }

  private runOneOfCheck(
    node: ConfigNode,
    path: Path,
    errors?: OptionErrors,
  ): boolean {
    const allowed = this.params.oneOf;
    if (!allowed) return true;

    const value = node.value;
    if (valueIsInvalid(value)) return true;

    if (!allowed.includes(value as string | number | boolean)) {
      const ident = path.join(".");
      const source =
        node.file ?? node.variableName ?? node.argName ?? node.sourceType;
      const allowedStr = allowed.map((v) => `'${String(v)}'`).join(", ");
      errors?.errors.push({
        message: `Value '${typeof value === "object" ? JSON.stringify(value) : String(value)}' for '${ident}' is not one of: ${allowedStr}.`,
        path: ident,
        source,
        kind: "validation",
        line: node.line ?? undefined,
        column: node.column ?? undefined,
      });
      return false;
    }
    return true;
  }

  private runValidation(
    node: ConfigNode,
    path: Path,
    errors?: OptionErrors,
  ): void {
    const validator = this.params.validate;
    if (!validator) return;

    const value = node.value;
    if (valueIsInvalid(value)) return;

    const result = validator["~standard"].validate(value);
    if (result instanceof Promise) {
      throw new Error(
        "Async validators are not supported. The validate function must return a synchronous result.",
      );
    }
    if ("issues" in result && result.issues) {
      const ident = path.join(".");
      const source =
        node.file ?? node.variableName ?? node.argName ?? node.sourceType;
      for (const issue of result.issues) {
        const sourceLabel =
          source !== node.sourceType ? ` (source: ${source})` : "";
        errors?.errors.push({
          message: `Validation failed for '${ident}'${sourceLabel}: ${issue.message}`,
          path: ident,
          source,
          kind: "validation",
          line: node.line ?? undefined,
          column: node.column ?? undefined,
        });
      }
    }
  }

  private resolveFromFileData(
    data: ConfigFileData,
    file: string,
    sourceMap: {
      lookup(
        path: string | string[],
      ): { line: number; column: number } | undefined;
    } | null,
    path: Path,
    ident: string,
    errors?: OptionErrors,
  ): ConfigNode | null {
    const val = this.findInObject(data, path, errors);
    const loc = lookupLocation(sourceMap, path);
    if (val instanceof ArrayValueContainer || !valueIsInvalid(val)) {
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
    return null;
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
      if (typeof val === "boolean") {
        errors?.warnings.push(
          `The option ${ident} is stated as a string but is provided as a boolean`,
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
        const normalized = typeof val === "string" ? val.toLowerCase() : val;
        if ([1, "1", "true", "yes"].includes(normalized)) {
          return true;
        }
        if ([0, "0", "false", "no"].includes(normalized)) {
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
      return checkNumberType(val, ident, sourceOfVal, errors);
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
          message: `Cannot traverse into '${path.join(".")}': expected an object but found a string '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "number") {
        errors?.errors.push({
          message: `Cannot traverse into '${path.join(".")}': expected an object but found a number '${val}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (typeof val === "boolean") {
        errors?.errors.push({
          message: `Cannot traverse into '${path.join(".")}': expected an object but found a boolean '${val.toString()}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (Array.isArray(val)) {
        errors?.errors.push({
          message: `Cannot traverse into '${path.join(".")}': expected an object but found an array '${valueToString(val)}'`,
          kind: "invalid_path",
        });
        return new InvalidValue();
      }
      if (val === undefined) {
        return new InvalidValue();
      }
      if (val === null) {
        errors?.errors.push({
          message: `Option '${path.join(".")}' is null — expected an object to traverse into`,
          kind: "null_value",
        });
        return new InvalidValue();
      }
      return this.findInObject(val, rest, errors);
    }
    if (path.length === 1) {
      const val = obj[path[0]];

      if (val === null) {
        if (this.params.required) {
          errors?.errors.push({
            message: `Option '${path.join(".")}' is null — expected a ${this.params.kind}`,
            kind: "null_value",
          });
        } else {
          errors?.warnings.push(
            `Option '${path.join(".")}' is null and will be treated as unset`,
          );
        }
        return new InvalidValue();
      }
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
