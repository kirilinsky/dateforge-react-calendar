// TODO: locale-aware format support (e.g. MM/DD/YYYY for en-US, YYYY-MM-DD for ISO).
// Today the mask is hardcoded to DD.MM.YYYY. Add a `format` prop on CalendarManualSelect
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
  return new Date(y, m - 1, d);
};

export const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};
