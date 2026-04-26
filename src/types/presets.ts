/**
 * Range value returned by a preset. Always uses non-null `from`/`to`.
 */
export interface PresetRangeValue {
  from: Date;
  to: Date;
}

/**
 * Context passed to `AdvancedPresetDef.getValue` on every render.
 *
 * @property now      Real `new Date()` with time-of-day taken from the calendar's current `viewDate`.
 *                    Stable across preset clicks — does NOT drift with navigation.
 * @property isValid  Checks a candidate date against `minDate`, `maxDate`, `disabled` config.
 * @property locale   BCP-47 locale string from calendar config.
 */
export interface PresetContext {
  now: Date;
  isValid: (date: Date) => boolean;
  locale: string;
}

/**
 * Simple preset — declarative form for the common case.
 *
 * `value`:
 *   - `number`  — offset in days from today (negative = past, positive = future)
 *   - `Date`    — fixed absolute date
 *
 * `range` (optional): length of range in days after `value`.
 *   - absent or `undefined` → single-date preset
 *   - any number            → range preset: `{ from: valueDate, to: valueDate + range days }`
 *
 * @example
 * { label: "Today",       value: 0 }                                // single, today
 * { label: "Tomorrow",    value: 1 }                                // single, today + 1
 * { label: "In 3 days",   value: 3 }                                // single, today + 3
 * { label: "Last 7 days", value: -6, range: 6 }                     // range: 7 days ending today
 * { label: "Next sprint", value: 0,  range: 13 }                    // range: next 14 days
 * { label: "New Year",    value: new Date(2026, 0, 1) }             // fixed single
 * { label: "Q1 2026",     value: new Date(2026, 0, 1), range: 89 }  // fixed range
 */
export interface SimplePresetDef {
  id?: string;
  label: string | ((locale: string) => string);
  value: number | Date;
  range?: number;
}

/**
 * Advanced preset — full function form. Use when `SimplePresetDef` is not expressive enough
 * (variable month lengths, weekday-relative offsets, conditional visibility, isValid loops).
 *
 * `getValue` return:
 *   - `Date`         → single-date preset
 *   - `{ from, to }` → range preset (shown only in range mode)
 *   - `null`         → preset unavailable this render; button hidden
 */
export interface AdvancedPresetDef {
  id: string;
  label: string | ((locale: string) => string);
  getValue: (ctx: PresetContext) => Date | PresetRangeValue | null;
}

/**
 * Entry accepted inside `<CalendarPresets presets={[...]} />`.
 * Array order = render order.
 */
export type PresetEntry = SimplePresetDef | AdvancedPresetDef;
