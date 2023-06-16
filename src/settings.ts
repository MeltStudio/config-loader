/* eslint-disable no-param-reassign */
import { Command } from "commander";
import * as fs from "fs";

import ConfigNode from "./nodes/configNode";
import ConfigNodeArray from "./nodes/configNodeArray";
import type { ArrayOption, Node, OptionTypes, Value } from "./option";
import {
  ArrayValueContainer,
  OptionBase,
  OptionErrors,
  PrimitiveOption,
} from "./option";
import type {
  ArrayValue,
  ConfigFileData,
  NodeTree,
  PartialyBuiltSettings,
  Path,
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
      const filesInDirectory = fs.readdirSync(dir).sort();

      if (filesInDirectory.length === 0) {
        throw new Error(`Directory '${dir}' is empty`);
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
      for (let index = 0; index < OptionErrors.errors.length; index += 1) {
        console.error(`[Error]: ${OptionErrors.errors[index]}`);
      }
      process.exit(1);
    }
  }

  private traverseOptions(
    node: Node | OptionTypes,
    path: Path,
    callback: (nodearg: OptionTypes, patharg: Path) => void
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
    node: OptionTypes,
    path: Path
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
    item: Node | OptionTypes,
    values: ArrayValue,
    file: string
  ): Array<PartialyBuiltSettings> | ConfigNodeArray {
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
            node.file || node.variable_name || node.arg_name || ""
          );
        } else {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          options[child] = node;
        }
      }
    } else {
      throw new Error(
        `Invalid path '${node.path}' getting from '${
          node.arg_name || node.file || node.variable_name || ""
        }' in ' ${node.source_type}`
      );
    }
  }

  private addArg(node: OptionTypes, path: Path = []): void {
    if (node.params.cli) {
      const ident = path.join(".");
      this.program.option(`--${ident} <value>`, node.params.help);
    }
  }

  private getValuesFromTree(
    node: NodeTree | ConfigNode
  ): Value | ArrayOption | null {
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

  public get(): T {
    return this.getValuesFromTree(this.optionsTree) as unknown as T;
  }

  public getExtended(): NodeTree {
    return this.optionsTree;
  }
}

export default Settings;
