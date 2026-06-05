/**
 * The two orthogonal selection axes (decided in plan §2c).
 *
 * Kept tiny and standalone so presets, config, and strategies can share them
 * without pulling in reducer state. These describe the *configured* selection
 * shape — they are static config, never inferred from which modules are
 * mounted and never used to drive hidden reducer behavior.
 */

/** Selection granularity — what a single pick covers. */
export type SelectionUnit = "day" | "week" | "month";

/** Selection cardinality / shape. */
export type SelectionMode = "single" | "multiple" | "range" | "multi-range";
