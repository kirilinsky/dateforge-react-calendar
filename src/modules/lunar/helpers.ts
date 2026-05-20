/**
 * Mean synodic month in days. Astronomical approximation; sufficient for
 * day-level phase indexing within ±1 day of the actual cycle.
 */
const SYNODIC_MONTH_DAYS = 29.530588853;

/**
 * Reference instant of a known new moon (2000-01-06 18:14 UTC). Used as the
 * epoch for cycle counting.
 */
const REF_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14);

const DAY_MS = 86_400_000;

export type LunarPhaseIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

const LUNAR_PHASE_COUNT = 8;

/**
 * Phase identifiers. Stable string keys so consumers can map them to their
 * own localized labels without depending on display strings.
 */
export type LunarPhaseKey =
  | "new"
  | "waxing-crescent"
  | "first-quarter"
  | "waxing-gibbous"
  | "full"
  | "waning-gibbous"
  | "last-quarter"
  | "waning-crescent";

export const LUNAR_PHASE_KEYS: readonly LunarPhaseKey[] = [
  "new",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
] as const;

/**
 * Returns the fractional position in the synodic cycle for `date`. Range
 * `[0, 1)` where `0` is exactly new moon and `0.5` is full moon.
 */
export const getLunarFraction = (date: Date): number => {
  const elapsedDays = (date.getTime() - REF_NEW_MOON_MS) / DAY_MS;
  const cycles = elapsedDays / SYNODIC_MONTH_DAYS;
  const frac = cycles - Math.floor(cycles);
  return frac < 0 ? frac + 1 : frac;
};

/**
 * Returns the phase index `0..7` for the given date. Buckets are centered on
 * the eight principal phases:
 *  - 0 new, 2 first quarter, 4 full, 6 last quarter
 *  - 1, 3, 5, 7 are the crescents / gibbouses between.
 */
export const getLunarPhaseIndex = (date: Date): LunarPhaseIndex => {
  const fraction = getLunarFraction(date);
  const idx =
    Math.floor(fraction * LUNAR_PHASE_COUNT + 0.5) % LUNAR_PHASE_COUNT;
  return idx as LunarPhaseIndex;
};

export const getLunarPhaseKey = (date: Date): LunarPhaseKey =>
  LUNAR_PHASE_KEYS[getLunarPhaseIndex(date)];

/**
 * Returns an illumination ratio `[0, 1]` for the phase, where `0` is fully
 * dark (new moon) and `1` is fully lit (full moon). Useful for ARIA labels
 * or analytics; not used for the visual icon (the icon is keyed off the
 * phase bucket).
 */
export const getLunarIllumination = (date: Date): number => {
  const fraction = getLunarFraction(date);
  return (1 - Math.cos(2 * Math.PI * fraction)) / 2;
};

/**
 * Resolves the displayed window of dates around `anchor` so that `anchor`
 * sits in the middle slot. When `days` is odd the anchor is the exact
 * center; when even the anchor leans one slot left.
 */
export const buildLunarWindow = (anchor: Date, days: number): Date[] => {
  const safeDays = Math.max(1, Math.floor(days));
  const half = Math.floor((safeDays - 1) / 2);
  const start = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    anchor.getDate() - half,
  );
  return Array.from({ length: safeDays }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
};

/**
 * Short Latin-ish phase abbreviations used as a universal visual fallback
 * (matches NASA / common almanac conventions). Override per consumer via the
 * `phaseLabels` prop for full localization — Intl has no built-in lunar
 * phase vocabulary.
 */
export const LUNAR_PHASE_ABBR: Readonly<Record<LunarPhaseKey, string>> = {
  new: "NEW",
  "waxing-crescent": "WAX CRES",
  "first-quarter": "FIRST QTR",
  "waxing-gibbous": "WAX GIB",
  full: "FULL",
  "waning-gibbous": "WAN GIB",
  "last-quarter": "LAST QTR",
  "waning-crescent": "WAN CRES",
};

/**
 * Long English phase names, used only as an aria-label fallback when no
 * locale-specific phase mapping is provided. Consumers should pass a
 * localized `phaseLabels` map for screen-reader experience in non-English
 * locales.
 */
export const LUNAR_PHASE_LONG: Readonly<Record<LunarPhaseKey, string>> = {
  new: "New moon",
  "waxing-crescent": "Waxing crescent",
  "first-quarter": "First quarter",
  "waxing-gibbous": "Waxing gibbous",
  full: "Full moon",
  "waning-gibbous": "Waning gibbous",
  "last-quarter": "Last quarter",
  "waning-crescent": "Waning crescent",
};
