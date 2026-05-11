const dateTimeCache = new Map<string, Intl.DateTimeFormat>();
const MAX_ENTRIES = 64;

const stableOptionsKey = (options?: Intl.DateTimeFormatOptions): string => {
  if (!options) return "";
  const keys = Object.keys(options).sort();
  const pairs = keys.map((k) => [k, (options as Record<string, unknown>)[k]]);
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

export const clearIntlCache = () => {
  dateTimeCache.clear();
};

export const __getIntlCacheSize = () => dateTimeCache.size;
