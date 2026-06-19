import { useMemo } from "react";
import { boundDateOf } from "../../core-v3/bound";
import {
  type CalendarDate,
  calendarDate,
  datesEqual,
  daysInMonth,
} from "../../core-v3/calendar-date";
import { CheckIcon, ClearIcon } from "../../react-v3/icons";
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
  // NOT in multiselect: there the track is a cursor, so following the (changing)
  // first-selected day would make it JUMP every time you toggle a day — let it
  // stay where the user scrolled (the view, which `onChange` keeps in sync).
  const selectedDay =
    !boundDate && selection.shape === "point" && config.mode !== "multiple"
      ? selection.dates.find(
          (d) => d.date.year === year && d.date.month === month,
        )?.date.day
      : undefined;
  const initialIndex = (boundDate?.day ?? selectedDay ?? viewDate.day) - 1;

  const inMonth = (d?: { year: number; month: number }) =>
    !!d && d.year === year && d.month === month;
  let minIndex = inMonth(config.min) ? config.min!.day - 1 : undefined;
  let maxIndex = inMonth(config.max) ? config.max!.day - 1 : undefined;

  // Drum walls for bound mode: the OPPOSITE bound walls this track within the
  // same month, so the from-day can't scroll past the to-day (and vice versa).
  // The physical wall replaces a scroll-past-then-reject-then-snap-back — the
  // core still owns ordering, this is just the affordance (cf. the TimeWheel).
  const oppositeBound = boundDate
    ? boundDateOf(selection, bound === "from" ? "to" : "from")
    : undefined;
  if (oppositeBound && inMonth(oppositeBound)) {
    const wall = oppositeBound.day - 1;
    if (bound === "from") maxIndex = Math.min(maxIndex ?? days - 1, wall);
    else if (bound === "to") minIndex = Math.max(minIndex ?? 0, wall);
  }
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
  // Multiselect (multiple mode): the track only MOVES the cursor; a confirm
  // overlay on the centred day toggles it into the selection — auto-committing
  // each landed day while scrolling would carpet the month.
  const isMulti = selection.shape === "point" && config.mode === "multiple";
  const pointDates = selection.shape === "point" ? selection.dates : [];
  const isSelectedDay = (d: CalendarDate) =>
    pointDates.some((p) => datesEqual(p.date, d));

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
      renderOverlay={
        isMulti
          ? ({ activeIndex }) => {
              const date = calendarDate(year, month, activeIndex + 1);
              const selected = isSelectedDay(date);
              return (
                <button
                  type="button"
                  data-track-confirm=""
                  data-selected={selected ? "" : undefined}
                  className={track.confirm}
                  disabled={config.readOnly}
                  aria-label={t(
                    selected ? "removeSelectedDate" : "saveSelectedDate",
                  )}
                  // Don't let the press start a track drag.
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => {
                    if (!config.readOnly) selectDay(date);
                  }}
                >
                  {selected ? <ClearIcon /> : <CheckIcon />}
                </button>
              );
            }
          : undefined
      }
    />
  );
}
