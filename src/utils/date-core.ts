import { DisabledConfig, DisabledRule } from "@/types/calendar";

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const mutate = (d: Date, fn: (n: Date) => void): Date => {
  const n = new Date(d.getTime());
  fn(n);
  return n;
};

const toLimitTimestamp = (d?: Date | null, isMax?: boolean): number | null =>
  d
    ? new Date(d).setHours(
        isMax ? 23 : 0,
        isMax ? 59 : 0,
        isMax ? 59 : 0,
        isMax ? 999 : 0,
      )
    : null;

const getYearSafe = (d?: Date | null) => d?.getFullYear() ?? null;

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const setMonth = (date: Date, v: number) =>
  mutate(date, (d) => {
    const max = daysInMonth(d.getFullYear(), v);
    if (d.getDate() > max) d.setDate(max);
    d.setMonth(v);
  });

export const addDate = (
  date: Date,
  v: number,
  unit: "month" | "year",
  startDate?: Date | null,
  endDate?: Date | null,
) =>
  mutate(date, (d) => {
    const h = d.getHours(), m = d.getMinutes(), s = d.getSeconds(), ms = d.getMilliseconds();
    if (unit === "month") {
      const targetMonth = d.getMonth() + v;
      const max = daysInMonth(d.getFullYear(), targetMonth);
      if (d.getDate() > max) d.setDate(max);
      d.setMonth(targetMonth);
    } else {
      d.setFullYear(d.getFullYear() + v);
    }
    if (endDate && d > endDate) {
      d.setTime(endDate.getTime());
      d.setHours(h, m, s, ms);
    }
    if (startDate && d < startDate) {
      d.setTime(startDate.getTime());
      d.setHours(h, m, s, ms);
    }
  });

export const setYear = (date: Date, v: number) =>
  mutate(date, (d) => d.setFullYear(v));

const checkDisabledRule = (d: Date, rule: DisabledRule): boolean => {
  if (typeof rule === "boolean") return rule;
  if (rule instanceof Date) return isSameDay(d, rule);
  if ("dayOfWeek" in rule) return rule.dayOfWeek.includes(d.getDay());
  if ("from" in rule) return d >= rule.from && d <= rule.to;
  return (
    (rule.before ? d < rule.before : false) ||
    (rule.after ? d > rule.after : false)
  );
};

export const checkIsDateDisabled = (
  viewDate: Date,
  startDate?: Date | null,
  endDate?: Date | null,
  disabled?: DisabledConfig,
): boolean => {
  if (disabled?.rules.length) {
    if (disabled.rules.some((rule) => checkDisabledRule(viewDate, rule))) return true;
  }
  if (!startDate && !endDate) return false;
  const t = viewDate.getTime();
  const minT = toLimitTimestamp(startDate);
  const maxT = toLimitTimestamp(endDate, true);
  return (minT !== null && t < minT) || (maxT !== null && t > maxT);
};

export const navBoundsFromDisabled = (
  disabled?: DisabledConfig,
): { min?: Date; max?: Date } => {
  const rules = disabled?.rules ?? [];
  let min: Date | undefined;
  let max: Date | undefined;
  for (const rule of rules) {
    if (!rule || typeof rule !== "object" || rule instanceof Date) continue;
    if ("from" in rule || "dayOfWeek" in rule) continue;
    if ("before" in rule && rule.before && (!min || rule.before > min))
      min = rule.before;
    if ("after" in rule && rule.after && (!max || rule.after < max))
      max = rule.after;
  }
  return { min, max };
};

export const checkYearNavigation = (
  payload: number | { value: number }[],
  startDate?: Date | null,
  endDate?: Date | null,
  currentDate?: Date | null,
  disabled?: DisabledConfig,
) => {
  const { min: dMin, max: dMax } = navBoundsFromDisabled(disabled);

  const effectiveStart: Date | null =
    startDate && dMin
      ? dMin > startDate
        ? dMin
        : startDate
      : (dMin ?? startDate ?? null);
  const effectiveEnd: Date | null =
    endDate && dMax
      ? dMax < endDate
        ? dMax
        : endDate
      : (dMax ?? endDate ?? null);

  const MIN = 1900,
    MAX = 2100;
  const minYear = getYearSafe(effectiveStart) ?? MIN;
  const maxYear = getYearSafe(effectiveEnd) ?? MAX;
  const startYear = Array.isArray(payload) ? payload[0].value : payload;
  const endYear = Array.isArray(payload)
    ? payload[payload.length - 1].value
    : payload;

  let canGoPrevMonth = true,
    canGoNextMonth = true;
  if (currentDate) {
    const cur = currentDate.getFullYear() * 12 + currentDate.getMonth();
    const min = effectiveStart
      ? effectiveStart.getFullYear() * 12 + effectiveStart.getMonth()
      : null;
    const max = effectiveEnd
      ? effectiveEnd.getFullYear() * 12 + effectiveEnd.getMonth()
      : null;
    canGoPrevMonth = min === null || cur > min;
    canGoNextMonth = max === null || cur < max;
  }

  return {
    canGoPrev: startYear > Math.max(minYear, MIN),
    canGoNext: endYear < Math.min(maxYear, MAX),
    canGoPrevMonth,
    canGoNextMonth,
  };
};

export const isYearFixed = (
  curYear: number,
  startDate?: Date | null,
  endDate?: Date | null,
  curMonth?: number,
): boolean => {
  if (!startDate || !endDate) return false;
  const minY = getYearSafe(startDate)!;
  const maxY = getYearSafe(endDate)!;
  if (minY !== maxY) return false;
  if (curMonth === undefined) return minY === curYear;
  return (
    minY === curYear &&
    startDate.getMonth() === curMonth &&
    endDate.getMonth() === curMonth
  );
};

