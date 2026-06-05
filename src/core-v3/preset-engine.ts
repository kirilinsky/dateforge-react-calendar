import {
  addDays,
  type CalendarDate,
  calendarDate,
  compareDate,
  daysInMonth,
} from "./calendar-date";
import { type CalendarRange, orderRange, weekRange } from "./calendar-range";
import type { DateRuleEngine } from "./date-rule-engine";
import type { SelectionMode } from "./selection-types";

/**
 * Preset engine — turns named shortcuts ("Today", "Last 7 days", "This month")
 * into candidate selection values.
 *
 * Careful boundary (the `mode`/flow concern from the v3 doc): a preset is a
 * pure resolver to a *candidate value*. It never changes the selection mode,
 * never bypasses a selection strategy, and never drives reducer behavior.
 * `mode` appears here only as an explicit display/validation filter — "should
 * this preset be offered, and is its value usable right now?" — passed in by
 * the caller. Applying a chosen preset goes through the same strategy as a
 * manual pick, so all invariants (disabled, min/max, range limits) hold.
 */

export type PresetContext = {
  today: CalendarDate;
  firstDayOfWeek: number;
};

export type PresetResult =
  | { kind: "date"; date: CalendarDate }
  | { kind: "dates"; dates: CalendarDate[] }
  | { kind: "range"; range: CalendarRange };

export type Preset = {
  /** Stable identity — used as React key and for telemetry; never the label. */
  id: string;
  /** Optional display label (a label-registry key is wired in later). */
  label?: string;
  /** Optional grouping for sectioned preset lists. */
  group?: string;
  /** Pure resolver. Returns `null` when the preset does not apply in context. */
  resolve: (ctx: PresetContext) => PresetResult | null;
  /**
   * Modes this preset is offered in. Defaults are inferred from the result kind
   * (date → single/multiple, dates → multiple, range → range/multi-range).
   */
  modes?: SelectionMode[];
};

export type PresetStatus = "ok" | "incompatible" | "disabled" | "empty";

export type EvaluatedPreset = {
  preset: Preset;
  result: PresetResult | null;
  status: PresetStatus;
};

export type PresetValidationContext = {
  mode: SelectionMode;
  /** Compiled disabled engine (NOT exclude) — blocks selection. */
  rules?: DateRuleEngine;
  min?: CalendarDate;
  max?: CalendarDate;
};

export type PresetEngine = {
  /** Deduped, order-preserving preset list. */
  presets: Preset[];
  resolve(id: string, ctx: PresetContext): PresetResult | null;
  /** Status of every preset for the given context (pure, no side effects). */
  evaluate(
    ctx: PresetContext,
    vctx: PresetValidationContext,
  ): EvaluatedPreset[];
  /** Presets grouped by `group`, preserving first-seen order. */
  groups(): { group?: string; presets: Preset[] }[];
};

const DEFAULT_MODES: Record<PresetResult["kind"], SelectionMode[]> = {
  date: ["single", "multiple"],
  dates: ["multiple"],
  range: ["range", "multi-range"],
};

function isCompatible(
  result: PresetResult,
  preset: Preset,
  mode: SelectionMode,
) {
  const modes = preset.modes ?? DEFAULT_MODES[result.kind];
  return modes.includes(mode);
}

function outOfBounds(d: CalendarDate, min?: CalendarDate, max?: CalendarDate) {
  return (
    (min !== undefined && compareDate(d, min) < 0) ||
    (max !== undefined && compareDate(d, max) > 0)
  );
}

function isBlocked(
  result: PresetResult,
  vctx: PresetValidationContext,
): boolean {
  const { rules, min, max } = vctx;
  switch (result.kind) {
    case "date":
      return (
        (rules?.matches(result.date) ?? false) ||
        outOfBounds(result.date, min, max)
      );
    case "dates":
      // Blocked only when every candidate day is unusable.
      return (
        result.dates.length === 0 ||
        result.dates.every(
          (d) => (rules?.matches(d) ?? false) || outOfBounds(d, min, max),
        )
      );
    case "range":
      // Blocked when the whole span sits outside the allowed window.
      return (
        (max !== undefined && compareDate(result.range.start, max) > 0) ||
        (min !== undefined && compareDate(result.range.end, min) < 0)
      );
  }
}

/** Compile presets into a queryable engine. Duplicate ids are dropped (first wins). */
export function compilePresets(input: readonly Preset[] = []): PresetEngine {
  const presets: Preset[] = [];
  const seen = new Set<string>();
  for (const p of input) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    presets.push(p);
  }

  const byId = new Map(presets.map((p) => [p.id, p]));

  return {
    presets,
    resolve(id, ctx) {
      return byId.get(id)?.resolve(ctx) ?? null;
    },
    evaluate(ctx, vctx) {
      return presets.map((preset) => {
        const result = preset.resolve(ctx);
        let status: PresetStatus;
        if (!result) status = "empty";
        else if (!isCompatible(result, preset, vctx.mode))
          status = "incompatible";
        else if (isBlocked(result, vctx)) status = "disabled";
        else status = "ok";
        return { preset, result, status };
      });
    },
    groups() {
      const order: string[] = [];
      const map = new Map<string, Preset[]>();
      for (const p of presets) {
        const key = p.group ?? "";
        if (!map.has(key)) {
          map.set(key, []);
          order.push(key);
        }
        map.get(key)?.push(p);
      }
      return order.map((key) => ({
        group: key === "" ? undefined : key,
        presets: map.get(key) ?? [],
      }));
    },
  };
}

// --- a small set of common presets (tree-shakeable, opt-in) ---

export const presetToday: Preset = {
  id: "today",
  label: "Today",
  resolve: (ctx) => ({ kind: "date", date: ctx.today }),
};

export const presetLast7Days: Preset = {
  id: "last-7-days",
  label: "Last 7 days",
  resolve: (ctx) => ({
    kind: "range",
    range: orderRange(addDays(ctx.today, -6), ctx.today),
  }),
};

export const presetThisWeek: Preset = {
  id: "this-week",
  label: "This week",
  resolve: (ctx) => ({
    kind: "range",
    range: weekRange(ctx.today, ctx.firstDayOfWeek),
  }),
};

export const presetThisMonth: Preset = {
  id: "this-month",
  label: "This month",
  resolve: (ctx) => {
    const { year, month } = ctx.today;
    return {
      kind: "range",
      range: orderRange(
        calendarDate(year, month, 1),
        calendarDate(year, month, daysInMonth(year, month)),
      ),
    };
  },
};

/** Convenience bundle of the common presets, in display order. */
export const commonPresets: Preset[] = [
  presetToday,
  presetThisWeek,
  presetLast7Days,
  presetThisMonth,
];
