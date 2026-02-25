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

export type ExtendedResult = {
  data: NodeTree;
  warnings: string[];
};

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>;
};

export type SettingsSources<T> = {
  env: boolean;
  args: boolean;
  files?: string | string[] | false;
  dir?: string | false;
  envFile?: string | string[] | false;
  defaults?: RecursivePartial<T>;
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
