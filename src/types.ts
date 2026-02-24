import type ConfigNode from "./nodes/configNode";
import type { ArrayOption, Node, OptionBase, OptionTypes } from "./option";
import type PrimitiveOption from "./option/primitive";

export type ProcessEnv = { [key: string]: string | undefined };

export type NodeTree = { [key: string]: NodeTree | ConfigNode };

export type RecursivePartial<T> = {
  [K in keyof T]?: RecursivePartial<T[K]>;
};

export type SettingsSources<T> = {
  env: boolean;
  args: boolean;
  files?: string | string[] | false;
  dir?: string | false;
  defaults?: RecursivePartial<T>;
  exitOnError?: boolean;
};

export type OptionKind =
  | "boolean"
  | "string"
  | "number"
  | "any"
  | "array"
  | "object";

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
  ? T extends ArrayOption<Node | OptionTypes>
    ? SchemaValue<T["item"]>[]
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
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ConfigFileData extends ConfigFileStructure<ConfigFileData> {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArrayValue = Array<any>;

export class InvalidValue {}
