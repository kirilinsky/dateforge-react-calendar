export const DEFAULT_DATE_FORMAT = "DD.MM.YYYY" as const;

type DateToken = "DD" | "MM" | "YYYY";
const TOKEN_LEN: Record<DateToken, number> = { DD: 2, MM: 2, YYYY: 4 };

interface FormatSpec {
  tokens: DateToken[];
  separators: string[];
}

const parseFormat = (format: string): FormatSpec => {
  const tokens: DateToken[] = [];
  const separators: string[] = [];
  let i = 0;
  let buf = "";
  while (i < format.length) {
    if (format.startsWith("YYYY", i)) {
      if (tokens.length > 0) separators.push(buf);
      buf = "";
      tokens.push("YYYY");
      i += 4;
    } else if (format.startsWith("DD", i)) {
      if (tokens.length > 0) separators.push(buf);
      buf = "";
      tokens.push("DD");
      i += 2;
    } else if (format.startsWith("MM", i)) {
      if (tokens.length > 0) separators.push(buf);
      buf = "";
      tokens.push("MM");
      i += 2;
    } else {
      buf += format[i];
      i += 1;
    }
  }
  return { tokens, separators };
};

const isValidSpec = (spec: FormatSpec): boolean =>
  spec.tokens.length === 3 &&
  spec.tokens.includes("DD") &&
  spec.tokens.includes("MM") &&
  spec.tokens.includes("YYYY");

const getSpec = (format: string): FormatSpec => {
  const spec = parseFormat(format);
  if (!isValidSpec(spec)) {
    return parseFormat(DEFAULT_DATE_FORMAT);
  }
  return spec;
};

export const dateToMask = (
  d: Date | null,
  format: string = DEFAULT_DATE_FORMAT,
): string => {
  if (!d) return "";
  const spec = getSpec(format);
  const parts: Record<DateToken, string> = {
    DD: String(d.getDate()).padStart(2, "0"),
    MM: String(d.getMonth() + 1).padStart(2, "0"),
    YYYY: String(d.getFullYear()).padStart(4, "0"),
  };
  let out = "";
  for (let i = 0; i < spec.tokens.length; i++) {
    if (i > 0) out += spec.separators[i - 1];
    out += parts[spec.tokens[i]];
  }
  return out;
};

export const maskToDate = (
  raw: string,
  format: string = DEFAULT_DATE_FORMAT,
): Date | null => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const spec = getSpec(format);

  const parts: Partial<Record<DateToken, number>> = {};
  let cursor = 0;
  for (const token of spec.tokens) {
    const len = TOKEN_LEN[token];
    parts[token] = Number.parseInt(digits.slice(cursor, cursor + len), 10);
    cursor += len;
  }

  const d = parts.DD as number;
  const m = parts.MM as number;
  const y = parts.YYYY as number;
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

export const applyMask = (
  raw: string,
  format: string = DEFAULT_DATE_FORMAT,
): string => {
  const spec = getSpec(format);
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length === 0) return "";
  let out = "";
  let cursor = 0;
  for (let i = 0; i < spec.tokens.length; i++) {
    const tokenLen = TOKEN_LEN[spec.tokens[i]];
    const slice = digits.slice(cursor, cursor + tokenLen);
    if (slice.length === 0) break;
    if (i > 0) out += spec.separators[i - 1];
    out += slice;
    cursor += slice.length;
    if (slice.length < tokenLen) break;
  }
  return out;
};

/**
 * Per-segment validation while user is still typing.
 * Returns true if what's been typed so far is already impossible
 * (day > 31, month > 12, day-month combo non-existent, etc.).
 */
export const validatePartialMask = (
  raw: string,
  format: string = DEFAULT_DATE_FORMAT,
): boolean => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 0) return false;
  const spec = getSpec(format);

  const parts: Partial<Record<DateToken, number>> = {};
  let cursor = 0;
  for (const token of spec.tokens) {
    const len = TOKEN_LEN[token];
    if (digits.length >= cursor + len) {
      parts[token] = Number.parseInt(digits.slice(cursor, cursor + len), 10);
    }
    cursor += len;
  }

  if (parts.DD !== undefined && (parts.DD < 1 || parts.DD > 31)) return true;
  if (parts.MM !== undefined && (parts.MM < 1 || parts.MM > 12)) return true;
  if (parts.DD !== undefined && parts.MM !== undefined) {
    const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][
      parts.MM - 1
    ];
    if (parts.DD > maxDay) return true;
  }
  if (digits.length === 8) {
    return maskToDate(raw, format) === null;
  }
  return false;
};
