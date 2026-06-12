import type { ReactNode } from "react";
import {
  type CalendarTime,
  MIDNIGHT,
  timesEqual,
} from "../../core-v3/calendar-time";
import { toCalendarDateTime } from "../../core-v3/timezone-boundary";
import { useToday } from "../../hooks/use-today";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./time.module.css";
import { type TimeLabelStyle, type TimeStep, TimeTrack } from "./time-track";

export type CalendarTimeWheelProps = {
  /**
   * Range mode only: edit time on one explicit boundary (`fromTime` / `toTime`)
   * instead of the point selection's time. No effect outside span selections.
   */
  bound?: "from" | "to";
  /** 12-hour clock with an AM/PM switch. Default `false` (24h). */
  hour12?: boolean;
  /** Render the seconds drum. Default `false`. */
  seconds?: boolean;
  /** Per-field increment. Default 1 each. */
  step?: TimeStep;
  /** Small label above each drum: `"short"` (HH/MM/SS) or `"long"` (localized). */
  labels?: TimeLabelStyle;
  /**
   * Render a localized date header above the drums for the bound's current
   * date. Requires `bound`; hidden while the range is empty. Default `true`.
   */
  showBoundDate?: boolean;
  /**
   * Render a "now" reset button below the drums. Click sets the time fields
   * on the selection (or bound) to the current hour/minute (and second when
   * `seconds` is on). Default `false`.
   */
  showReset?: boolean;
  /** Override the reset button content. Default: localized "now" word. */
  resetLabel?: ReactNode;
  /** aria-label template for the reset button (registry key `resetTime`). */
  resetTimeLabel?: string;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
  /**
   * Observational: fires after a time change actually commits (rejected
   * attempts — walls, validation — do not fire). The root `onChange` stays
   * the single source of the public value.
   */
  onTimeSelect?: (time: CalendarTime) => void;
};

export function CalendarTimeWheel({
  bound,
  hour12 = false,
  seconds = false,
  step,
  labels,
  showBoundDate = true,
  showReset = false,
  resetLabel,
  resetTimeLabel,
  hoursLabel,
  minutesLabel,
  secondsLabel,
  timePeriodLabel,
  timePickerLabel,
  theme,
  scheme,
  col,
  className,
  onTimeSelect,
}: CalendarTimeWheelProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { setTime } = useCalendarActions();
  const today = useToday();

  const selection = useStoreSelector(store, (s) => s.selection);

  // Resolve the time this wheel edits. Span bounds read from/to; point shape
  // reads the single date's time; both fall back to the configured default.
  const value: CalendarTime = (() => {
    if (selection.shape === "span") {
      const bt = bound === "to" ? selection.toTime : selection.fromTime;
      return bt ?? config.defaultTime ?? MIDNIGHT;
    }
    return selection.dates[0]?.time ?? config.defaultTime ?? MIDNIGHT;
  })();

  // Range bounds are finite (non-circular); a point wheel spins freely.
  const isBound = selection.shape === "span" && bound !== undefined;

  // The strategy can only commit a time onto an existing selection (a picked
  // day, or a drawn range). Without one, `setTime` is a no-op — so the wheel
  // would look alive but do nothing. Mark it read-only in that case so it reads
  // as inactive until a date/range exists.
  const hasTarget =
    selection.shape === "span"
      ? selection.ranges.length > 0
      : selection.dates.length > 0;
  const readOnly = config.readOnly || !hasTarget;

  // Physical drum walls for a same-day range: the from-wheel cannot pass the
  // to-time and vice versa. Mirrors the strategy's `time-out-of-order` check
  // so the drum hits a wall instead of snapping back after a rejection.
  let boundMin: CalendarTime | undefined;
  let boundMax: CalendarTime | undefined;
  if (isBound && selection.shape === "span" && selection.ranges.length > 0) {
    const first = selection.ranges[0].start;
    const last = selection.ranges[selection.ranges.length - 1].end;
    const sameDay =
      first.year === last.year &&
      first.month === last.month &&
      first.day === last.day;
    if (sameDay) {
      if (bound === "from") boundMax = selection.toTime;
      else boundMin = selection.fromTime;
    }
  }

  // Bound date header: the wall-clock date of the edited boundary.
  const boundHeaderDate =
    showBoundDate && isBound && selection.shape === "span" && hasTarget
      ? bound === "from"
        ? selection.ranges[0].start
        : selection.ranges[selection.ranges.length - 1].end
      : null;
  const headerText = boundHeaderDate
    ? new Intl.DateTimeFormat(config.locale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(
        new Date(
          boundHeaderDate.year,
          boundHeaderDate.month - 1,
          boundHeaderDate.day,
        ),
      )
    : null;

  const commit = (next: CalendarTime) => {
    setTime(next, bound);
    // Dispatch is synchronous: read back the committed time and only report
    // changes that actually landed (walls/validation may have rejected).
    const after = store.getState().selection;
    const committed =
      after.shape === "span"
        ? bound === "to"
          ? after.toTime
          : after.fromTime
        : after.dates[0]?.time;
    if (committed && timesEqual(committed, next)) onTimeSelect?.(next);
  };

  // "Now" reset. `useToday` gates SSR (null until mount); the actual time is
  // read at click so the value is current, not the mount-time snapshot.
  const canReset = showReset && today !== null && !readOnly;
  const nowWord = canReset
    ? new Intl.RelativeTimeFormat(config.locale, { numeric: "auto" }).format(
        0,
        "second",
      )
    : null;
  const handleReset = () => {
    const now = toCalendarDateTime(new Date(), config.timeZone).time;
    commit({
      hour: now.hour,
      minute: now.minute,
      second: seconds ? now.second : 0,
      ms: 0,
    });
  };

  // Re-snap the drums whenever the external value changes identity.
  const snapKey = `${value.hour}:${value.minute}:${value.second}:${bound ?? ""}`;

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-time=""
      data-area="time"
      data-readonly={readOnly || undefined}
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      {headerText && (
        <div className={styles.boundedDate} data-bound={bound}>
          {headerText}
        </div>
      )}
      <TimeTrack
        value={value}
        hour12={hour12}
        locale={config.locale}
        showSeconds={seconds}
        readOnly={readOnly}
        step={step}
        circular={!isBound}
        snapKey={snapKey}
        labels={labels}
        hoursLabel={t("hours", undefined, hoursLabel)}
        minutesLabel={t("minutes", undefined, minutesLabel)}
        secondsLabel={t("seconds", undefined, secondsLabel)}
        timePeriodLabel={t("timePeriod", undefined, timePeriodLabel)}
        timePickerLabel={t("timePicker", undefined, timePickerLabel)}
        boundMin={boundMin}
        boundMax={boundMax}
        onChange={commit}
      />
      {canReset && (
        <button
          type="button"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={t("resetTime", { time: nowWord ?? "" }, resetTimeLabel)}
        >
          {resetLabel ?? <span>{nowWord}</span>}
        </button>
      )}
    </div>
  );
}
