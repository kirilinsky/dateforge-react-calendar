// TODO: locale-aware format support (e.g. MM/DD/YYYY for en-US, YYYY-MM-DD for ISO).
// Today the mask is hardcoded to DD.MM.YYYY. Add a `format` prop on CalendarManualInput
// or read from locale once there is real demand.

export const dateToMask = (d: Date | null): string => {
  if (!d) return "";
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getFullYear()),
  ].join(".");
};

export const maskToDate = (raw: string): Date | null => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const d = parseInt(digits.slice(0, 2));
  const m = parseInt(digits.slice(2, 4));
  const y = parseInt(digits.slice(4, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1000) return null;
  const date = new Date(y, m - 1, d);
  // Round-trip check rejects calendrically impossible dates (Feb 31, Apr 31, etc.) —
  // Date constructor silently rolls over (Feb 31 → Mar 3) without this guard.
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
};

export const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

/**
 * Per-segment validation while user is still typing.
 * Returns true if what's been typed so far is already impossible
 * (day > 31, month > 12, day-month combo non-existent, etc.).
 *
 * Empty / partial-but-still-possible inputs return false — invalid feedback
 * should not flash on every keystroke before the segment is even complete.
 */
export const validatePartialMask = (raw: string): boolean => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return false;

  // Day segment complete (2 digits)
  if (digits.length >= 2) {
    const d = parseInt(digits.slice(0, 2));
    if (d < 1 || d > 31) return true;
  }

  // Month segment complete (4 digits)
  if (digits.length >= 4) {
    const m = parseInt(digits.slice(2, 4));
    if (m < 1 || m > 12) return true;
  }

  // Day/month combo — flag impossible day for the month even before year is typed
  if (digits.length >= 4) {
    const d = parseInt(digits.slice(0, 2));
    const m = parseInt(digits.slice(2, 4));
    const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1];
    if (d > maxDay) return true;
  }

  // Full date — round-trip via maskToDate
  if (digits.length === 8) {
    return maskToDate(raw) === null;
  }

  return false;
};
