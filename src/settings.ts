/* eslint-disable no-param-reassign */
import { Command } from "commander";
import * as fs from "fs";

import { ConfigFileError, ConfigLoadError } from "./errors";
import ConfigNode from "./nodes/configNode";
import ConfigNodeArray from "./nodes/configNodeArray";
import type { Node, OptionTypes } from "./option";
import {
  ArrayValueContainer,
  OptionBase,
  OptionErrors,
  PrimitiveOption,
} from "./option";
import type { Value } from "./option/base";
import type {
  ArrayValue,
  ConfigFileData,
  NodeTree,
  Path,
  ProcessEnv,
  RecursivePartial,
  SchemaValue,
  SettingsSources,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PartiallyBuiltSettings = any;

class Settings<T extends Node> {
  private readonly schema: T;

  private readonly sources: SettingsSources<SchemaValue<T>>;

  private sourceFile: string | string[] = [];

  private argsData: { [key: string]: string } = {};

  private envData: ProcessEnv = {};

  private optionsTree: NodeTree = {};

  private defaultData: RecursivePartial<SchemaValue<T>> = {};

  private program: Command;

  constructor(schema: T, sources: SettingsSources<SchemaValue<T>>) {
    this.schema = schema;
    this.sources = sources;
    this.program = new Command()
      .allowUnknownOption(true)
      .allowExcessArguments(true);
    this.load();
  }

  private validateFiles(): void {
    const { files, dir } = this.sources;

    if (files && dir)
      throw new ConfigFileError("Dir and files are specified, choose one");

    if (files) {
      // if is an array of configs
      if (Array.isArray(files)) {
        files.forEach((file) => {
          if (!fs.existsSync(file)) {
            throw new ConfigFileError(`Invalid config file '${file}'`);
          } else {
            if (!Array.isArray(this.sourceFile)) {
              this.sourceFile = [];
            }
            this.sourceFile.push(file);
          }
        });
      } else {
        if (!fs.existsSync(files)) {
          throw new ConfigFileError(`Invalid config file '${files}'`);
        }

        this.sourceFile = files;
      }
    }

    // if is a directory
    if (dir) {
      if (!(fs.existsSync(dir) && fs.lstatSync(dir).isDirectory())) {
        throw new ConfigFileError(`'${dir}' not exists or is not a dir`);
      }
      const filesInDirectory = fs.readdirSync(dir).sort();

      if (filesInDirectory.length === 0) {
        throw new ConfigFileError(`Directory '${dir}' is empty`);
      }
      filesInDirectory.forEach((file) => {
        if (!Array.isArray(this.sourceFile)) {
          this.sourceFile = [];
        }
        this.sourceFile.push(`${dir}/${file}`);
      });
    }
  }

  private load(): void {
    this.validateFiles();
    if (this.sources.env) {
      this.envData = process.env;
    }
    if (this.sources.args) {
      this.traverseOptions(this.schema, [], this.addArg.bind(this));
      this.program.parse(process.argv);
      this.argsData = this.program.opts<{ [k: string]: string }>();
    }
    if (this.sources.defaults) {
      this.defaultData = this.sources.defaults;
    }
    this.traverseOptions(
      this.schema,
      [],
      this.buildOption.bind(this, this.optionsTree, {
        sourceFile: this.sourceFile,
        envData: this.envData,
        argsData: this.argsData,
        defaultValue: this.defaultData,
      })
    );

    // if then of the execution has warnings
    if (OptionErrors.warnings.length > 0) {
      for (let index = 0; index < OptionErrors.warnings.length; index += 1) {
        console.warn(`[Warning]: ${OptionErrors.warnings[index]}`);
      }
    }

    // if then of the execution has errors
    if (OptionErrors.errors.length > 0) {
      if (this.sources.exitOnError) {
        for (let index = 0; index < OptionErrors.errors.length; index += 1) {
          console.error(`[Error]: ${OptionErrors.errors[index].message}`);
        }
        process.exit(1);
      }
      throw new ConfigLoadError(
        [...OptionErrors.errors],
        [...OptionErrors.warnings]
      );
    }
  }

  private traverseOptions(
    node: Node | OptionBase,
    path: Path,
    callback: (nodearg: OptionBase, patharg: Path) => void
  ): void {
    if (node instanceof OptionBase) {
      callback(node, path);
    } else {
      Object.keys(node).forEach((key: string) => {
        const val = node[key];
        this.traverseOptions(val, [...path, key], callback);
      });
    }
  }

  private buildOption(
    result: PartiallyBuiltSettings,
    configData: {
      sourceFile?: string | string[];
      envData?: ProcessEnv;
      argsData?: { [key: string]: string };
      defaultValue?: RecursivePartial<SchemaValue<T>>;
      objectFromArray?: { value: ConfigFileData; file: string };
    },
    node: OptionBase,
    path: Path
  ): void {
    const {
      sourceFile = [],
      envData = {},
      argsData = {},
      defaultValue = {},
      objectFromArray,
    } = configData;
    const value = node.getValue(
      sourceFile,
      envData,
      argsData,
      path,
      defaultValue,
      objectFromArray
    );
    if (value === null) {
      // Value not found
    } else {
      this.setOption(result, path, value);
    }
  }

  private getValidatedArray(
    item: Node | OptionTypes,
    values: ArrayValue,
    file: string
  ): Array<PartiallyBuiltSettings> | ConfigNodeArray {
    if (item instanceof PrimitiveOption) {
      if (item.params.kind === "string") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return values.map((v) => v);
      }
      if (item.params.kind === "number") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return values.map((v) => parseInt(v, 10));
      }
      if (item.params.kind === "boolean") {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return
        return values.map((v) => {
          if (v === "true") return true;
          if (v === "1") return true;
          if (v === 1) return true;
          if (v === "false") return false;
          if (v === "0") return false;
          if (v === 0) return false;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return v;
        });
      }
    }

    const arrayValues = values.map((v) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      this.processArrayWithSchema(item, v, file)
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new ConfigNodeArray(arrayValues);
  }

  private processArrayWithSchema(
    item: Node | OptionTypes,
    v: PartiallyBuiltSettings,
    file: string
  ): PartiallyBuiltSettings {
    const result: PartiallyBuiltSettings = {};
    this.traverseOptions(
      item,
      [],
      this.buildOption.bind(this, result, {
        objectFromArray: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          value: v,
          file,
        },
      })
    );
    return result;
  }

  private setOption(
    options: PartiallyBuiltSettings,
    path: Path,
    node: ConfigNode
  ): void {
    if (path.length > 1) {
      const [child, ...rest] = path;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!options[child]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        options[child] = {};
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.setOption(options[child], rest, node);
    } else if (path.length === 1) {
      const [child] = path;
      if (node != null) {
        if (node.value instanceof ArrayValueContainer) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child] = node;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child].value = this.getValidatedArray(
            node.value.item,
            node.value.val,
            node.file || node.variableName || node.argName || ""
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child] = node;
        }
      }
    } else {
      throw new Error(
        `Invalid path '${node.path}' getting from '${
          node.argName || node.file || node.variableName || ""
        }' in ' ${node.sourceType}`
      );
    }
  }

  private addArg(node: OptionBase, path: Path = []): void {
    if (node.params.cli) {
      const ident = path.join(".");
      this.program.option(`--${ident} <value>`, node.params.help);
    }
  }

  private getValuesFromTree(
    node: NodeTree | ConfigNode
  ): Value | ArrayValue | null {
    if (node instanceof ConfigNode) {
      if (node.value instanceof ConfigNodeArray) {
        return node.value.arrayValues.map(this.getValuesFromTree.bind(this));
      }
      return node.value;
    }
    return Object.entries(node).reduce<{ [key: string]: Value | null }>(
      (acc, item) => {
        const [key, value] = item;
        acc[key] = this.getValuesFromTree(value);
        return acc;
      },
      {}
    );
  }

  public get(): SchemaValue<T> {
    return this.getValuesFromTree(
      this.optionsTree
    ) as unknown as SchemaValue<T>;
  }

  public getExtended(): NodeTree {
    return this.optionsTree;
  }
}

export default Settings;
