import type { LabelKey, LabelParams } from "./labels";

/**
 * Validation types — designed early, surfaced later.
 *
 * Two kinds of validation outcome (per the v3 plan):
 * - **transient rejections** (clicking a disabled day, exceeding maxDates) flow
 *   out as effects in Phase E and are not stored here;
 * - **persistent field errors** (manual input parse error, time field error)
 *   live in a `ValidationState`, scoped, and stay visible until the next edit,
 *   clear, or successful commit.
 *
 * This module is pure types plus allocation-light immutable helpers. No UI is
 * forced — a composition with no error surface simply ignores the state.
 */

/** Why a value/action was rejected. Stable, telemetry-friendly strings. */
export type ValidationReason =
  | "disabled"
  | "before-min"
  | "after-max"
  | "range-too-short"
  | "range-too-long"
  | "range-crosses-disabled"
  | "max-dates-reached"
  | "max-ranges-reached"
  | "malformed-input"
  | "ambiguous-time"
  | "nonexistent-time"
  | "time-out-of-order"
  | "empty-after-exclude"
  | "read-only";

export type ValidationResult =
  | { ok: true }
  | {
      ok: false;
      reason: ValidationReason;
      /** Optional label key for a user-facing message. */
      messageKey?: LabelKey;
      /** Optional placeholder values for the message. */
      params?: LabelParams;
    };

/** Shared `ok` result — no allocation on the happy path. */
export const VALID: ValidationResult = { ok: true };

/** Build a failed result. */
export function invalid(
  reason: ValidationReason,
  messageKey?: LabelKey,
  params?: LabelParams,
): ValidationResult {
  return { ok: false, reason, messageKey, params };
}

export function isValid(result: ValidationResult): boolean {
  return result.ok;
}

// --- scopes ---

/** Built-in surfaces that can hold a persistent field error. */
export type BuiltInValidationScope =
  | "manualInput"
  | "time"
  | "time.from"
  | "time.to"
  | "date"
  | "range"
  | "range.from"
  | "range.to"
  | "presets";

/** Namespaced scope for custom modules — never invent unscoped strings. */
export type CustomValidationScope = `custom:${string}`;

export type ValidationScope = BuiltInValidationScope | CustomValidationScope;

/** Brand a custom scope id, keeping the serialized string debuggable. */
export function customScope(id: string): CustomValidationScope {
  return `custom:${id}`;
}

// --- persistent field-error state (immutable) ---

export type ValidationState = {
  fields: Partial<Record<ValidationScope, ValidationResult>>;
};

export const EMPTY_VALIDATION_STATE: ValidationState = { fields: {} };

/**
 * Record a result for a scope. A successful result clears any stored error, so
 * a successful commit/edit removes the field rather than keeping a stale `ok`.
 * Returns the same reference when nothing changes.
 */
export function setFieldResult(
  state: ValidationState,
  scope: ValidationScope,
  result: ValidationResult,
): ValidationState {
  if (result.ok) return clearField(state, scope);
  if (state.fields[scope] === result) return state;
  return { fields: { ...state.fields, [scope]: result } };
}

/** Remove a scope's error. Returns the same reference when already absent. */
export function clearField(
  state: ValidationState,
  scope: ValidationScope,
): ValidationState {
  if (!(scope in state.fields)) return state;
  const next = { ...state.fields };
  delete next[scope];
  return { fields: next };
}

export function getFieldResult(
  state: ValidationState,
  scope: ValidationScope,
): ValidationResult | undefined {
  return state.fields[scope];
}

export function hasErrors(state: ValidationState): boolean {
  for (const scope in state.fields) {
    const r = state.fields[scope as ValidationScope];
    if (r && !r.ok) return true;
  }
  return false;
}
