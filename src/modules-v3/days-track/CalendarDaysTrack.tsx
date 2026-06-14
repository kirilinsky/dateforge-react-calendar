import { useMemo } from "react";
import { boundDateOf } from "../../core-v3/bound";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { VirtualTrack } from "../../react-v3/VirtualTrack";
import track from "../../react-v3/virtual-track.module.css";

export type CalendarDaysTrackProps = {
  /** Show the short month name as a sub-label on the active day. */
  showMonthLabel?: boolean;
  /**
   * Span modes: edit a range bound (`"from"`/`"to"`)'s day instead of the view.
   * Commits via `setBoundDate` (core owns ordering/clamping).
   */
  bound?: "from" | "to";
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the track). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the track). */
  scheme?: "light" | "dark" | "auto";
  onDaySelect?: (year: number, month: number, day: number) => void;
};

/**
 * Days of the view month as a horizontal physics track (the v2 days-track).
 * Landing on a day navigates the view; in single mode it doubles as a day
 * picker (commits the date). With `bound` it edits the range bound's day.
 * Circular; clamps to `min`/`max` within the month. (Multiselect confirm-overlay
 * rides the deferred pass.)
 */
export function CalendarDaysTrack({
  showMonthLabel = false,
  bound,
  col,
  className,
  theme,
  scheme,
  onDaySelect,
}: CalendarDaysTrackProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, selectDay, setBoundDate } = useCalendarActions();
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  // Bound mode tracks the bound's month/day; else the view's.
  const boundDate = boundDateOf(selection, bound);
  const refDate = boundDate ?? viewDate;
  const year = refDate.year;
  const month = refDate.month;
  const days = daysInMonth(year, month);

  // Start on the bound's day, the selected day in this month, else the view day.
  const selectedDay =
    !boundDate && selection.shape === "point"
      ? selection.dates.find(
          (d) => d.date.year === year && d.date.month === month,
        )?.date.day
      : undefined;
  const initialIndex = (boundDate?.day ?? selectedDay ?? viewDate.day) - 1;

  const inMonth = (d?: { year: number; month: number }) =>
    !!d && d.year === year && d.month === month;
  const minIndex = inMonth(config.min) ? config.min!.day - 1 : undefined;
  const maxIndex = inMonth(config.max) ? config.max!.day - 1 : undefined;
  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? days - 1;

  const shortMonth = useMemo(
    () =>
      showMonthLabel
        ? new Intl.DateTimeFormat(config.locale, { month: "short" }).format(
            new Date(year, month - 1, 1),
          )
        : null,
    [showMonthLabel, config.locale, year, month],
  );
  const fullFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(config.locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [config.locale],
  );

  const isSingle = selection.shape === "point" && config.mode === "single";

  return (
    <VirtualTrack
      dataArea="days-track"
      className={className}
      count={days}
      initialIndex={initialIndex}
      circular
      minIndex={minIndex}
      maxIndex={maxIndex}
      half={5}
      initialItemWidth={44}
      pageStep={7}
      ariaLabel={t("dayTrack")}
      getAriaValueNow={(i) => i + 1}
      getAriaValueMin={() => minIdx + 1}
      getAriaValueMax={() => maxIdx + 1}
      getAriaValueText={(i) => fullFmt.format(new Date(year, month - 1, i + 1))}
      col={col}
      theme={theme}
      scheme={scheme}
      onChange={(index) => {
        const date = calendarDate(year, month, index + 1);
        if (boundDate) {
          setBoundDate(date, bound!);
        } else {
          navigateTo(date);
          if (isSingle && !config.readOnly) selectDay(date);
        }
        onDaySelect?.(year, month, index + 1);
      }}
      renderItem={({ idx, isActive }) =>
        isActive && shortMonth ? (
          <span className={track.activeLabel}>
            <span>{idx + 1}</span>
            <span className={track.subLabel}>{shortMonth}</span>
          </span>
        ) : (
          idx + 1
        )
      }
    />
  );
}
