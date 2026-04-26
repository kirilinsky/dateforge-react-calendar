import type { CalendarMode } from "@/types/calendar";

const PREFIX = "[react-calendar-datetime]";
const seen = new Set<string>();

const isDev = (): boolean =>
  typeof process !== "undefined" &&
  process.env != null &&
  process.env.NODE_ENV !== "production";

export function warnOnce(key: string, message: string): void {
  if (!isDev()) return;
  if (seen.has(key)) return;
  seen.add(key);
  // eslint-disable-next-line no-console
  console.warn(`${PREFIX} ${message}`);
}

// Test-only — clears the dedupe cache so the same warning can fire again.
export function __resetWarnOnce(): void {
  seen.clear();
}

const isInvalidDate = (d: unknown): d is Date =>
  d instanceof Date && isNaN(d.getTime());

const isRangeShape = (
  v: unknown,
): v is { from: Date | null; to: Date | null } =>
  v !== null &&
  typeof v === "object" &&
  !Array.isArray(v) &&
  !(v instanceof Date) &&
  "from" in (v as object);

export function validateCalendarValue(
  value: unknown,
  mode: CalendarMode,
  source: "value" | "defaultValue" = "value",
): void {
  if (!isDev() || value == null) return;

  if (mode === "range") {
    if (value instanceof Date) {
      warnOnce(
        `shape:range:date:${source}`,
        `${source}: mode="range" expects { from, to } but received a Date. The Date is being used as { from, to: null }.`,
      );
    } else if (Array.isArray(value)) {
      warnOnce(
        `shape:range:array:${source}`,
        `${source}: mode="range" expects { from, to } but received Date[]. Treating array[0] as 'from' and array[1] as 'to'.`,
      );
    }
  } else if (mode === "multiple") {
    if (value instanceof Date) {
      warnOnce(
        `shape:multiple:date:${source}`,
        `${source}: mode="multiple" expects Date[] but received a Date. Wrap it in an array.`,
      );
    } else if (isRangeShape(value)) {
      warnOnce(
        `shape:multiple:range:${source}`,
        `${source}: mode="multiple" expects Date[] but received { from, to }.`,
      );
    }
  } else {
    if (Array.isArray(value)) {
      warnOnce(
        `shape:single:array:${source}`,
        `${source}: mode="single" expects Date | null but received Date[]. Using array[0].`,
      );
    } else if (isRangeShape(value)) {
      warnOnce(
        `shape:single:range:${source}`,
        `${source}: mode="single" expects Date | null but received { from, to }. Using 'from'.`,
      );
    }
  }

  const dates: unknown[] = [];
  if (value instanceof Date) dates.push(value);
  else if (Array.isArray(value)) dates.push(...value);
  else if (isRangeShape(value)) {
    if (value.from) dates.push(value.from);
    if (value.to) dates.push(value.to);
  }
  for (const d of dates) {
    if (isInvalidDate(d)) {
      warnOnce(
        `invalid-date:${source}`,
        `${source} contains an invalid Date (NaN). It will be replaced with today.`,
      );
    }
  }
}

export function validateMinMax(
  minDate: Date | undefined,
  maxDate: Date | undefined,
): void {
  if (!isDev()) return;
  if (!minDate || !maxDate) return;
  if (minDate.getTime() > maxDate.getTime()) {
    warnOnce(
      "min-gt-max",
      `minDate is later than maxDate. No date will be selectable.`,
    );
  }
}
