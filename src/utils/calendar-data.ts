import { StartOfWeek } from "@/types/calendar";
import { checkIsDateDisabled } from "./date-core";

export interface RangeOptions {
  rangeStart?: Date | null;
  rangeEnd?: Date | null;
  hoverDate?: Date | null;
  minRangeDays?: number;
  maxRangeDays?: number;
}

const I18N_CACHE_MAX = 32;
const i18nCache = new Map<string, string[]>();

const cacheSet = (key: string, value: string[]): string[] => {
  if (i18nCache.size >= I18N_CACHE_MAX) {
    i18nCache.delete(i18nCache.keys().next().value as string);
  }
  i18nCache.set(key, value);
  return value;
};

export const getWeekdaysNames = (
  locale: string,
  startOfWeek: StartOfWeek,
): string[] => {
  const key = `${locale}W${startOfWeek}`;
  const cached = i18nCache.get(key);
  if (cached) return cached;

  const baseKey = `${locale}W`;
  let days = i18nCache.get(baseKey);
  if (!days) {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" }).format;
    const base = new Date(2024, 0, 1);
    days = cacheSet(baseKey, Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return fmt(d);
    }));
  }

  const shift = startOfWeek === 0 ? 6 : startOfWeek - 1;
  return cacheSet(key, shift === 0 ? days : [...days.slice(shift), ...days.slice(0, shift)]);
};

export const getFirstDayOffset = (
  date: Date,
  startOfWeek: StartOfWeek,
): number => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return (firstDay - startOfWeek + 7) % 7;
};

export const getWeekNumber = (date: Date): number => {
  const target = new Date(date.getTime());
  target.setDate(target.getDate() - ((date.getDay() + 6) % 7) + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  return (
    1 + Math.ceil((target.getTime() - firstThursday.getTime()) / 604800000)
  );
};

export const getCalendarData = (
  currentYear: number,
  currentMonth: number,
  offset: number,
  selectedDates: Date[],
  startDate?: Date | null,
  endDate?: Date | null,
  disabled?: import("@/types/calendar").DisabledConfig,
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
  const minRangeDays = rangeOpts?.minRangeDays;
  const maxRangeDays = rangeOpts?.maxRangeDays;

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
        if (minRangeDays !== undefined && diffDays < minRangeDays)
          isRangeLimitDisabled = true;
        if (maxRangeDays !== undefined && diffDays > maxRangeDays)
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
