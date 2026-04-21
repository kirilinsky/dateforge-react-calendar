import { PresetItem } from "@/types/presets";
import { DisabledConfig } from "@/types/calendar";
import { PRESET_CONFIG } from "./presets-config";
import { checkIsDateDisabled } from "@/utils/date-core";

const rtfCache: Record<string, Intl.RelativeTimeFormat> = {};

export const getPresetDate = (
  preset: PresetItem,
  currentDate?: Date,
  startDate?: Date | null,
  endDate?: Date | null,
): Date => {
  const d = new Date();
  if (currentDate) {
    d.setHours(
      currentDate.getHours(),
      currentDate.getMinutes(),
      currentDate.getSeconds(),
      currentDate.getMilliseconds(),
    );
  } else {
    d.setHours(0, 0, 0, 0);
  }
  preset.calc(d);
  if (startDate && d.getTime() < startDate.getTime()) {
    d.setHours(startDate.getHours(), startDate.getMinutes(), startDate.getSeconds(), 0);
  }
  if (endDate && d.getTime() > endDate.getTime()) {
    d.setHours(endDate.getHours(), endDate.getMinutes(), endDate.getSeconds(), 0);
  }
  return d;
};

export const getRelativeLabel = (
  locale: string,
  amount: number,
  unit: Intl.RelativeTimeFormatUnit,
) => {
  if (!rtfCache[locale])
    rtfCache[locale] = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const s = rtfCache[locale].format(amount, unit);
  return s[0].toUpperCase() + s.slice(1);
};

export const getFilteredPresets = (
  showYears: boolean,
  showMonths: boolean,
  startDate?: Date | null,
  endDate?: Date | null,
  disabled?: DisabledConfig,
): (PresetItem & { targetDate: Date })[] => {
  const excluded = [
    ...(!showMonths ? ["month", "week"] : []),
    ...(!showYears ? ["year"] : []),
  ];
  return PRESET_CONFIG.filter((p) => !excluded.includes(p.unit))
    .map((p) => ({ ...p, targetDate: getPresetDate(p) }))
    .filter(
      ({ targetDate }) =>
        !checkIsDateDisabled(targetDate, startDate, endDate, disabled),
    );
};
