import type { CalendarMode } from "@/types/calendar";

const PREFIX = "[@dateforge/react-calendar]";
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
  d instanceof Date && Number.isNaN(d.getTime());

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
        `${source} contains an invalid Date (NaN). It will be dropped from the selection.`,
      );
    }
  }
}

const VALID_THEME_STRINGS = new Set(["auto", "light", "dark"]);

export function validateTheme(theme: unknown): void {
  if (!isDev() || theme == null) return;
  if (typeof theme !== "string") return;
  if (VALID_THEME_STRINGS.has(theme)) return;
  warnOnce(
    `theme:invalid-string:${theme}`,
    `theme="${theme}" is not a supported string value. Only "auto" | "light" | "dark" are accepted as strings; named palettes like "midnight" must be imported as objects: import { ${theme} } from "@dateforge/react-calendar/themes/${theme}".`,
  );
}

export function validateTimeZone(tz: string | undefined): boolean {
  if (tz == null) return true;
  if (typeof tz !== "string" || tz.length === 0) {
    warnOnce(
      "tz:empty",
      `timeZone must be a non-empty string. Received: ${JSON.stringify(tz)}.`,
    );
    return false;
  }
  // UTC±N is normalized internally — accept it without probing Intl.
  if (/^UTC[+-]\d{1,2}$/i.test(tz)) return true;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    warnOnce(
      `tz:invalid:${tz}`,
      `timeZone="${tz}" is not a valid IANA timezone. Falling back to local time. Use values like "Europe/Paris", "America/New_York", "UTC", or "UTC+2".`,
    );
    return false;
  }
}

export function validateDateProp(
  value: unknown,
  propName: string,
): Date | undefined {
  if (value == null) return undefined;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  warnOnce(
    `date-prop:invalid:${propName}`,
    `${propName} must be a valid Date instance. Received: ${
      value instanceof Date ? "Invalid Date" : JSON.stringify(value)
    }. Falling back to undefined.`,
  );
  return undefined;
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
