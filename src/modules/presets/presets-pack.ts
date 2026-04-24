import { PresetEntry } from "@/types/presets";
import { getRelativeLabel } from "./preset-utils";

const addMonths = (d: Date, n: number) => {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
};
const addYears = (d: Date, n: number) => {
  const r = new Date(d);
  r.setFullYear(r.getFullYear() + n);
  return r;
};

/**
 * Basic preset pack — the same set `<CalendarPresets />` used to render by default
 * before the API became explicit. Labels are localized via `Intl.RelativeTimeFormat`.
 *
 * Mix of simple (day / week offsets) and advanced (calendar-accurate month / year shifts).
 *
 * @example
 * import { basicPresets } from "react-calendar-datetime";
 * <CalendarPresets presets={basicPresets} />
 *
 * @example
 * // Mix with your own
 * <CalendarPresets presets={[
 *   ...basicPresets,
 *   { label: "In 3 days", value: 3 },
 * ]} />
 */
export const basicPresets: PresetEntry[] = [
  { id: "lastYear",    label: (l) => getRelativeLabel(l, -1, "year"),  getValue: ({ now }) => addYears(now, -1) },
  { id: "lastMonth",   label: (l) => getRelativeLabel(l, -1, "month"), getValue: ({ now }) => addMonths(now, -1) },
  { id: "twoWeeksAgo", label: (l) => getRelativeLabel(l, -2, "week"),  value: -14 },
  { id: "lastWeek",    label: (l) => getRelativeLabel(l, -1, "week"),  value: -7 },
  { id: "yesterday",   label: (l) => getRelativeLabel(l, -1, "day"),   value: -1 },
  { id: "today",       label: (l) => getRelativeLabel(l,  0, "day"),   value:  0 },
  { id: "tomorrow",    label: (l) => getRelativeLabel(l,  1, "day"),   value:  1 },
  { id: "nextWeek",    label: (l) => getRelativeLabel(l,  1, "week"),  value:  7 },
  { id: "inTwoWeeks",  label: (l) => getRelativeLabel(l,  2, "week"),  value:  14 },
  { id: "nextMonth",   label: (l) => getRelativeLabel(l,  1, "month"), getValue: ({ now }) => addMonths(now, 1) },
  { id: "inTwoMonths", label: (l) => getRelativeLabel(l,  2, "month"), getValue: ({ now }) => addMonths(now, 2) },
  { id: "nextYear",    label: (l) => getRelativeLabel(l,  1, "year"),  getValue: ({ now }) => addYears(now, 1) },
];
