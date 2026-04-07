import { PresetItem } from "@/types/presets";
import { PRESET_CONFIG } from "./presets";
import { DisabledRule, StartOfWeek } from "@/types/calendar";

const rtfCache: Record<string, Intl.RelativeTimeFormat> = {};
const i18nCache: Record<string, string[]> = {};

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const mutate = (d: Date, fn: (n: Date) => void): Date => {
  const n = new Date(d.getTime());
  fn(n);
  return n;
};

const getLimit = (d?: Date | null, isMax?: boolean) =>
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
    if (unit === "month") {
      const targetMonth = d.getMonth() + v;
      const max = daysInMonth(d.getFullYear(), targetMonth);
      if (d.getDate() > max) d.setDate(max);
      d.setMonth(targetMonth);
    } else {
      d.setFullYear(d.getFullYear() + v);
    }
    if (endDate && d > endDate) d.setTime(endDate.getTime());
    if (startDate && d < startDate) d.setTime(startDate.getTime());
  });

export const setYear = (date: Date, v: number) =>
  mutate(date, (d) => d.setFullYear(v));

export const addTime = (date: Date, amount: number, unit: "h" | "m") =>
  mutate(date, (d) => {
    if (unit === "h") d.setHours(getDrumValue(d.getHours(), amount, 24));
    else d.setMinutes(getDrumValue(d.getMinutes(), amount, 60));
  });

export const getFirstDayOffset = (
  date: Date,
  startOfWeek: StartOfWeek,
): number => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return (firstDay - startOfWeek + 7) % 7;
};

export const getMonthNames = (locale: string, short?: boolean): string[] => {
  const key = `${locale}M${short ? "s" : "l"}`;
  if (!i18nCache[key]) {
    const fmt = new Intl.DateTimeFormat(locale, {
      month: short ? "short" : "long",
    }).format;
    const y = new Date().getFullYear();
    i18nCache[key] = Array.from({ length: 12 }, (_, i) =>
      fmt(new Date(y, i, 1)),
    );
  }
  return i18nCache[key];
};

export const getWeekdaysNames = (
  locale: string,
  startOfWeek: StartOfWeek,
): string[] => {
  const key = `${locale}W`;
  if (!i18nCache[key]) {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" }).format;
    const base = new Date(2024, 0, 1);
    i18nCache[key] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return fmt(d);
    });
  }
  const days = i18nCache[key];
  const shift = startOfWeek === 0 ? 6 : startOfWeek - 1;
  return shift === 0 ? days : [...days.slice(shift), ...days.slice(0, shift)];
};

export const padTime = (n: number) => n.toString().padStart(2, "0");

export const getDrumValue = (
  current: number,
  offset: number,
  max: number,
): number => {
  const val = (current + offset) % max;
  return val < 0 ? val + max : val;
};

export const getPresetDate = (
  preset: PresetItem,
  currentDate?: Date,
  startDate?: Date | null,
  endDate?: Date | null,
): Date => {
  const d = new Date();
  if (currentDate) {
    d.setHours(
      currentDate.getHours(),
      currentDate.getMinutes(),
      currentDate.getSeconds(),
      currentDate.getMilliseconds(),
    );
  } else {
    d.setHours(0, 0, 0, 0);
  }
  preset.calc(d);
  if (startDate && d.getTime() < startDate.getTime()) {
    d.setHours(
      startDate.getHours(),
      startDate.getMinutes(),
      startDate.getSeconds(),
      0,
    );
  }
  if (endDate && d.getTime() > endDate.getTime()) {
    d.setHours(
      endDate.getHours(),
      endDate.getMinutes(),
      endDate.getSeconds(),
      0,
    );
  }
  return d;
};

export const getRelativeLabel = (
  locale: string,
  amount: number,
  unit: Intl.RelativeTimeFormatUnit,
) => {
  if (!rtfCache[locale])
    rtfCache[locale] = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const s = rtfCache[locale].format(amount, unit);
  return s[0].toUpperCase() + s.slice(1);
};

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
  disabled?: DisabledRule | DisabledRule[],
): boolean => {
  if (disabled !== undefined) {
    const rules = Array.isArray(disabled) ? disabled : [disabled];
    if (rules.some((rule) => checkDisabledRule(viewDate, rule))) return true;
  }
  if (!startDate && !endDate) return false;
  const t = viewDate.getTime();
  const minT = getLimit(startDate);
  const maxT = getLimit(endDate, true);
  return (minT !== null && t < minT) || (maxT !== null && t > maxT);
};

export const getMonthListData = (
  locale: string,
  year: number,
  startDate?: Date | null,
  endDate?: Date | null,
  short?: boolean,
) => {
  const names = getMonthNames(locale, short);
  const minT = getLimit(startDate);
  const maxT = getLimit(endDate, true);
  return names.map((label, i) => ({
    label,
    disabled:
      minT !== null || maxT !== null
        ? (minT !== null && new Date(year, i + 1, 0).getTime() < minT) ||
          (maxT !== null && new Date(year, i, 1).getTime() > maxT)
        : false,
  }));
};

const navBoundsFromDisabled = (
  disabled?: DisabledRule | DisabledRule[],
): { min?: Date; max?: Date } => {
  const rules =
    disabled === undefined
      ? []
      : Array.isArray(disabled)
        ? disabled
        : [disabled];
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
  disabled?: DisabledRule | DisabledRule[],
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

export const getFilteredPresets = (
  showYears: boolean,
  showMonths: boolean,
  startDate?: Date | null,
  endDate?: Date | null,
  disabled?: DisabledRule | DisabledRule[],
): (PresetItem & { targetDate: Date })[] => {
  const excluded = [
    ...(!showMonths ? ["month", "week"] : []),
    ...(!showYears ? ["year"] : []),
  ];
  return PRESET_CONFIG.filter((p) => !excluded.includes(p.unit))
    .map((p) => ({ ...p, targetDate: getPresetDate(p) }))
    .filter(
      ({ targetDate }) =>
        !checkIsDateDisabled(targetDate, startDate, endDate, disabled),
    );
};

export const getNextMonthFromSwipe = (
  deltaX: number,
  currentDate: Date,
  startDate?: Date,
  endDate?: Date,
  threshold = 50,
  disabled?: DisabledRule | DisabledRule[],
): Date | null => {
  if (Math.abs(deltaX) < threshold) return null;
  const dir = deltaX > 0 ? 1 : -1;
  const d = new Date(currentDate);
  const expectedMonth = (d.getMonth() + dir + 12) % 12;
  d.setMonth(d.getMonth() + dir);
  if (d.getMonth() !== expectedMonth) d.setDate(0);
  const ym = d.getFullYear() * 12 + d.getMonth();
  if (startDate && ym < startDate.getFullYear() * 12 + startDate.getMonth())
    return null;
  if (endDate && ym > endDate.getFullYear() * 12 + endDate.getMonth())
    return null;
  const { min, max } = navBoundsFromDisabled(disabled);
  if (min && ym < min.getFullYear() * 12 + min.getMonth()) return null;
  if (max && ym > max.getFullYear() * 12 + max.getMonth()) return null;
  return d;
};

export const getWeekNumber = (date: Date): number => {
  const target = new Date(date.getTime());
  target.setDate(target.getDate() - ((date.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  return (
    1 + Math.ceil((target.getTime() - firstThursday.getTime()) / 604800000)
  );
};

export interface RangeOptions {
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  hoverDate?: Date | null;
  rangeMinDays?: number;
  rangeMaxDays?: number;
}

export const getCalendarData = (
  currentYear: number,
  currentMonth: number,
  offset: number,
  selectedDates: Date[],
  startDate?: Date | null,
  endDate?: Date | null,
  disabled?: DisabledRule | DisabledRule[],
  rangeOpts?: RangeOptions,
) => {
  const DAY_MS = 86400000;
  const isRangeMode = !!(rangeOpts?.rangeStart || rangeOpts?.hoverDate);
  const selectedTimes = new Set(
    selectedDates.map((d) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(),
    ),
  );

  const rS = rangeOpts?.rangeStart;
  const rE = rangeOpts?.rangeEnd;
  const hD = rangeOpts?.hoverDate;
  const rangeMinDays = rangeOpts?.rangeMinDays;
  const rangeMaxDays = rangeOpts?.rangeMaxDays;

  const rStartT = rS
    ? new Date(rS.getFullYear(), rS.getMonth(), rS.getDate()).getTime()
    : null;
  const rEndT = rE
    ? new Date(rE.getFullYear(), rE.getMonth(), rE.getDate()).getTime()
    : null;

  const isPreviewMode = rStartT !== null && rEndT === null && hD !== null;
  const hDT = hD
    ? new Date(hD.getFullYear(), hD.getMonth(), hD.getDate()).getTime()
    : null;
  const pMinT = isPreviewMode && hDT !== null ? Math.min(rStartT, hDT) : null;
  const pMaxT = isPreviewMode && hDT !== null ? Math.max(rStartT, hDT) : null;

  return Array.from({ length: 6 }, (_, i) => {
    const days = Array.from({ length: 7 }, (_, j) => {
      const fullDate = new Date(
        currentYear,
        currentMonth,
        i * 7 + j - offset + 1,
      );
      const t = fullDate.getTime();
      const isSelected = selectedTimes.has(t);

      const connectLeft =
        !isRangeMode && isSelected && j > 0 && selectedTimes.has(t - DAY_MS);
      const connectRight =
        !isRangeMode && isSelected && j < 6 && selectedTimes.has(t + DAY_MS);

      const isRangeStart = rStartT !== null && rEndT !== null && t === rStartT;
      const isRangeEnd = rStartT !== null && rEndT !== null && t === rEndT;
      const isInRange =
        rStartT !== null && rEndT !== null && t > rStartT && t < rEndT;
      const rangeBridgeLeft =
        (isRangeEnd || isInRange) &&
        j > 0 &&
        rStartT !== null &&
        t - DAY_MS >= rStartT;
      const rangeBridgeRight =
        (isRangeStart || isInRange) &&
        j < 6 &&
        rEndT !== null &&
        t + DAY_MS <= rEndT;

      const isPreviewStart = isPreviewMode && pMinT !== null && t === pMinT;
      const isPreviewEnd = isPreviewMode && pMaxT !== null && t === pMaxT;
      const isPreviewMid =
        isPreviewMode &&
        pMinT !== null &&
        pMaxT !== null &&
        t > pMinT &&
        t < pMaxT;
      const previewBridgeLeft =
        (isPreviewEnd || isPreviewMid) &&
        j > 0 &&
        pMinT !== null &&
        t - DAY_MS >= pMinT;
      const previewBridgeRight =
        (isPreviewStart || isPreviewMid) &&
        j < 6 &&
        pMaxT !== null &&
        t + DAY_MS <= pMaxT;

      const isDisabled = checkIsDateDisabled(
        fullDate,
        startDate,
        endDate,
        disabled,
      );
      let isRangeLimitDisabled = false;
      if (!isDisabled && rStartT !== null && rEndT === null && t !== rStartT) {
        const diffDays = Math.round(Math.abs(t - rStartT) / DAY_MS) + 1;
        if (rangeMinDays !== undefined && diffDays < rangeMinDays)
          isRangeLimitDisabled = true;
        if (rangeMaxDays !== undefined && diffDays > rangeMaxDays)
          isRangeLimitDisabled = true;
      }

      return {
        day: fullDate.getDate(),
        fullDate,
        isCurrentMonth: fullDate.getMonth() === currentMonth,
        isDisabled: isDisabled || isRangeLimitDisabled,
        isRangeLimitDisabled,
        isSelected,
        connectLeft,
        connectRight,
        isRangeStart,
        isRangeEnd,
        isInRange,
        rangeBridgeLeft,
        rangeBridgeRight,
        isPreviewStart,
        isPreviewEnd,
        isPreviewMid,
        previewBridgeLeft,
        previewBridgeRight,
      };
    });
    return {
      weekNumber: String(getWeekNumber(days[0].fullDate)).padStart(2, "0"),
      days,
    };
  });
};

export const getTimeString = (date: Date, hour12 = false): string =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(date);
