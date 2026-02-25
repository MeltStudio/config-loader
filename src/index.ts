import { SettingsBuilder } from "@/builder";

import type { Node, OptionTypes } from "./option";
import { ArrayOption, ObjectOption, PrimitiveOption } from "./option";
import type { SchemaValue, StandardSchemaV1 } from "./types";

export type { ConfigErrorEntry } from "./errors";
export { ConfigFileError, ConfigLoadError } from "./errors";
export { default as ConfigNode } from "./nodes/configNode";
export { default as ConfigNodeArray } from "./nodes/configNodeArray";
export type {
  ExtendedResult,
  NodeTree,
  RecursivePartial,
  SchemaValue,
  SettingsSources,
  StandardSchemaV1,
} from "./types";

/** Options for configuring a primitive (`string`, `number`, `bool`) schema field. */
interface OptionPropsArgs<T> {
  /** Whether the field must be present in at least one source. */
  required?: boolean;
  /** Environment variable name to read from, or `null` to disable. */
  env?: string | null;
  /** Whether to expose this field as a CLI argument via Commander. */
  cli?: boolean;
  /** Static default value or factory function returning one. */
  defaultValue?: T | (() => T);
  /** Help text shown in CLI `--help` output. */
  help?: string;
  /** Standard Schema validator run after type coercion. Accepts Zod, Valibot, ArkType, or any Standard Schema v1 implementation. */
  validate?: StandardSchemaV1;
}
/** Options for configuring an `array` schema field. */
interface ArrayOptionPropsArgs<T extends OptionTypes> {
  /** Whether the field must be present in at least one source. */
  required?: boolean;
  /** Schema definition for each item in the array. */
  item: T;
  /** Static default value or factory function returning one. */
  defaultValue?: SchemaValue<T>[] | (() => SchemaValue<T>[]);
  /** Standard Schema validator run on the resolved array. Accepts Zod, Valibot, ArkType, or any Standard Schema v1 implementation. */
  validate?: StandardSchemaV1;
}
/** Options for configuring a nested `object` schema field. */
interface ObjectOptionPropsArgs<T extends Node> {
  /** Whether the field must be present in at least one source. */
  required?: boolean;
  /** Schema definition for the nested object's shape. */
  item: T;
  /** Standard Schema validator run on the resolved object. Accepts Zod, Valibot, ArkType, or any Standard Schema v1 implementation. */
  validate?: StandardSchemaV1;
}

const DEFAULTS = {
  required: false,
  env: null,
  cli: false,
  help: "",
};

/**
 * Creates a string configuration option.
 * @param opts - Option configuration (env, cli, required, defaultValue, help).
 * @returns A `PrimitiveOption<"string">` for use in a schema.
 * @example
 * c.string({ env: "HOST", defaultValue: "localhost" })
 */
const string = (opts?: OptionPropsArgs<string>): PrimitiveOption<"string"> => {
  return new PrimitiveOption({
    kind: "string",
    ...DEFAULTS,
    ...opts,
  });
};
/**
 * Creates a number configuration option. String values from env/CLI are coerced to numbers.
 * @param opts - Option configuration (env, cli, required, defaultValue, help).
 * @returns A `PrimitiveOption<"number">` for use in a schema.
 * @example
 * c.number({ env: "PORT", defaultValue: 3000 })
 */
const number = (opts?: OptionPropsArgs<number>): PrimitiveOption<"number"> => {
  return new PrimitiveOption({
    kind: "number",
    ...DEFAULTS,
    ...opts,
  });
};
/**
 * Creates a boolean configuration option. String values `"true"`/`"false"` are coerced.
 * @param opts - Option configuration (env, cli, required, defaultValue, help).
 * @returns A `PrimitiveOption<"boolean">` for use in a schema.
 * @example
 * c.bool({ env: "DEBUG", defaultValue: false })
 */
const bool = (opts?: OptionPropsArgs<boolean>): PrimitiveOption<"boolean"> => {
  return new PrimitiveOption({
    kind: "boolean",
    ...DEFAULTS,
    ...opts,
  });
};
/**
 * Creates an array configuration option containing items of a given type.
 * @param opts - Must include `item` defining the element schema.
 * @returns An `ArrayOption<T>` for use in a schema.
 * @example
 * c.array({ item: c.string(), defaultValue: ["a", "b"] })
 */
const array = <T extends OptionTypes>(
  opts: ArrayOptionPropsArgs<T>,
): ArrayOption<T> => {
  return new ArrayOption<T>({
    ...DEFAULTS,
    ...opts,
  });
};
/**
 * Creates a nested object configuration option with its own sub-schema.
 * @param opts - Must include `item` defining the nested object's shape.
 * @returns An `ObjectOption<T>` for use in a schema.
 * @example
 * c.object({ item: { host: c.string(), port: c.number() } })
 */
const object = <T extends Node>(
  opts: ObjectOptionPropsArgs<T>,
): ObjectOption<T> => {
  return new ObjectOption<T>({
    required: false,
    ...opts,
  });
};

/**
 * Creates a `SettingsBuilder` from a schema definition. Call `.load()` or `.loadExtended()` on the result.
 * @param theSchema - Top-level schema object mapping keys to option definitions.
 * @returns A `SettingsBuilder` that loads and validates configuration.
 * @example
 * const config = c.schema({ port: c.number({ env: "PORT" }) }).load({ env: true, args: false });
 */
const schema = <T extends Node>(theSchema: T): SettingsBuilder<T> => {
  return new SettingsBuilder(theSchema);
};

/**
 * Config-loader entry point. Provides factory functions to define a typed configuration schema.
 *
 * @example
 * ```ts
 * import c from "@meltstudio/config-loader";
 *
 * const config = c.schema({
 *   port: c.number({ env: "PORT", defaultValue: 3000 }),
 *   host: c.string({ env: "HOST" }),
 * }).load({ env: true, args: false });
 * ```
 */
const option = {
  string,
  number,
  bool,
  array,
  object,
  schema,
};

export default option;
