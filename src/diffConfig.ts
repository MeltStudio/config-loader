import type { Node } from "@/option";

import { ObjectOption, PrimitiveOption } from "./option";

/** A single change detected between two config loads. */
export interface ConfigChange {
  /** Dot-separated path to the changed key (e.g. "db.url"). */
  path: string;
  /** The previous value (undefined if key was added). */
  oldValue: unknown;
  /** The new value (undefined if key was removed). */
  newValue: unknown;
  /** Whether the change was an addition, removal, or modification. */
  type: "added" | "removed" | "changed";
}

const MASK = "***";

function collectSensitivePaths(schema: Node, prefix: string = ""): Set<string> {
  const paths = new Set<string>();
  for (const key of Object.keys(schema)) {
    const opt = schema[key];
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (opt instanceof PrimitiveOption && opt.params.sensitive) {
      paths.add(fullPath);
    }
    if (opt instanceof ObjectOption) {
      const childPaths = collectSensitivePaths(opt.item as Node, fullPath);
      for (const p of childPaths) {
        paths.add(p);
      }
    }
  }
  return paths;
}

function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  sensitivePaths: Set<string>,
  prefix: string = "",
): ConfigChange[] {
  const changes: ConfigChange[] = [];
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    const isSensitive = sensitivePaths.has(fullPath);
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    const hasOld = key in oldObj;
    const hasNew = key in newObj;

    if (hasNew && !hasOld) {
      changes.push({
        path: fullPath,
        type: "added",
        oldValue: undefined,
        newValue: isSensitive ? MASK : newVal,
      });
    } else if (hasOld && !hasNew) {
      changes.push({
        path: fullPath,
        type: "removed",
        oldValue: isSensitive ? MASK : oldVal,
        newValue: undefined,
      });
    } else if (
      oldVal !== null &&
      newVal !== null &&
      typeof oldVal === "object" &&
      typeof newVal === "object" &&
      !Array.isArray(oldVal) &&
      !Array.isArray(newVal)
    ) {
      changes.push(
        ...diffObjects(
          oldVal as Record<string, unknown>,
          newVal as Record<string, unknown>,
          sensitivePaths,
          fullPath,
        ),
      );
    } else if (!Object.is(oldVal, newVal)) {
      // For arrays and primitives, use JSON comparison for arrays
      if (
        Array.isArray(oldVal) &&
        Array.isArray(newVal) &&
        JSON.stringify(oldVal) === JSON.stringify(newVal)
      ) {
        continue;
      }
      changes.push({
        path: fullPath,
        type: "changed",
        oldValue: isSensitive ? MASK : oldVal,
        newValue: isSensitive ? MASK : newVal,
      });
    }
  }

  return changes;
}

/**
 * Compares two plain config objects and returns a list of changes.
 * Sensitive fields (from the schema) are masked in the output.
 */
export function diffConfig(
  oldConfig: Record<string, unknown>,
  newConfig: Record<string, unknown>,
  schema?: Node,
): ConfigChange[] {
  const sensitivePaths = schema
    ? collectSensitivePaths(schema)
    : new Set<string>();
  return diffObjects(oldConfig, newConfig, sensitivePaths);
}
