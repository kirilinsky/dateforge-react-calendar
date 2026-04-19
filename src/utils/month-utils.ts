import { getLimit } from "./date-core";

const i18nCache: Record<string, string[]> = {};

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
