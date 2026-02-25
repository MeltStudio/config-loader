import ConfigNode from "@/nodes/configNode";
import ConfigNodeArray from "@/nodes/configNodeArray";
import { OptionBase } from "@/option";
import { ObjectOption } from "@/option";
import type { Node } from "@/option/base";
import type { ExtendedResult, NodeTree } from "@/types";

const MASK = "***";

function maskNodeTree(tree: NodeTree): NodeTree {
  const result: NodeTree = {};
  for (const [key, entry] of Object.entries(tree)) {
    if (entry instanceof ConfigNode) {
      if (entry.sensitive) {
        const masked = new ConfigNode(
          MASK,
          entry.path,
          entry.sourceType,
          entry.file,
          entry.variableName,
          entry.argName,
          entry.line,
          entry.column,
          entry.sensitive,
        );
        if (entry.value instanceof ConfigNodeArray) {
          masked.value = entry.value;
        }
        result[key] = masked;
      } else {
        result[key] = entry;
      }
    } else {
      result[key] = maskNodeTree(entry);
    }
  }
  return result;
}

function maskPlainObject(
  obj: Record<string, unknown>,
  schema: Node,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const schemaNode = schema[key];
    if (!schemaNode) {
      result[key] = value;
      continue;
    }
    if (schemaNode instanceof ObjectOption) {
      if (value && typeof value === "object" && !Array.isArray(value)) {
        result[key] = maskPlainObject(
          value as Record<string, unknown>,
          schemaNode.item as Node,
        );
      } else {
        result[key] = value;
      }
    } else if (schemaNode instanceof OptionBase) {
      result[key] = schemaNode.params.sensitive ? MASK : value;
    } else {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Masks sensitive values in an `ExtendedResult` from `loadExtended()`.
 * Fields marked `sensitive: true` have their values replaced with `"***"`.
 *
 * @param result - The `ExtendedResult` returned by `loadExtended()`.
 * @returns A new `ExtendedResult` with sensitive values masked.
 */
export function maskSecrets(result: ExtendedResult): ExtendedResult;
/**
 * Masks sensitive values in a plain config object from `load()`.
 * Fields marked `sensitive: true` in the schema have their values replaced with `"***"`.
 *
 * @param config - The plain config object returned by `load()`.
 * @param schema - The schema definition used to identify sensitive fields.
 * @returns A new object with sensitive values masked.
 */
export function maskSecrets<T extends Record<string, unknown>>(
  config: T,
  schema: Node,
): T;
export function maskSecrets(
  resultOrConfig: ExtendedResult | Record<string, unknown>,
  schema?: Node,
): ExtendedResult | Record<string, unknown> {
  if ("data" in resultOrConfig && "warnings" in resultOrConfig && !schema) {
    const extended = resultOrConfig as ExtendedResult;
    return {
      data: maskNodeTree(extended.data),
      warnings: [...extended.warnings],
    };
  }
  if (schema) {
    return maskPlainObject(resultOrConfig as Record<string, unknown>, schema);
  }
  return resultOrConfig;
}
