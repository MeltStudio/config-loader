import type ConfigNode from "./nodes/configNode";

export type ProcessEnv = { [key: string]: string | undefined };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PartialyBuiltSettings = any;

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
};

export type OptionKind =
  | "boolean"
  | "string"
  | "number"
  | "any"
  | "array"
  | "object";

export type PrimitiveKind = "boolean" | "string" | "number";

export type TypeOfPrimitiveKind<T extends PrimitiveKind> = T extends "boolean"
  ? boolean
  : T extends "string"
  ? string
  : T extends "number"
  ? number
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
