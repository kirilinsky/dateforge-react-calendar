import { warnOnce } from "@/core/dev-warn";
import type { DisabledConfig } from "@/types/calendar";
import type {
  AdvancedPresetDef,
  PresetContext,
  PresetEntry,
  PresetRangeValue,
  SimplePresetDef,
} from "@/types/presets";
import { checkIsDateDisabled } from "@/utils/date-core";

const isValidDate = (d: unknown): d is Date =>
  d instanceof Date && !isNaN(d.getTime());

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const rtfCache: Record<string, Intl.RelativeTimeFormat> = {};

export const getRelativeLabel = (
  locale: string,
  amount: number,
  unit: Intl.RelativeTimeFormatUnit,
): string => {
  if (!rtfCache[locale]) {
    rtfCache[locale] = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  }
  const s = rtfCache[locale].format(amount, unit);
  return s[0].toUpperCase() + s.slice(1);
};

const isAdvanced = (entry: PresetEntry): entry is AdvancedPresetDef =>
  typeof (entry as AdvancedPresetDef).getValue === "function";

const resolveLabel = (
  label: string | ((locale: string) => string),
  locale: string,
): string => (typeof label === "function" ? label(locale) : label);

const applyTimeFromSource = (target: Date, source: Date): Date => {
  const r = new Date(target);
  r.setHours(
    source.getHours(),
    source.getMinutes(),
    source.getSeconds(),
    source.getMilliseconds(),
  );
  return r;
};

const clampTime = (
  d: Date,
  minDate?: Date | null,
  maxDate?: Date | null,
): Date => {
  if (minDate && d.getTime() < minDate.getTime())
    return applyTimeFromSource(d, minDate);
  if (maxDate && d.getTime() > maxDate.getTime())
    return applyTimeFromSource(d, maxDate);
  return d;
};

const resolveSimpleDate = (value: number | Date, now: Date): Date => {
  if (value instanceof Date) return new Date(value);
  const d = new Date(now);
  d.setDate(d.getDate() + value);
  return d;
};

const resolveSimple = (
  def: SimplePresetDef,
  now: Date,
): Date | PresetRangeValue => {
  const base = resolveSimpleDate(def.value, now);
  if (def.range === undefined) return base;
  const end = new Date(base);
  end.setDate(end.getDate() + def.range);
  return def.range >= 0 ? { from: base, to: end } : { from: end, to: base };
};

const getEntryId = (entry: PresetEntry, idx: number): string => {
  if (entry.id) return entry.id;
  if (typeof entry.label === "string") return `preset-${entry.label}-${idx}`;
  return `preset-${idx}`;
};

interface ResolvedPreset {
  id: string;
  label: string;
  value: Date | PresetRangeValue;
  isRange: boolean;
}

/**
 * Runs each entry, filters by validity, resolves labels.
 * Range presets are skipped unless `rangeMode` is true.
 * Target dates get time-of-day from `viewDate` and are clamped into min/max bounds.
 */
export const getResolvedPresets = (
  items: PresetEntry[],
  viewDate: Date,
  locale: string,
  rangeMode: boolean,
  minDate?: Date | null,
  maxDate?: Date | null,
  disabled?: DisabledConfig,
): ResolvedPreset[] => {
  const isValid = (d: Date) =>
    !checkIsDateDisabled(d, minDate, maxDate, disabled);
  const now = new Date();
  now.setHours(
    viewDate.getHours(),
    viewDate.getMinutes(),
    viewDate.getSeconds(),
    viewDate.getMilliseconds(),
  );
  const ctx: PresetContext = { now, isValid, locale };

  const out: ResolvedPreset[] = [];
  const seenIds = new Set<string>();

  items.forEach((entry, idx) => {
    if (!isPlainObject(entry)) {
      warnOnce(
        `preset:invalid-entry:${idx}`,
        `preset[${idx}] is not an object (received: ${JSON.stringify(entry)}). Entry skipped.`,
      );
      return;
    }
    if (entry.label == null) {
      warnOnce(
        `preset:missing-label:${idx}`,
        `preset[${idx}] is missing the required \`label\` field. Entry skipped.`,
      );
      return;
    }

    const id = getEntryId(entry, idx);
    if (seenIds.has(id)) {
      warnOnce(
        `preset:duplicate-id:${id}`,
        `Duplicate preset id "${id}" detected. The first occurrence wins; subsequent entries with the same id are skipped.`,
      );
      return;
    }

    let result: Date | PresetRangeValue | null;
    try {
      result = isAdvanced(entry)
        ? entry.getValue(ctx)
        : resolveSimple(entry, now);
    } catch (err) {
      warnOnce(
        `preset:throws:${id}`,
        `preset "${id}" getValue threw: ${err instanceof Error ? err.message : String(err)}. Entry skipped.`,
      );
      return;
    }

    if (!result) return;

    if (result instanceof Date) {
      if (!isValidDate(result)) {
        warnOnce(
          `preset:invalid-date:${id}`,
          `preset "${id}" produced an invalid Date (NaN). Entry skipped.`,
        );
        return;
      }
      const d = applyTimeFromSource(result, viewDate);
      const clamped = clampTime(d, minDate, maxDate);
      if (!isValid(clamped)) return;
      seenIds.add(id);
      out.push({
        id,
        label: resolveLabel(entry.label, locale),
        value: clamped,
        isRange: false,
      });
      return;
    }

    if (!isPlainObject(result) || !("from" in result) || !("to" in result)) {
      warnOnce(
        `preset:bad-shape:${id}`,
        `preset "${id}" returned an unexpected shape from getValue. Expected Date | { from, to } | null.`,
      );
      return;
    }
    if (!isValidDate(result.from) || !isValidDate(result.to)) {
      warnOnce(
        `preset:invalid-range:${id}`,
        `preset "${id}" produced a range with invalid Date(s). Entry skipped.`,
      );
      return;
    }
    if (!rangeMode) return;
    const from = applyTimeFromSource(result.from, viewDate);
    const to = applyTimeFromSource(result.to, viewDate);
    if (!isValid(from) || !isValid(to)) return;
    seenIds.add(id);
    out.push({
      id,
      label: resolveLabel(entry.label, locale),
      value: { from, to },
      isRange: true,
    });
  });
  return out;
};
