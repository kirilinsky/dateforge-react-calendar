import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import {
  commonPresets,
  compilePresets,
  type Preset,
  presetThisMonth,
  presetToday,
} from "@/core-v3/preset-engine";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);
const ctx = { today: D(2026, 6, 5), firstDayOfWeek: 1 };

describe("compilePresets", () => {
  it("dedupes by id (first wins) and preserves order", () => {
    const a: Preset = { id: "x", label: "A", resolve: () => null };
    const b: Preset = { id: "x", label: "B", resolve: () => null };
    const c: Preset = { id: "y", label: "C", resolve: () => null };
    const engine = compilePresets([a, b, c]);
    expect(engine.presets.map((p) => p.label)).toEqual(["A", "C"]);
  });

  it("resolves by id", () => {
    const engine = compilePresets([presetToday]);
    const r = engine.resolve("today", ctx);
    expect(r).toEqual({ kind: "date", date: D(2026, 6, 5) });
    expect(engine.resolve("missing", ctx)).toBeNull();
  });
});

describe("common preset resolution", () => {
  it("today / this-week / last-7-days / this-month", () => {
    const engine = compilePresets(commonPresets);
    const out = Object.fromEntries(
      engine.presets.map((p) => {
        const r = p.resolve(ctx);
        return [p.id, r];
      }),
    );
    expect(out.today).toEqual({ kind: "date", date: D(2026, 6, 5) });
    // 2026-06-05 is Friday; Monday-start week = Jun 1..7
    expect(out["this-week"]).toMatchObject({
      kind: "range",
      range: { start: D(2026, 6, 1), end: D(2026, 6, 7) },
    });
    expect(out["last-7-days"]).toMatchObject({
      range: { start: D(2026, 5, 30), end: D(2026, 6, 5) },
    });
    expect(out["this-month"]).toMatchObject({
      range: { start: D(2026, 6, 1), end: D(2026, 6, 30) },
    });
  });
});

describe("evaluate — mode compatibility (display filter, not behavior)", () => {
  const engine = compilePresets(commonPresets);

  it("marks range presets incompatible in single mode", () => {
    const out = engine.evaluate(ctx, { mode: "single" });
    const byId = Object.fromEntries(out.map((e) => [e.preset.id, e.status]));
    expect(byId.today).toBe("ok"); // date preset fits single
    expect(byId["this-week"]).toBe("incompatible"); // range preset does not
  });

  it("offers range presets in range mode", () => {
    const out = engine.evaluate(ctx, { mode: "range" });
    const byId = Object.fromEntries(out.map((e) => [e.preset.id, e.status]));
    expect(byId["this-week"]).toBe("ok");
    expect(byId.today).toBe("incompatible"); // date preset not a range
  });
});

describe("evaluate — disabled/min/max validation before apply", () => {
  it("marks a date preset disabled when the day is blocked", () => {
    const rules = compileDateRules({ dates: [D(2026, 6, 5)] });
    const out = compilePresets([presetToday]).evaluate(ctx, {
      mode: "single",
      rules,
    });
    expect(out[0].status).toBe("disabled");
  });

  it("marks a range preset disabled when the span is wholly out of bounds", () => {
    const out = compilePresets([presetThisMonth]).evaluate(ctx, {
      mode: "range",
      max: D(2026, 1, 1), // whole June span is after max
    });
    expect(out[0].status).toBe("disabled");
  });

  it("keeps a range usable when only some interior days are disabled", () => {
    const rules = compileDateRules({ weekends: true });
    const out = compilePresets([presetThisMonth]).evaluate(ctx, {
      mode: "range",
      rules,
    });
    expect(out[0].status).toBe("ok"); // segmentation handles weekends, not a block
  });
});

describe("groups", () => {
  it("buckets by group, preserving first-seen order", () => {
    const engine = compilePresets([
      { id: "a", group: "Relative", resolve: () => null },
      { id: "b", resolve: () => null },
      { id: "c", group: "Relative", resolve: () => null },
    ]);
    const g = engine.groups();
    expect(g.map((x) => x.group)).toEqual(["Relative", undefined]);
    expect(g[0].presets.map((p) => p.id)).toEqual(["a", "c"]);
    expect(g[1].presets.map((p) => p.id)).toEqual(["b"]);
  });
});

describe("malformed safety", () => {
  it("a throwing-free null resolve yields empty status, never crashes", () => {
    const out = compilePresets([{ id: "n", resolve: () => null }]).evaluate(
      ctx,
      { mode: "single" },
    );
    expect(out[0].status).toBe("empty");
  });

  it("dateKey stays stable for resolved values (sanity)", () => {
    expect(dateKey(D(2026, 6, 5))).toBe(20260605);
  });
});
