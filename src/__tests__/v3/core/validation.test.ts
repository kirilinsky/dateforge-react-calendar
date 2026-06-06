import { describe, expect, it } from "vitest";
import {
  clearField,
  customScope,
  EMPTY_VALIDATION_STATE,
  getFieldResult,
  hasErrors,
  invalid,
  isValid,
  setFieldResult,
  VALID,
  type ValidationResult,
} from "@/core-v3/validation";

describe("results", () => {
  it("VALID is ok and shared", () => {
    expect(isValid(VALID)).toBe(true);
    expect(VALID).toBe(VALID);
  });

  it("invalid carries reason, messageKey, params", () => {
    const r = invalid("range-too-short", "apply", { min: 3 });
    expect(r).toEqual({
      ok: false,
      reason: "range-too-short",
      messageKey: "apply",
      params: { min: 3 },
    });
    expect(isValid(r)).toBe(false);
  });
});

describe("customScope", () => {
  it("namespaces custom ids", () => {
    expect(customScope("booking-code")).toBe("custom:booking-code");
  });
});

describe("ValidationState", () => {
  const err: ValidationResult = invalid("malformed-input");

  it("starts empty", () => {
    expect(hasErrors(EMPTY_VALIDATION_STATE)).toBe(false);
    expect(
      getFieldResult(EMPTY_VALIDATION_STATE, "manualInput"),
    ).toBeUndefined();
  });

  it("stores a failure under its scope", () => {
    const s = setFieldResult(EMPTY_VALIDATION_STATE, "manualInput", err);
    expect(getFieldResult(s, "manualInput")).toBe(err);
    expect(hasErrors(s)).toBe(true);
  });

  it("a successful result clears the field rather than storing ok", () => {
    const s1 = setFieldResult(EMPTY_VALIDATION_STATE, "time.from", err);
    const s2 = setFieldResult(s1, "time.from", VALID);
    expect(getFieldResult(s2, "time.from")).toBeUndefined();
    expect(hasErrors(s2)).toBe(false);
  });

  it("keeps scopes independent", () => {
    let s = setFieldResult(EMPTY_VALIDATION_STATE, "time.from", err);
    s = setFieldResult(s, "time.to", invalid("ambiguous-time"));
    expect(hasErrors(s)).toBe(true);
    s = clearField(s, "time.from");
    expect(getFieldResult(s, "time.from")).toBeUndefined();
    expect(getFieldResult(s, "time.to")).toBeDefined();
  });

  it("supports custom scopes", () => {
    const scope = customScope("fiscal-period");
    const s = setFieldResult(EMPTY_VALIDATION_STATE, scope, err);
    expect(getFieldResult(s, scope)).toBe(err);
  });

  it("returns the same reference on no-op changes", () => {
    expect(clearField(EMPTY_VALIDATION_STATE, "date")).toBe(
      EMPTY_VALIDATION_STATE,
    );
    const s = setFieldResult(EMPTY_VALIDATION_STATE, "date", err);
    expect(setFieldResult(s, "date", err)).toBe(s);
  });

  it("does not mutate the previous state", () => {
    const s1 = setFieldResult(EMPTY_VALIDATION_STATE, "range", err);
    setFieldResult(s1, "presets", invalid("disabled"));
    expect(Object.keys(s1.fields)).toEqual(["range"]);
  });
});
