export const padTime = (n: number) => n.toString().padStart(2, "0");

export const getDrumValue = (
  current: number,
  offset: number,
  max: number,
): number => {
  const val = (current + offset) % max;
  return val < 0 ? val + max : val;
};

import { getDateTimeFormat } from "./intl-cache";

export const getTimeString = (
  date: Date,
  hour12 = false,
  showSeconds = false,
  locale = "en",
): string =>
  getDateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    ...(showSeconds ? { second: "2-digit" } : {}),
    hour12,
  }).format(date);
