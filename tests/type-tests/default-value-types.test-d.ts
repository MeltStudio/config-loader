/**
 * Compile-time type tests for type-safe defaultValue.
 *
 * These tests verify that the TypeScript compiler rejects invalid
 * defaultValue types. They are NOT meant to be executed — only type-checked.
 *
 * Run: npm run type-check
 *
 * If any @ts-expect-error line does NOT produce an error, tsc will fail,
 * proving that the type constraint is working.
 */

import c from "@/src";

// --- Valid usage (should compile) ---

c.string({ defaultValue: "hello" });
c.string({ defaultValue: () => "hello" });
c.number({ defaultValue: 42 });
c.number({ defaultValue: () => 42 });
c.bool({ defaultValue: true });
c.bool({ defaultValue: () => false });
c.array({ item: c.string(), defaultValue: ["a", "b"] });
c.array({ item: c.string(), defaultValue: () => ["a", "b"] });
c.array({ item: c.number(), defaultValue: [1, 2] });

// --- Invalid usage (should NOT compile) ---

// @ts-expect-error — number is not assignable to string defaultValue
c.string({ defaultValue: 123 });

// @ts-expect-error — boolean is not assignable to string defaultValue
c.string({ defaultValue: true });

// @ts-expect-error — string is not assignable to number defaultValue
c.number({ defaultValue: "None" });

// @ts-expect-error — boolean is not assignable to number defaultValue
c.number({ defaultValue: false });

// @ts-expect-error — string is not assignable to boolean defaultValue
c.bool({ defaultValue: "yes" });

// @ts-expect-error — number is not assignable to boolean defaultValue
c.bool({ defaultValue: 1 });

// @ts-expect-error — number[] is not assignable to string[] defaultValue
c.array({ item: c.string(), defaultValue: [1, 2] });

// @ts-expect-error — string[] is not assignable to number[] defaultValue
c.array({ item: c.number(), defaultValue: ["a", "b"] });

// --- ObjectOption type inference ---

// Valid: object with nested primitives infers correctly
c.object({ item: { name: c.string(), count: c.number() } });

// Valid: object used as array item
c.array({
  item: c.object({ item: { name: c.string(), enabled: c.bool() } }),
});

// Valid: nested objects
c.object({
  item: {
    child: c.object({ item: { value: c.number() } }),
  },
});

// Valid: SchemaValue inference through schema
const result = c
  .schema({
    config: c.object({
      item: {
        host: c.string({ required: true }),
        port: c.number({ required: true }),
      },
    }),
  })
  .load({ env: false, args: false, files: false });

// These lines verify that SchemaValue infers the correct nested types
const host: string = result.config.host;
const port: number = result.config.port;
void host;
void port;

// --- oneOf type narrowing ---

// Valid: oneOf narrows string type
c.string({ oneOf: ["dev", "staging", "prod"] });
c.number({ oneOf: [0, 1, 2, 3] });

// @ts-expect-error — number values are not assignable to string oneOf
c.string({ oneOf: [1, 2, 3] });

// @ts-expect-error — string values are not assignable to number oneOf
c.number({ oneOf: ["a", "b"] });

// Verify narrowing through SchemaValue
const narrowedResult = c
  .schema({
    env: c.string({ oneOf: ["dev", "staging", "prod"] }),
    level: c.number({ oneOf: [0, 1, 2, 3] }),
    plain: c.string(),
  })
  .load({ env: false, args: false, files: false });

// Narrowed types
const env: "dev" | "staging" | "prod" = narrowedResult.env;
const level: 0 | 1 | 2 | 3 = narrowedResult.level;
// Non-narrowed type
const plain: string = narrowedResult.plain;
void env;
void level;
void plain;
