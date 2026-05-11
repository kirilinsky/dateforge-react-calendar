import { afterEach, describe, expect, it } from "vitest";
import {
  __getIntlCacheSize,
  clearIntlCache,
  getDateTimeFormat,
} from "@/utils/intl-cache";

afterEach(() => {
  clearIntlCache();
});

describe("getDateTimeFormat", () => {
  it("returns Intl.DateTimeFormat instance", () => {
    const fmt = getDateTimeFormat("en", { month: "long" });
    expect(fmt).toBeInstanceOf(Intl.DateTimeFormat);
  });

  it("returns same instance for identical locale + options", () => {
    const a = getDateTimeFormat("en", { month: "long" });
    const b = getDateTimeFormat("en", { month: "long" });
    expect(a).toBe(b);
  });

  it("returns same instance regardless of option key order", () => {
    const a = getDateTimeFormat("en", { month: "long", year: "numeric" });
    const b = getDateTimeFormat("en", { year: "numeric", month: "long" });
    expect(a).toBe(b);
  });

  it("returns different instances for different locales", () => {
    const a = getDateTimeFormat("en", { month: "long" });
    const b = getDateTimeFormat("ru", { month: "long" });
    expect(a).not.toBe(b);
  });

  it("returns different instances for different options", () => {
    const a = getDateTimeFormat("en", { month: "long" });
    const b = getDateTimeFormat("en", { month: "short" });
    expect(a).not.toBe(b);
  });

  it("returns different instances when timeZone option differs", () => {
    const a = getDateTimeFormat("en", { day: "numeric", timeZone: "UTC" });
    const b = getDateTimeFormat("en", {
      day: "numeric",
      timeZone: "Europe/Paris",
    });
    expect(a).not.toBe(b);
  });

  it("handles undefined locale", () => {
    const a = getDateTimeFormat(undefined, { month: "long" });
    const b = getDateTimeFormat(undefined, { month: "long" });
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(Intl.DateTimeFormat);
  });

  it("handles undefined options", () => {
    const a = getDateTimeFormat("en");
    const b = getDateTimeFormat("en");
    expect(a).toBe(b);
  });

  it("formats output identically to a fresh formatter", () => {
    const cached = getDateTimeFormat("en", { month: "long" });
    const fresh = new Intl.DateTimeFormat("en", { month: "long" });
    const d = new Date(2026, 4, 11);
    expect(cached.format(d)).toBe(fresh.format(d));
  });

  it("clearIntlCache empties the store", () => {
    getDateTimeFormat("en", { month: "long" });
    getDateTimeFormat("ru", { month: "short" });
    expect(__getIntlCacheSize()).toBeGreaterThan(0);
    clearIntlCache();
    expect(__getIntlCacheSize()).toBe(0);
  });

  it("evicts oldest entries past the bounded cap", () => {
    // Push 70 distinct keys; cap is 64 — earliest must be evicted.
    for (let i = 0; i < 70; i++) {
      getDateTimeFormat(`en-US-x-test${i}`, { month: "long" });
    }
    expect(__getIntlCacheSize()).toBeLessThanOrEqual(64);
  });

  it("locale switching produces a new formatter (no cross-pollution)", () => {
    const en = getDateTimeFormat("en", { month: "long" });
    const ru = getDateTimeFormat("ru", { month: "long" });
    const d = new Date(2026, 0, 15);
    expect(en.format(d)).not.toBe(ru.format(d));
  });
});
