import { DisabledConfig } from "../types/calendar";
import { getLimit } from "./date-core";

const i18nCache: Record<string, string[]> = {};

export const isMonthFullyDisabled = (
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
  const minT = getLimit(startDate);
  const maxT = getLimit(endDate, true);
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
