import type ConfigNode from "./nodes/configNode";
import type {
  ArrayOption,
  Node,
  ObjectOption,
  OptionBase,
  OptionTypes,
} from "./option";
import type PrimitiveOption from "./option/primitive";

export type ProcessEnv = { [key: string]: string | undefined };

export type NodeTree = { [key: string]: NodeTree | ConfigNode };

/** Result returned by `SettingsBuilder.loadExtended()`, including raw node data and warnings. */
export type ExtendedResult = {
  /** Tree of `ConfigNode` objects preserving source metadata for each resolved value. */
  data: NodeTree;
  /** Non-fatal warnings collected during loading. */
  warnings: string[];
};

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>;
};

/** Configuration sources passed to `SettingsBuilder.load()` / `loadExtended()`. Priority: CLI > Env > Files > Defaults. */
export type SettingsSources<T> = {
  /** Whether to read values from `process.env`. */
  env: boolean;
  /** Whether to parse CLI arguments via Commander. */
  args: boolean;
  /** YAML/JSON file path(s) to load, or `false` to skip. */
  files?: string | string[] | false;
  /** Directory to scan for config files, or `false` to skip. */
  dir?: string | false;
  /** `.env` file path(s) to load, or `false` to skip. */
  envFile?: string | string[] | false;
  /** Partial default values applied at the lowest priority. */
  defaults?: RecursivePartial<T>;
  /** When `true`, unknown keys in config files cause errors. */
  strict?: boolean;
};

export type OptionKind = "boolean" | "string" | "number" | "array" | "object";

export type PrimitiveKind = Extract<
  OptionKind,
  "boolean" | "string" | "number"
>;

export type TypeOfPrimitiveKind<T extends PrimitiveKind> = T extends "boolean"
  ? boolean
  : T extends "string"
    ? string
    : T extends "number"
      ? number
      : never;

/** Recursively infers the plain TypeScript type from a schema definition. Maps option nodes to their resolved value types. */
export type SchemaValue<T extends OptionBase | Node> = T extends OptionBase
  ? T extends ArrayOption<OptionTypes>
    ? SchemaValue<T["item"]>[]
    : T extends ObjectOption<infer R>
      ? { [K in keyof R]: SchemaValue<R[K]> }
      : T extends PrimitiveOption<infer R>
        ? TypeOfPrimitiveKind<R>
        : never
  : T extends Node
    ? {
        [K in keyof T]: SchemaValue<T[K]>;
      }
    : never;

export type Path = Array<string | number>;

type ConfigFileStructure<T> = {
  [key: string]: string | T | number | boolean | Array<T> | string[];
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ConfigFileData extends ConfigFileStructure<ConfigFileData> {}

export type ArrayValue = Array<string | number | boolean | ConfigFileData>;

export class InvalidValue {}
