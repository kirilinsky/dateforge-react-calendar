import { getDateTimeFormat, getNumberFormat } from "@/utils/intl-cache";

export const DAY_MS = 86_400_000;
export const HOUR_MS = 3_600_000;
export const MINUTE_MS = 60_000;

export type CalendarInfoUnit = "day" | "hour" | "minute";

export type CalendarInfoRangeStyle = "days" | "duration";
export type CalendarInfoRelativeTarget =
  | "selected"
  | "range-start"
  | "range-end";

export interface CalendarInfoFormatContext {
  hour12: boolean;
  locale: string;
  timeZone?: string;
}

export interface CalendarInfoFormatHelpers {
  formatRelative: (date: Date, baseDate?: Date) => string;
  formatSelectionCount: (count: number) => string | null;
  formatUnit: (value: number, unit: CalendarInfoUnit) => string;
}

export type CalendarInfoUnitFormatter = (
  value: number,
  unit: CalendarInfoUnit,
  context: CalendarInfoFormatContext,
) => string | undefined;

export type CalendarInfoSelectionCountFormatter = (
  count: number,
  context: CalendarInfoFormatContext,
) => string;

export interface CalendarInfoTargetContext {
  rangeEnd: Date | null;
  rangeStart: Date | null;
  selectedDate: Date | null;
  selectedDates: Date[];
}

export interface CalendarInfoRangeSummaryContext {
  durationDays: number;
  durationMs: number;
  from: Date;
  to: Date;
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

export const getRelativeTargetDate = (
  target: CalendarInfoRelativeTarget,
  context: CalendarInfoTargetContext,
) => {
  if (target === "range-start") return context.rangeStart;
  if (target === "range-end") return context.rangeEnd;
  return (
    context.selectedDate ??
    context.selectedDates[0] ??
    context.rangeStart ??
    context.rangeEnd
  );
};

const getRelativeUnitValue = (
  targetDate: Date,
  baseDate: Date,
  timeZone?: string,
): [Intl.RelativeTimeFormatUnit, number] => {
  const dayDiff =
    getCalendarDayIndex(targetDate, timeZone) -
    getCalendarDayIndex(baseDate, timeZone);
  if (dayDiff !== 0) return ["day", dayDiff];

  const diffMs = targetDate.getTime() - baseDate.getTime();
  const hourDiff = Math.round(diffMs / HOUR_MS);
  if (hourDiff !== 0) return ["hour", hourDiff];

  const minuteDiff = Math.round(diffMs / MINUTE_MS);
  return ["minute", minuteDiff];
};

export const createCalendarInfoFormatters = ({
  hour12,
  locale,
  relativeBaseDate,
  selectionCountFormatter,
  timeZone,
  unitFormatter,
}: {
  hour12: boolean;
  locale: string;
  relativeBaseDate: Date | null;
  selectionCountFormatter?: CalendarInfoSelectionCountFormatter;
  timeZone?: string;
  unitFormatter?: CalendarInfoUnitFormatter;
}): CalendarInfoFormatHelpers => {
  const numberFormat = getNumberFormat(locale, { maximumFractionDigits: 0 });
  const formatContext = { hour12, locale, timeZone };

  const formatNumber = (value: number) =>
    numberFormat?.format(value) ?? String(value);

  const formatUnit = (value: number, unit: CalendarInfoUnit) => {
    const custom = unitFormatter?.(value, unit, formatContext);
    if (custom !== undefined) return custom;

    return (
      getNumberFormat(locale, {
        maximumFractionDigits: 0,
        style: "unit",
        unit,
        unitDisplay: "long",
      })?.format(value) ?? formatNumber(value)
    );
  };

  const formatSelectionCount = (count: number) => {
    if (!selectionCountFormatter) return null;
    return selectionCountFormatter(count, formatContext);
  };

  const formatRelative = (date: Date, baseDate = relativeBaseDate ?? null) => {
    if (!baseDate) return "";
    const [unit, value] = getRelativeUnitValue(date, baseDate, timeZone);
    try {
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(
        value,
        unit,
      );
    } catch {
      return formatUnit(value, unit as CalendarInfoUnit);
    }
  };

  return { formatRelative, formatSelectionCount, formatUnit };
};

const formatDuration = (
  durationMs: number,
  formatUnit: CalendarInfoFormatHelpers["formatUnit"],
) => {
  const ms = Math.abs(durationMs);
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const parts: string[] = [];

  if (days > 0) parts.push(formatUnit(days, "day"));
  if (hours > 0) parts.push(formatUnit(hours, "hour"));
  if (parts.length === 0) parts.push(formatUnit(minutes, "minute"));

  return parts.join(" ");
};

export const formatCalendarInfoRangeSummary = ({
  context,
  helpers,
  rangeStyle,
}: {
  context: CalendarInfoRangeSummaryContext;
  helpers: CalendarInfoFormatHelpers;
  rangeStyle: CalendarInfoRangeStyle;
}) => {
  if (rangeStyle === "duration") {
    return formatDuration(context.durationMs, helpers.formatUnit);
  }
  return helpers.formatUnit(context.durationDays, "day");
};

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
