import { DayFlag } from "../core-v3/day-flags";

/**
 * The readable boundary for the packed day bitmask: turn the opaque `dayFlags`
 * number into `data-*` attributes a stylesheet (or a test) can target. The hot
 * core stays numeric; this maps to names exactly once, at the DOM edge.
 *
 * Present flags render as an empty-string attribute (`data-selected=""`),
 * absent ones are `undefined` so React omits them entirely — keeping the DOM
 * clean and CSS selectors like `[data-range-start]` precise.
 */
export type DayDataAttrs = Record<string, "" | undefined>;

const ON = "" as const;

export function dayDataAttrs(flags: number): DayDataAttrs {
  const on = (bit: number) => ((flags & bit) !== 0 ? ON : undefined);
  return {
    "data-selected": on(DayFlag.Selected),
    "data-in-range": on(DayFlag.InRange),
    "data-range-start": on(DayFlag.RangeStart),
    "data-range-end": on(DayFlag.RangeEnd),
    "data-preview": on(DayFlag.Preview),
    "data-preview-start": on(DayFlag.PreviewStart),
    "data-preview-end": on(DayFlag.PreviewEnd),
    "data-disabled": on(DayFlag.Disabled),
    "data-excluded": on(DayFlag.Excluded),
    "data-today": on(DayFlag.Today),
    "data-outside": on(DayFlag.OutOfMonth),
    "data-weekend": on(DayFlag.Weekend),
    "data-max-reached": on(DayFlag.MaxReached),
  };
}
