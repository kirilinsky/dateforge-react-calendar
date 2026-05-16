import { getDateTimeFormat, getNumberFormat } from "@/utils/intl-cache";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

type CalendarInfoUnit = "day" | "hour" | "minute";
export type CalendarInfoRangeStyle = "days" | "duration";

export interface CalendarInfoRangeSummaryContext {
  durationDays: number;
  durationMs: number;
  locale: string;
  rangeStyle: CalendarInfoRangeStyle;
}

export const isValidDate = (date: Date | null | undefined): date is Date =>
  date instanceof Date && !Number.isNaN(date.getTime());

const getDatePartValue = (
  parts: Intl.DateTimeFormatPart[],
  type: "day" | "month" | "year",
) => Number(parts.find((part) => part.type === type)?.value);

export const getCalendarDayIndex = (date: Date, timeZone?: string) => {
  const formatter = getDateTimeFormat("en-US-u-ca-gregory", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    ...(timeZone && { timeZone }),
  });
  const parts = formatter.formatToParts(date);
  return (
    Date.UTC(
      getDatePartValue(parts, "year"),
      getDatePartValue(parts, "month") - 1,
      getDatePartValue(parts, "day"),
    ) / DAY_MS
  );
};

const getRelativeDayDiff = (
  targetDate: Date,
  baseDate: Date,
  timeZone?: string,
): number =>
  getCalendarDayIndex(targetDate, timeZone) -
  getCalendarDayIndex(baseDate, timeZone);

const formatNumber = (value: number, locale: string) =>
  getNumberFormat(locale, { maximumFractionDigits: 0 })?.format(value) ??
  String(value);

const formatUnit = (value: number, unit: CalendarInfoUnit, locale: string) =>
  getNumberFormat(locale, {
    maximumFractionDigits: 0,
    style: "unit",
    unit,
    unitDisplay: "long",
  })?.format(value) ?? formatNumber(value, locale);

export const formatCalendarInfoRelative = ({
  baseDate,
  locale,
  targetDate,
  timeZone,
}: {
  baseDate: Date | null;
  locale: string;
  targetDate: Date;
  timeZone?: string;
}) => {
  if (!baseDate) return "";
  const dayDiff = getRelativeDayDiff(targetDate, baseDate, timeZone);
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
      dayDiff,
      "day",
    );
  } catch {
    return formatUnit(dayDiff, "day", locale);
  }
};

const formatDuration = ({
  durationMs,
  locale,
}: {
  durationMs: number;
  locale: string;
}) => {
  const ms = Math.abs(durationMs);
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const parts: string[] = [];

  if (days > 0) parts.push(formatUnit(days, "day", locale));
  if (hours > 0) parts.push(formatUnit(hours, "hour", locale));
  if (parts.length === 0) parts.push(formatUnit(minutes, "minute", locale));

  return parts.join(" ");
};

export const formatCalendarInfoRangeSummary = ({
  durationDays,
  durationMs,
  locale,
  rangeStyle,
}: CalendarInfoRangeSummaryContext) => {
  if (rangeStyle === "duration") {
    return formatDuration({ durationMs, locale });
  }
  return formatUnit(durationDays, "day", locale);
};

export const formatCalendarInfoSelectionSummary = (
  count: number,
  locale: string,
) => formatUnit(count, "day", locale);

export const getTargetPaddingY = (
  inner: HTMLDivElement,
  fallbackStyle: CSSStyleDeclaration,
): number => {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.paddingTop = "var(--cal-spacing)";
  probe.style.paddingBottom = "var(--cal-spacing)";
  inner.appendChild(probe);

  const probeStyle = window.getComputedStyle(probe);
  const targetPaddingTop = Number.parseFloat(probeStyle.paddingTop);
  const targetPaddingBottom = Number.parseFloat(probeStyle.paddingBottom);
  probe.remove();

  const targetPaddingY =
    (Number.isFinite(targetPaddingTop) ? targetPaddingTop : 0) +
    (Number.isFinite(targetPaddingBottom) ? targetPaddingBottom : 0);

  if (targetPaddingY > 0) return targetPaddingY;

  const paddingTop = Number.parseFloat(fallbackStyle.paddingTop);
  const paddingBottom = Number.parseFloat(fallbackStyle.paddingBottom);
  return (
    (Number.isFinite(paddingTop) ? paddingTop : 0) +
    (Number.isFinite(paddingBottom) ? paddingBottom : 0)
  );
};
