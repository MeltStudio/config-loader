/* eslint-disable no-param-reassign */
import { Command } from "commander";
import * as fs from "fs";
import ArrayOptionWrapper from "./arrayOption";

import ConfigNode from "./configNode";
import ConfigNodeArray from "./configNodeArray";
import {
  ConfigFileData,
  Node,
  ObjectOption,
  OptionBase,
  OptionTypes,
  PrimitiveOption,
  Value,
  ArrayOption,
  OptionErrors,
} from "./option";
import type {
  NodeTree,
  PartialyBuiltSettings,
  ProcessEnv,
  SettingsSources,
} from "./types";

class Settings<T> {
  private readonly schema: Node;

  private readonly sources: SettingsSources<T>;

  private sourceFile: string | string[] = [];

  private argsData: { [key: string]: string } = {};

  private envData: ProcessEnv = {};

  private optionsTree: NodeTree = {};

  private defaultData: Partial<T> = {};

  private program: Command;

  constructor(schema: Node, sources: SettingsSources<T>) {
    this.schema = schema;
    this.sources = sources;
    this.program = new Command();
    this.load();
  }

  private validateFiles(): void {
    const { files, dir } = this.sources;

    if (files && dir)
      throw new Error("Dir and files are specified, choose one");

    if (files) {
      // if is an array of configs
      if (Array.isArray(files)) {
        files.forEach((file) => {
          if (!fs.existsSync(file)) {
            throw new Error(`Invalid config file '${file}'`);
          } else {
            if (!Array.isArray(this.sourceFile)) {
              this.sourceFile = [];
            }
            this.sourceFile.push(file);
          }
        });
      } else {
        if (!fs.existsSync(files)) {
          throw new Error(`Invalid config file '${files}'`);
        }

        this.sourceFile = files;
      }
    }

    // if is a directory
    if (dir) {
      if (!(fs.existsSync(dir) && fs.lstatSync(dir).isDirectory())) {
        throw new Error(`'${dir}' not exists or is not a dir`);
      }
      const filesInDirectory = fs.readdirSync(dir);

      if (filesInDirectory.length === 0) {
        throw new Error(`Directory '${dir}' is empty`);
      }
      filesInDirectory.forEach((file) => {
        if (!Array.isArray(this.sourceFile)) {
          this.sourceFile = [];
        }
        this.sourceFile.unshift(`${dir}/${file}`);
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
      for (let index = 0; index < OptionErrors.errors.length; index += 1) {
        console.error(`[Error]: ${OptionErrors.errors[index]}`);
      }
      process.exit(1);
    }
  }

  private traverseOptions(
    node: Node | OptionTypes,
    path: string[],
    callback: (nodearg: OptionTypes, patharg: string[]) => void
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
    result: PartialyBuiltSettings,
    configData: {
      sourceFile: string | string[];
      envData: ProcessEnv;
      argsData: { [key: string]: string };
      defaultValue: Partial<T>;
      objectFromArray?: { value: ConfigFileData; file: string };
    },
    node: PrimitiveOption | ArrayOption | ObjectOption,
    path: string[]
  ): void {
    const { sourceFile, envData, argsData, defaultValue, objectFromArray } =
      configData;
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
    item: OptionTypes,
    values: Array<any>,
    file: string
  ): Array<PartialyBuiltSettings> | ConfigNodeArray {
    if (typeof item === "string") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return values.map((v) => v);
    }
    if (typeof item === "number") {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      return values.map((v) => parseInt(v, 10));
    }
    const arrayValues = values.map((v) =>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      this.processArrayWithSchema(item, v, file)
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new ConfigNodeArray(arrayValues);
  }

  private processArrayWithSchema(
    item: OptionTypes,
    v: PartialyBuiltSettings,
    file: string
  ): PartialyBuiltSettings {
    const result: PartialyBuiltSettings = {};
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
    options: PartialyBuiltSettings,
    path: string[],
    value: ConfigNode
  ): void {
    if (path.length > 1) {
      const [child, ...rest] = path;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (!options[child]) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        options[child] = {};
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.setOption(options[child], rest, value);
    } else if (path.length === 1) {
      const [child] = path;
      if (value != null) {
        if (value.value instanceof ArrayOptionWrapper) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child] = value;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child].value = this.getValidatedArray(
            value.value.item,
            value.value.val,
            value.file || value.variable_name || value.arg_name || ""
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child] = value;
        }
      }
    } else {
      throw new Error(
        `Invalid path '${value.path}' getting from '${value.arg_name || value.file || value.variable_name || ""
        }' in ' ${value.source_type}`
      );
    }
  }

  private addArg(node: OptionTypes, path: string[] = []): void {
    if (node.params.cli) {
      const ident = path.join(".");
      this.program.option(`--${ident} <value>`, node.params.help);
    }
  }

  private getValuesFromTree(node: NodeTree | ConfigNode): Value | ArrayOption {
    if (node instanceof ConfigNode) {
      if (node.value instanceof ConfigNodeArray) {
        return node.value.arrayValues.map(this.getValuesFromTree.bind(this));
      }
      return node.value;
    }
    return Object.entries(node).reduce<{ [key: string]: Value }>(
      (acc, item) => {
        const [key, value] = item;
        acc[key] = this.getValuesFromTree(value);
        return acc;
      },
      {}
    );
  }

  public get(): T {
    return this.getValuesFromTree(this.optionsTree) as unknown as T;
  }

  public getExtended(): NodeTree {
    return this.optionsTree;
  }
}

export default Settings;
