import type ConfigNode from "./configNode";

export type ProcessEnv = { [key: string]: string | undefined };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PartialyBuiltSettings = any;

export type NodeTree = { [key: string]: NodeTree | ConfigNode };

export type SettingsSources<T> = {
  env: boolean;
  args: boolean;
  files?: string | string[] | false;
  dir?: string | false;
  defaults?: Partial<T>;
};

export type OptionKind =
  | "boolean"
  | "string"
  | "number"
  | "any"
  | "array"
  | "object";
