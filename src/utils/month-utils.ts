import { DisabledConfig } from "../types/calendar";
import { toLimitTimestamp } from "./date-core";

const MONTH_CACHE_MAX = 32;
const i18nCache = new Map<string, string[]>();

const cacheSet = (key: string, value: string[]): string[] => {
  if (i18nCache.size >= MONTH_CACHE_MAX) {
    i18nCache.delete(i18nCache.keys().next().value as string);
  }
  i18nCache.set(key, value);
  return value;
};

const isMonthFullyDisabled = (
  year: number,
  month: number,
  disabled?: DisabledConfig,
): boolean => {
  if (!disabled?.rules.length) return false;
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return disabled.rules.some((rule) => {
    if (typeof rule === "boolean") return rule;
    if (rule instanceof Date) return false;
    if ("dayOfWeek" in rule) return false;
    if ("from" in rule) return firstDay >= rule.from && lastDay <= rule.to;
    return (rule.before ? lastDay < rule.before : false) || (rule.after ? firstDay > rule.after : false);
  });
};

export const getMonthNames = (locale: string, short?: boolean): string[] => {
  const key = `${locale}M${short ? "s" : "l"}`;
  const cached = i18nCache.get(key);
  if (cached) return cached;
  const fmt = new Intl.DateTimeFormat(locale, {
    month: short ? "short" : "long",
  }).format;
  const y = new Date().getFullYear();
  return cacheSet(key, Array.from({ length: 12 }, (_, i) => fmt(new Date(y, i, 1))));
};

export const getMonthListData = (
  locale: string,
  year: number,
  startDate?: Date | null,
  endDate?: Date | null,
  short?: boolean,
  disabled?: DisabledConfig,
  disableLimited = true,
) => {
  const names = getMonthNames(locale, short);
  const minT = toLimitTimestamp(startDate);
  const maxT = toLimitTimestamp(endDate, true);
  return names.map((label, i) => {
    const firstDay = new Date(year, i, 1);
    const lastDay = new Date(year, i + 1, 0);
    const outOfRange =
      (minT !== null && lastDay.getTime() < minT) ||
      (maxT !== null && firstDay.getTime() > maxT);
    const fullyDisabled = !outOfRange && isMonthFullyDisabled(year, i, disabled);
    const limited = outOfRange || fullyDisabled;
    return {
      label,
      limited,
      disabled: disableLimited && limited,
    };
  });
};
