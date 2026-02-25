import { Command } from "commander";

import type { EnvFileResult } from "./envFileLoader";
import { ConfigLoadError } from "./errors";
import ConfigNode from "./nodes/configNode";
import ConfigNodeArray from "./nodes/configNodeArray";
import type { Node, OptionTypes } from "./option";
import {
  ArrayValueContainer,
  ObjectOption,
  OptionBase,
  PrimitiveOption,
} from "./option";
import type { Value } from "./option/base";
import OptionErrors from "./option/errors";
import { loadEnvFiles, validateFiles } from "./sourceValidation";
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

type PartiallyBuiltSettings = {
  [key: string]: ConfigNode | PartiallyBuiltSettings;
};

class Settings<T extends Node> {
  private readonly schema: T;
  private readonly sources: SettingsSources<SchemaValue<T>>;
  private readonly errors = new OptionErrors();
  private sourceFile: string | string[] = [];
  private argsData: { [key: string]: string } = {};
  private envData: ProcessEnv = {};
  private optionsTree: NodeTree = {};
  private defaultData: RecursivePartial<SchemaValue<T>> = {};
  private envFileResults: EnvFileResult[] = [];
  private program: Command;

  constructor(schema: T, sources: SettingsSources<SchemaValue<T>>) {
    this.schema = schema;
    this.sources = sources;
    this.program = new Command()
      .allowUnknownOption(true)
      .allowExcessArguments(true);
    this.load();
  }

  private validateAndLoadFiles(): void {
    this.sourceFile = validateFiles(this.sources.files, this.sources.dir);
  }

  private loadAndMergeEnvFiles(): void {
    const { envFileResults, mergedEnvData } = loadEnvFiles(
      this.sources.envFile,
      this.envData,
    );
    this.envFileResults = envFileResults;
    this.envData = mergedEnvData;
  }

  private checkEnvMappingsWithoutEnvLoading(): void {
    if (this.sources.env || this.sources.envFile) return;
    const envMappedOptions: string[] = [];
    this.traverseOptions(this.schema, [], (node, path) => {
      if (node.params.env) {
        envMappedOptions.push(path.join("."));
      }
    });
    if (envMappedOptions.length > 0) {
      this.errors.warnings.push(
        `Options [${envMappedOptions.join(", ")}] have env mappings but env loading is disabled. ` +
          `Set 'env: true' in load options to read from environment variables.`,
      );
    }
  }

  private load(): void {
    this.validateAndLoadFiles();
    this.checkEnvMappingsWithoutEnvLoading();
    if (this.sources.env) {
      this.envData = { ...process.env };
    }
    this.loadAndMergeEnvFiles();
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
        envFileResults: this.envFileResults,
        errors: this.errors,
      }),
    );

    if (this.sources.strict && this.errors.warnings.length > 0) {
      for (const warning of this.errors.warnings) {
        this.errors.errors.push({ message: warning, kind: "strict" });
      }
      this.errors.warnings = [];
    }

    if (this.errors.errors.length > 0) {
      throw new ConfigLoadError(
        [...this.errors.errors],
        [...this.errors.warnings],
      );
    }
  }

  private traverseOptions(
    node: Node | OptionBase,
    path: Path,
    callback: (nodearg: OptionBase, patharg: Path) => void,
  ): void {
    if (node instanceof ObjectOption) {
      const item = node.item as Node;
      Object.keys(item).forEach((key: string) => {
        this.traverseOptions(item[key], [...path, key], callback);
      });
    } else if (node instanceof OptionBase) {
      callback(node, path);
    } else {
      // Root-level Node only
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
      envFileResults?: EnvFileResult[];
      errors?: OptionErrors;
    },
    node: OptionBase,
    path: Path,
  ): void {
    const {
      sourceFile = [],
      envData = {},
      argsData = {},
      defaultValue = {},
      objectFromArray,
      envFileResults,
      errors,
    } = configData;
    const value = node.getValue(
      sourceFile,
      envData,
      argsData,
      path,
      defaultValue,
      objectFromArray,
      envFileResults,
      errors,
    );
    if (value !== null) {
      this.setOption(result, path, value);
    }
  }

  private getValidatedArray(
    item: OptionTypes,
    values: ArrayValue,
    file: string,
  ): ArrayValue | ConfigNodeArray {
    if (item instanceof PrimitiveOption) {
      if (item.params.kind === "string") {
        return (values as string[]).map((v: string) => v);
      }
      if (item.params.kind === "number") {
        return (values as string[]).map((v: string) => parseInt(v, 10));
      }
      if (item.params.kind === "boolean") {
        return (values as unknown[]).map((v: unknown) => {
          if (v === "true") return true;
          if (v === "1") return true;
          if (v === 1) return true;
          if (v === "false") return false;
          if (v === "0") return false;
          if (v === 0) return false;
          return v as boolean;
        });
      }
    }

    const arrayValues = (values as ConfigFileData[]).map((v: ConfigFileData) =>
      this.processArrayWithSchema(item, v, file),
    );
    return new ConfigNodeArray(arrayValues as unknown as ConfigNode[]);
  }

  private processArrayWithSchema(
    item: OptionTypes,
    v: ConfigFileData,
    file: string,
  ): NodeTree {
    const result: NodeTree = {};
    this.traverseOptions(
      item,
      [],
      this.buildOption.bind(this, result, {
        objectFromArray: {
          value: v,
          file,
        },
        errors: this.errors,
      }),
    );
    return result;
  }

  private setOption(
    options: PartiallyBuiltSettings,
    path: Path,
    node: ConfigNode,
  ): void {
    if (path.length > 1) {
      const [child, ...rest] = path;
      if (!options[child]) {
        options[child] = {};
      }
      this.setOption(
        options[child as string] as PartiallyBuiltSettings,
        rest,
        node,
      );
    } else if (path.length === 1) {
      const [child] = path;
      if (node != null) {
        if (node.value instanceof ArrayValueContainer) {
          options[child as string] = node;
          (options[child as string] as ConfigNode).value =
            this.getValidatedArray(
              node.value.item,
              node.value.val,
              node.file || node.variableName || node.argName || "",
            );
        } else {
          options[child as string] = node;
        }
      }
    } else {
      throw new Error(
        `Invalid path '${node.path}' getting from '${
          node.argName || node.file || node.variableName || ""
        }' in ' ${node.sourceType}`,
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
    node: NodeTree | ConfigNode,
  ): Value | ArrayValue | null {
    if (node instanceof ConfigNode) {
      if (node.value instanceof ConfigNodeArray) {
        return node.value.arrayValues.map(this.getValuesFromTree.bind(this));
      }
      return node.value;
    }
    return Object.entries(node).reduce<{ [key: string]: Value | null }>(
      (acc, [key, value]) => {
        acc[key] = this.getValuesFromTree(value);
        return acc;
      },
      {},
    );
  }

  public get(): SchemaValue<T> {
    return this.getValuesFromTree(
      this.optionsTree,
    ) as unknown as SchemaValue<T>;
  }

  public getExtended(): NodeTree {
    return this.optionsTree;
  }

  public getWarnings(): string[] {
    return [...this.errors.warnings];
  }
}

export default Settings;
