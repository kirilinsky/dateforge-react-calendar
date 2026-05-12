const dateTimeCache = new Map<string, Intl.DateTimeFormat>();
const numberFormatCache = new Map<string, Intl.NumberFormat>();
const MAX_ENTRIES = 64;

const stableOptionsKey = (options?: object): string => {
  if (!options) return "";
  const rec = options as Record<string, unknown>;
  const keys = Object.keys(rec).sort();
  const pairs = keys.map((k) => [k, rec[k]]);
  return JSON.stringify(pairs);
};

const evictOldestIfFull = (cache: Map<string, unknown>) => {
  if (cache.size < MAX_ENTRIES) return;
  const oldest = cache.keys().next().value;
  if (oldest !== undefined) cache.delete(oldest);
};

export const getDateTimeFormat = (
  locale: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat => {
  const key = `${locale ?? ""}|${stableOptionsKey(options)}`;
  const cached = dateTimeCache.get(key);
  if (cached) return cached;
  evictOldestIfFull(dateTimeCache);
  const fmt = new Intl.DateTimeFormat(locale, options);
  dateTimeCache.set(key, fmt);
  return fmt;
};

export const getNumberFormat = (
  locale: string | undefined,
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat | null => {
  const key = `${locale ?? ""}|${stableOptionsKey(options)}`;
  const cached = numberFormatCache.get(key);
  if (cached) return cached;
  evictOldestIfFull(numberFormatCache);
  try {
    const fmt = new Intl.NumberFormat(locale, options);
    numberFormatCache.set(key, fmt);
    return fmt;
  } catch {
    return null;
  }
};

export const clearIntlCache = () => {
  dateTimeCache.clear();
  numberFormatCache.clear();
};

export const __getIntlCacheSize = () => dateTimeCache.size;
