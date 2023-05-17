/* eslint-disable max-lines */
import * as fs from "fs";
import yaml from "js-yaml";

import type { OptionKind } from "./arrayOption";
// import ArrayOption from "./arrayOption";
import ConfigNode from "./configNode";

export type Value = boolean | string | number | object;
export type DefaultValue = Value | (() => string) | (() => number);

type RecursiveNode<T> = { [key: string]: OptionBase | T };
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Node extends RecursiveNode<Node> { }

type ConfigFileStructure<T> = {
  [key: string]: string | T | number | boolean | Array<T> | string[];
};
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConfigFileData extends ConfigFileStructure<ConfigFileData> { }

interface OptionClassParams {
  kind: OptionKind;
  required: boolean;
  env: string | null;
  cli: boolean;
  help: string;
  defaultValue?: DefaultValue;
  // properties: {
  //   [key: string]: Option;
  // };
}

class OptionErrors {
  public static errors: string[] = [];

  public static warnings: string[] = [];
}

class OptionBase {
  public readonly params: OptionClassParams;

  constructor(params: OptionClassParams) {
    this.params = params;
  }

  public getValue<T>(
    sourceFile: string | string[],
    env: { [key: string]: string | undefined },
    args: { [key: string]: string | boolean },
    path: string[],
    defaultValues?: Partial<T>,
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
      const data = yaml.load(
        fs.readFileSync(sourceFile, "utf-8")
      ) as ConfigFileData;
      const val = this.findInObject(data || {}, path);
      if (val instanceof ArrayOption) {
        return new ConfigNode(val, ident, "file", sourceFile, null, null);
      }
      // the following line checks if the value is different to null or undefined
      if (val != null) {
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
        const data = yaml.load(
          fs.readFileSync(file, "utf-8")
        ) as ConfigFileData;
        const val = this.findInObject(data || {}, path);
        if (val instanceof ArrayOption) {
          return new ConfigNode(val, ident, "file", file, null, null);
        }

        // the following line checks if the value is different to null or undefined
        if (val != null) {
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
      if (val instanceof ArrayOption) {
        return new ConfigNode(
          val,
          ident,
          "file",
          objectFromArray.file,
          null,
          null
        );
      }
      // the following line checks if the value is different to null or undefined
      if (val != null) {
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
      if (val instanceof ArrayOption) {
        return new ConfigNode(val, ident, "default", null, null, null);
      }
      if (val != null) {
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
      if (typeof this.params.defaultValue === "function") {
        return new ConfigNode(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          this.params.defaultValue(),
          ident,
          "default",
          null,
          null,
          null
        );
      }
      return new ConfigNode(
        this.params.defaultValue,
        ident,
        "default",
        null,
        null,
        null
      );
    }

    // If required and no value anywhere
    if (this.params.required) {
      OptionErrors.errors.push(`Required option '${ident}' not provided.`);
    }

    return null;
  }

  protected checkType(val: Value, path: string[], sourceOfVal: string): Value {
    const ident = path.join(".");

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
      return OptionErrors.errors.push(
        `Cannot convert value '${val.toString()}' for '${ident}' to string in ${sourceOfVal}.`
      );
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
      return OptionErrors.errors.push(
        `Cannot convert value '${val.toString()}' for '${ident}' to boolean in ${sourceOfVal}.`
      );
    }
    if (this.params.kind === "number") {
      if (typeof val === "string") {
        const parseVal = parseInt(val, 10);
        if (Number.isNaN(parseVal)) {
          OptionErrors.errors.push(
            `Cannot convert value '${val}' for '${ident}' to number in ${sourceOfVal}.`
          );
          return OptionErrors.errors;
        }
        OptionErrors.warnings.push(
          `The option ${ident} is stated as a number but is provided as a string`
        );
        return parseVal;
      }
    } else if (this.params.kind === "any") {
      return val;
    }
    return OptionErrors.errors.push(
      `Invalid state. Invalid kind in ${sourceOfVal}`
    );
  }

  protected findInObject(
    obj: ConfigFileData,
    path: string[]
  ): Value | ArrayOption | null {
    if (path.length > 1) {
      const [child, ...rest] = path;
      const val = obj[child];

      if (typeof val === "string") {
        OptionErrors.errors.push(`Cant get path from string value '${val}'`);
        return null;
      }
      if (typeof val === "number") {
        OptionErrors.errors.push(`Cant get path from number value '${val}'`);
        return null;
      }
      if (typeof val === "boolean") {
        OptionErrors.errors.push(
          `Cant get path from boolean value '${val.toString()}'`
        );
        return null;
      }
      if (Array.isArray(val)) {
        OptionErrors.errors.push(
          `Cant get path from array value '${val.toString()}'`
        );
        return null;
      }
      if (val == null) {
        return null;
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
      OptionErrors.errors.push(
        `Invalid path '${path.join(".")}': ${typeof val}`
      );
      return null;
    }
    OptionErrors.errors.push(`Invalid path '${path.join()}'`);
    return null;
  }

  buildArrayOption(_val: string[] | ConfigFileData[]): {
    item: OptionBase;
    val: Array<any>;
  } | null {
    return null;
  }
}

class PrimitiveOption extends OptionBase {
  constructor(params: OptionClassParams) {
    super(params);
  }
}

interface ArrayOptionClassParams {
  required: boolean;
  defaultValue?: DefaultValue;
  item: OptionBase;
}
class ArrayOption extends OptionBase {
  item: OptionBase;
  constructor(params: ArrayOptionClassParams) {
    super({
      kind: "array",
      env: null,
      cli: false,
      help: "",
      ...params,
    });
    this.item = params.item;
  }

  public override buildArrayOption(val: String[] | ConfigFileData[]): {
    item: OptionBase;
    val: Array<any>;
  } | null {
    if (this.item === null) {
      OptionErrors.errors.push(`Array item cannot be null`);
      return null;
    }
    return {
      item: this.item,
      val,
    };
  }
}

interface ObjectOptionClassParams {
  required: boolean;
  item: Node;
}
class ObjectOption extends OptionBase {
  item: Node;
  constructor(params: ObjectOptionClassParams) {
    super({
      kind: "object",
      env: null,
      cli: false,
      help: "",
      ...params,
    });
    this.item = params.item;
  }
}

export type OptionTypes = PrimitiveOption | ArrayOption | ObjectOption;

export { OptionBase, ArrayOption, ObjectOption, PrimitiveOption, OptionErrors };
