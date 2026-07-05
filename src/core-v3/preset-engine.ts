import {
  addDays,
  addMonths,
  addYears,
  type CalendarDate,
  calendarDate,
  compareDate,
  daysInMonth,
} from "./calendar-date";
import { type CalendarRange, orderRange, weekRange } from "./calendar-range";
import type { DateRuleEngine } from "./date-rule-engine";
import type { SelectionMode } from "./selection-types";
import { warnOnce } from "./warnings";

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

/**
 * A display label: a plain string, or a locale-aware function (v2 parity) —
 * resolve with {@link resolvePresetLabel} at render time.
 */
export type PresetLabel = string | ((locale: string) => string);

export type Preset = {
  /** Stable identity — used as React key and for telemetry; never the label. */
  id: string;
  /** Optional display label — plain string or `(locale) => string`. */
  label?: PresetLabel;
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

/**
 * Presets never throw (v2 invariant): a user resolver that crashes is treated
 * as "empty" with one dev warning, never a render crash.
 */
function safeResolve(preset: Preset, ctx: PresetContext): PresetResult | null {
  try {
    return preset.resolve(ctx);
  } catch (error) {
    warnOnce("presetResolveError", preset.id, String(error));
    return null;
  }
}

/**
 * Compile presets into a queryable engine. Defensive by contract: `null`/
 * malformed entries are skipped and duplicate ids dropped (first wins), each
 * with a dev warning — user-supplied preset lists never crash the render.
 */
export function compilePresets(input: readonly Preset[] = []): PresetEngine {
  const presets: Preset[] = [];
  const seen = new Set<string>();
  for (const p of input) {
    if (
      p === null ||
      typeof p !== "object" ||
      typeof p.id !== "string" ||
      typeof p.resolve !== "function"
    ) {
      warnOnce("invalidPreset", `entry is ${p === null ? "null" : typeof p}`);
      continue;
    }
    if (seen.has(p.id)) {
      warnOnce("duplicatePresetId", p.id);
      continue;
    }
    seen.add(p.id);
    presets.push(p);
  }

  const byId = new Map(presets.map((p) => [p.id, p]));

  return {
    presets,
    resolve(id, ctx) {
      const preset = byId.get(id);
      return preset ? safeResolve(preset, ctx) : null;
    },
    evaluate(ctx, vctx) {
      return presets.map((preset) => {
        const result = safeResolve(preset, ctx);
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

// --- label resolution + localized relative labels (v2 parity) ---

/** Resolve a {@link PresetLabel} for display; falls back to the preset id. */
export function resolvePresetLabel(preset: Preset, locale?: string): string {
  const { label } = preset;
  if (typeof label === "function") {
    try {
      return label(locale ?? "en-US");
    } catch (error) {
      warnOnce("presetResolveError", preset.id, String(error));
      return preset.id;
    }
  }
  return label ?? preset.id;
}

const rtfCache = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Localized relative label via `Intl.RelativeTimeFormat` ("Yesterday",
 * "Вчера", "Nächsten Monat"…), sentence-cased. The built-in packs use this so
 * their buttons follow the calendar locale (v2 `basicPresets` behavior).
 */
function relativeLabel(
  locale: string,
  amount: number,
  unit: Intl.RelativeTimeFormatUnit,
): string {
  let rtf = rtfCache.get(locale);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    rtfCache.set(locale, rtf);
  }
  const s = rtf.format(amount, unit);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// --- a small set of common presets (tree-shakeable, opt-in) ---

export const presetToday: Preset = {
  id: "today",
  label: (l) => relativeLabel(l, 0, "day"),
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
  label: (l) => relativeLabel(l, 0, "week"),
  resolve: (ctx) => ({
    kind: "range",
    range: weekRange(ctx.today, ctx.firstDayOfWeek),
  }),
};

export const presetThisMonth: Preset = {
  id: "this-month",
  label: (l) => relativeLabel(l, 0, "month"),
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

// ── Relative single-date quick-picks (the v2 `basicPresets` set) ──────────────
// Each jumps the selection to a date relative to today. Labels are plain
// English here (matching the other presets); a locale-aware label rides the
// label registry later, like the rest of the module strings.

export const presetYesterday: Preset = {
  id: "yesterday",
  label: (l) => relativeLabel(l, -1, "day"),
  resolve: (ctx) => ({ kind: "date", date: addDays(ctx.today, -1) }),
};
export const presetTomorrow: Preset = {
  id: "tomorrow",
  label: (l) => relativeLabel(l, 1, "day"),
  resolve: (ctx) => ({ kind: "date", date: addDays(ctx.today, 1) }),
};
export const presetLastWeek: Preset = {
  id: "last-week",
  label: (l) => relativeLabel(l, -1, "week"),
  resolve: (ctx) => ({ kind: "date", date: addDays(ctx.today, -7) }),
};
export const presetNextWeek: Preset = {
  id: "next-week",
  label: (l) => relativeLabel(l, 1, "week"),
  resolve: (ctx) => ({ kind: "date", date: addDays(ctx.today, 7) }),
};
export const presetLastMonth: Preset = {
  id: "last-month",
  label: (l) => relativeLabel(l, -1, "month"),
  resolve: (ctx) => ({ kind: "date", date: addMonths(ctx.today, -1) }),
};
export const presetNextMonth: Preset = {
  id: "next-month",
  label: (l) => relativeLabel(l, 1, "month"),
  resolve: (ctx) => ({ kind: "date", date: addMonths(ctx.today, 1) }),
};
export const presetLastYear: Preset = {
  id: "last-year",
  label: (l) => relativeLabel(l, -1, "year"),
  resolve: (ctx) => ({ kind: "date", date: addYears(ctx.today, -1) }),
};
export const presetNextYear: Preset = {
  id: "next-year",
  label: (l) => relativeLabel(l, 1, "year"),
  resolve: (ctx) => ({ kind: "date", date: addYears(ctx.today, 1) }),
};

/** Convenience bundle of the common (range-ish) presets, in display order. */
export const commonPresets: Preset[] = [
  presetToday,
  presetThisWeek,
  presetLast7Days,
  presetThisMonth,
];

/**
 * Relative single-date quick-picks, past → future (the v2 `basicPresets` pack):
 * last year / month / week, yesterday, today, tomorrow, next week / month / year.
 */
export const relativePresets: Preset[] = [
  presetLastYear,
  presetLastMonth,
  presetLastWeek,
  presetYesterday,
  presetToday,
  presetTomorrow,
  presetNextWeek,
  presetNextMonth,
  presetNextYear,
];

// ── definePreset — the declarative authoring form (v2 SimplePresetDef parity) ──
// Lets a consumer write the common cases without a resolver:
//   { label: "Today",       value: 0 }                    // day offset from today
//   { label: "In 3 days",   value: 3 }
//   { label: "Last 7 days", value: -6, range: 6 }         // span: 7 days ending today
//   { label: "New Year",    value: new Date(2026, 0, 1) } // fixed wall-clock date
//   { label: "Start of mo", getValue: ({ now }) => … }    // full function form
// `value`/`getValue` speak JS `Date` (the public boundary); `definePreset`
// compiles them into a v3 `Preset` resolver (CalendarDate-based).

/** Declarative preset spec — compiled to a {@link Preset} by {@link definePreset}. */
export type PresetInput = {
  id?: string;
  /** Display label — plain string or `(locale) => string` (v2 parity). */
  label: PresetLabel;
  group?: string;
  modes?: SelectionMode[];
  /** Day offset from today (number, ± = future/past) OR a fixed wall-clock Date. */
  value?: number | Date;
  /** Span length in days after `value` — turns the pick into a range. */
  range?: number;
  /** Full form: return a `Date`, a `{ from, to }` span, or `null` to hide. */
  getValue?: (ctx: { now: Date }) => Date | { from: Date; to: Date } | null;
};

const isUsableDate = (d: unknown): d is Date =>
  d instanceof Date && !Number.isNaN(d.getTime());

const jsToCalendarDate = (d: Date): CalendarDate =>
  calendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());

/** A preset that never applies — the safe stand-in for malformed input. */
const emptyPreset = (id: string): Preset => ({ id, resolve: () => null });

/**
 * Compile a declarative {@link PresetInput} into a {@link Preset}. Defensive:
 * malformed entries degrade to an inert preset with a dev warning, and NaN
 * dates from `value`/`getValue` resolve to `null` — presets never throw.
 */
export function definePreset(input: PresetInput): Preset {
  if (input === null || typeof input !== "object") {
    warnOnce(
      "invalidPreset",
      `entry is ${input === null ? "null" : typeof input}`,
    );
    return emptyPreset("invalid-preset");
  }
  const { id, label, group, modes, value, range, getValue } = input;
  if (id == null && typeof label !== "string") {
    warnOnce("invalidPreset", "no `id` and no string `label` to derive one");
    return emptyPreset("invalid-preset");
  }
  return {
    id: id ?? (label as string).toLowerCase().replace(/\s+/g, "-"),
    label,
    group,
    modes,
    resolve: (ctx): PresetResult | null => {
      if (getValue) {
        const now = new Date(
          ctx.today.year,
          ctx.today.month - 1,
          ctx.today.day,
        );
        const out = getValue({ now });
        if (out == null) return null;
        if (out instanceof Date) {
          return isUsableDate(out)
            ? { kind: "date", date: jsToCalendarDate(out) }
            : null;
        }
        if (!isUsableDate(out.from) || !isUsableDate(out.to)) return null;
        return {
          kind: "range",
          range: orderRange(
            jsToCalendarDate(out.from),
            jsToCalendarDate(out.to),
          ),
        };
      }
      if (value == null) return null;
      if (value instanceof Date && !isUsableDate(value)) return null;
      const base =
        value instanceof Date
          ? jsToCalendarDate(value)
          : addDays(ctx.today, value);
      return range != null
        ? { kind: "range", range: orderRange(base, addDays(base, range)) }
        : { kind: "date", date: base };
    },
  };
}
