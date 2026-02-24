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
