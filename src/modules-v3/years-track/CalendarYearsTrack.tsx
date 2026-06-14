import { boundDateOf } from "../../core-v3/bound";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { VirtualTrack } from "../../react-v3/VirtualTrack";

export type CalendarYearsTrackProps = {
  /** First/last year of the track. Default min/max config or 1900–2100. */
  minYear?: number;
  maxYear?: number;
  /** Span modes: edit a range bound (`"from"`/`"to"`)'s year instead of view. */
  bound?: "from" | "to";
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the track). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the track). */
  scheme?: "light" | "dark" | "auto";
  onYearSelect?: (year: number) => void;
};

/**
 * Years as a horizontal physics track (the v2 years-track). Finite window
 * (non-circular); landing on a year navigates the view, or edits a range
 * bound's year with `bound`.
 */
export function CalendarYearsTrack({
  minYear,
  maxYear,
  bound,
  col,
  className,
  theme,
  scheme,
  onYearSelect,
}: CalendarYearsTrackProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  const boundDate = boundDateOf(selection, bound);
  const refDate = boundDate ?? viewDate;
  const min = minYear ?? config.min?.year ?? 1900;
  const max = maxYear ?? config.max?.year ?? 2100;
  const count = Math.max(1, max - min + 1);
  const currentIndex = Math.max(0, Math.min(count - 1, refDate.year - min));

  return (
    <VirtualTrack
      dataArea="years-track"
      className={className}
      count={count}
      initialIndex={currentIndex}
      half={6}
      initialItemWidth={52}
      pageStep={10}
      ariaLabel={t("yearTrack")}
      getAriaValueNow={(i) => min + i}
      getAriaValueMin={() => min}
      getAriaValueMax={() => max}
      getAriaValueText={(i) => String(min + i)}
      col={col}
      theme={theme}
      scheme={scheme}
      onChange={(index) => {
        const year = min + index;
        if (boundDate) {
          const day = Math.min(
            boundDate.day,
            daysInMonth(year, boundDate.month),
          );
          setBoundDate(calendarDate(year, boundDate.month, day), bound!);
        } else {
          navigateTo(calendarDate(year, viewDate.month, 1));
        }
        onYearSelect?.(year);
      }}
      renderItem={({ idx }) => min + idx}
    />
  );
}
