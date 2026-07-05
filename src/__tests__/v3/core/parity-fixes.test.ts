import { afterEach, describe, expect, it, vi } from "vitest";
import { calendarDateTime } from "@/core-v3/calendar-date-time";
import { calendarTime } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import { buildDayLookup, DayFlag, dayFlags } from "@/core-v3/day-flags";
import { dayKeyboardTarget } from "@/core-v3/day-keyboard";
import {
  compilePresets,
  definePreset,
  type Preset,
  type PresetInput,
  presetToday,
  presetYesterday,
  resolvePresetLabel,
} from "@/core-v3/preset-engine";
import { fromPublicValue } from "@/core-v3/public-value";
import { createInitialState } from "@/core-v3/state";
import { singleStrategy } from "@/core-v3/strategies/single";
import { normalizeTimeZone } from "@/core-v3/timezone-boundary";
import { resetWarnings } from "@/core-v3/warnings";
import { buildConfig, D } from "../fixtures/builders";

/**
 * The v2-parity fixes from the pre-cutover docs audit: bad-value guards,
 * never-throwing presets, localized pack labels, UTC±N zones, Shift+Page year
 * jumps, the time-only auto-create flow, and the maxDates pre-click flag.
 */

afterEach(() => {
  resetWarnings();
  vi.restoreAllMocks();
});

const silenceWarn = () =>
  vi.spyOn(console, "warn").mockImplementation(() => {});

describe("fromPublicValue guards (never throws on bad input)", () => {
  it("drops Invalid Date entries in multiple mode", () => {
    silenceWarn();
    const cfg = buildConfig({ mode: "multiple" });
    const sel = fromPublicValue(
      [new Date(2026, 5, 5), new Date(Number.NaN)],
      cfg,
    );
    expect(sel.shape).toBe("point");
    if (sel.shape === "point") expect(sel.dates).toHaveLength(1);
  });

  it("collapses an array in single mode to its first valid entry", () => {
    silenceWarn();
    const cfg = buildConfig({ mode: "single" });
    const sel = fromPublicValue(
      [new Date(Number.NaN), new Date(2026, 5, 7)] as unknown as Date,
      cfg,
    );
    expect(sel.shape).toBe("point");
    if (sel.shape === "point") {
      expect(sel.dates).toHaveLength(1);
      expect(sel.dates[0].date).toEqual(D(2026, 6, 7));
    }
  });

  it("treats an Invalid Date in single mode as empty", () => {
    silenceWarn();
    const cfg = buildConfig({ mode: "single" });
    const sel = fromPublicValue(new Date(Number.NaN), cfg);
    if (sel.shape === "point") expect(sel.dates).toHaveLength(0);
  });

  it("degrades a lone Date to a one-day span in range mode", () => {
    const cfg = buildConfig({ mode: "range" });
    const sel = fromPublicValue(new Date(2026, 5, 5) as never, cfg);
    expect(sel.shape).toBe("span");
    if (sel.shape === "span") {
      expect(sel.ranges).toHaveLength(1);
      expect(sel.ranges[0].start).toEqual(D(2026, 6, 5));
      expect(sel.ranges[0].end).toEqual(D(2026, 6, 5));
    }
  });

  it("drops a range whose bounds are invalid", () => {
    silenceWarn();
    const cfg = buildConfig({ mode: "range" });
    const sel = fromPublicValue(
      { start: new Date(Number.NaN), end: new Date(2026, 5, 8) },
      cfg,
    );
    if (sel.shape === "span") expect(sel.ranges).toHaveLength(0);
  });
});

describe("presets never throw", () => {
  it("treats a throwing resolver as empty with one dev warning", () => {
    const warn = silenceWarn();
    const bomb: Preset = {
      id: "bomb",
      label: "Boom",
      resolve: () => {
        throw new Error("user code");
      },
    };
    const engine = compilePresets([bomb, presetToday]);
    const evaluated = engine.evaluate(
      { today: D(2026, 6, 5), firstDayOfWeek: 1 },
      { mode: "single" },
    );
    expect(evaluated[0].status).toBe("empty");
    expect(evaluated[1].status).toBe("ok");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("skips null and malformed entries", () => {
    silenceWarn();
    const engine = compilePresets([
      null as unknown as Preset,
      42 as unknown as Preset,
      presetToday,
    ]);
    expect(engine.presets).toHaveLength(1);
  });

  it("warns on duplicate ids (first wins)", () => {
    const warn = silenceWarn();
    const engine = compilePresets([presetToday, presetToday]);
    expect(engine.presets).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  it("definePreset degrades malformed input to an inert preset", () => {
    silenceWarn();
    const p = definePreset(null as unknown as PresetInput);
    expect(p.resolve({ today: D(2026, 6, 5), firstDayOfWeek: 1 })).toBeNull();
    const noLabel = definePreset({} as PresetInput);
    expect(
      noLabel.resolve({ today: D(2026, 6, 5), firstDayOfWeek: 1 }),
    ).toBeNull();
  });

  it("definePreset resolves NaN dates from getValue to null", () => {
    const p = definePreset({
      label: "Bad",
      getValue: () => new Date(Number.NaN),
    });
    expect(p.resolve({ today: D(2026, 6, 5), firstDayOfWeek: 1 })).toBeNull();
  });
});

describe("localized preset labels", () => {
  it("built-in packs localize via Intl.RelativeTimeFormat", () => {
    expect(resolvePresetLabel(presetYesterday, "ru-RU")).toBe("Вчера");
    expect(resolvePresetLabel(presetYesterday, "en-US")).toBe("Yesterday");
  });

  it("definePreset accepts a (locale) => string label", () => {
    const p = definePreset({ id: "x", label: (l) => `loc:${l}`, value: 0 });
    expect(resolvePresetLabel(p, "de-DE")).toBe("loc:de-DE");
  });

  it("falls back to the id when the label fn throws", () => {
    silenceWarn();
    const p: Preset = {
      id: "safe",
      label: () => {
        throw new Error("boom");
      },
      resolve: () => null,
    };
    expect(resolvePresetLabel(p, "en-US")).toBe("safe");
  });
});

describe("UTC±N time zones", () => {
  it("normalizes the shorthand to Etc/GMT with the inverted sign", () => {
    expect(normalizeTimeZone("UTC+3")).toBe("Etc/GMT-3");
    expect(normalizeTimeZone("utc-5")).toBe("Etc/GMT+5");
    expect(normalizeTimeZone("UTC+0")).toBe("UTC");
  });

  it("leaves IANA names and invalid strings untouched", () => {
    expect(normalizeTimeZone("Europe/Berlin")).toBe("Europe/Berlin");
    expect(normalizeTimeZone("UTC+99")).toBe("UTC+99");
    expect(normalizeTimeZone(undefined)).toBeUndefined();
  });
});

describe("Shift+PageUp/PageDown jumps a year", () => {
  it("moves by a year with shift, a month without", () => {
    const base = D(2026, 6, 10);
    expect(dayKeyboardTarget("PageUp", base, 1, true)).toEqual({
      kind: "move",
      date: D(2025, 6, 10),
    });
    expect(dayKeyboardTarget("PageDown", base, 1, true)).toEqual({
      kind: "move",
      date: D(2027, 6, 10),
    });
    expect(dayKeyboardTarget("PageDown", base, 1, false)).toEqual({
      kind: "move",
      date: D(2026, 7, 10),
    });
  });
});

describe("time-only flow (single)", () => {
  it("setTime with no selection auto-creates one on the view anchor", () => {
    const cfg = buildConfig({ mode: "single", withTime: true });
    const state = createInitialState(cfg, { view: D(2026, 6, 15) });
    const r = singleStrategy.setTime(
      { state, config: cfg },
      calendarTime(9, 30, 0, 0),
    );
    expect(r.state.selection).toEqual({
      shape: "point",
      dates: [calendarDateTime(D(2026, 6, 15), calendarTime(9, 30, 0, 0))],
    });
    expect(r.effects.some((e) => e.type === "notify")).toBe(true);
  });

  it("still rejects when the anchor day is disabled", () => {
    const cfg = buildConfig({
      mode: "single",
      withTime: true,
      disabled: compileDateRules({ dates: [D(2026, 6, 15)] }),
    });
    const state = createInitialState(cfg, { view: D(2026, 6, 15) });
    const r = singleStrategy.setTime(
      { state, config: cfg },
      calendarTime(9, 0, 0, 0),
    );
    expect(r.state.selection).toEqual({ shape: "point", dates: [] });
    expect(r.effects.some((e) => e.type === "validationRejected")).toBe(true);
  });
});

describe("maxDates pre-click flag", () => {
  it("flags unselected days once the cap is reached", () => {
    const cfg = buildConfig({ mode: "multiple", maxDates: 2 });
    const lookup = buildDayLookup(
      {
        shape: "point",
        dates: [
          calendarDateTime(D(2026, 6, 1), calendarTime(0, 0, 0, 0)),
          calendarDateTime(D(2026, 6, 2), calendarTime(0, 0, 0, 0)),
        ],
      },
      cfg,
    );
    expect(dayFlags(D(2026, 6, 3), lookup, cfg) & DayFlag.MaxReached).not.toBe(
      0,
    );
    // The already-selected day is NOT flagged (clicking it deselects).
    expect(dayFlags(D(2026, 6, 1), lookup, cfg) & DayFlag.MaxReached).toBe(0);
    expect(dayFlags(D(2026, 6, 1), lookup, cfg) & DayFlag.Selected).not.toBe(0);
  });

  it("does not flag below the cap or without a cap", () => {
    const under = buildConfig({ mode: "multiple", maxDates: 3 });
    const lookup = buildDayLookup(
      {
        shape: "point",
        dates: [calendarDateTime(D(2026, 6, 1), calendarTime(0, 0, 0, 0))],
      },
      under,
    );
    expect(dayFlags(D(2026, 6, 3), lookup, under) & DayFlag.MaxReached).toBe(0);
    const noCap = buildConfig({ mode: "multiple" });
    expect(dayFlags(D(2026, 6, 3), lookup, noCap) & DayFlag.MaxReached).toBe(0);
  });
});

describe("date rules accept JS Date and {from,to} (v2 createDisabled shape)", () => {
  it("coerces JS Dates in before/after/dates", () => {
    const engine = compileDateRules({
      before: new Date(2026, 5, 3),
      dates: [new Date(2026, 5, 10)],
    });
    expect(engine.matches(D(2026, 6, 2))).toBe(true); // before
    expect(engine.matches(D(2026, 6, 10))).toBe(true); // exact
    expect(engine.matches(D(2026, 6, 11))).toBe(false);
  });

  it("accepts {from,to} ranges with JS Dates", () => {
    const engine = compileDateRules({
      ranges: [{ from: new Date(2026, 5, 20), to: new Date(2026, 5, 22) }],
    });
    expect(engine.matches(D(2026, 6, 21))).toBe(true);
    expect(engine.matches(D(2026, 6, 23))).toBe(false);
  });

  it("skips Invalid Date rule entries with a warning", () => {
    const warn = silenceWarn();
    const engine = compileDateRules({ dates: [new Date(Number.NaN)] });
    expect(engine.isEmpty).toBe(true);
    expect(warn).toHaveBeenCalled();
  });
});
