import type { ReactNode } from "react";
import { boundDateOf } from "../../core-v3/bound";
import { calendarDate, daysInMonth } from "../../core-v3/calendar-date";
import { toCalendarDateTime } from "../../core-v3/timezone-boundary";
import { useToday } from "../../hooks/use-today";
import { useLabels } from "../../react-v3/labels-context";
import { usePickerDraft } from "../../react-v3/picker-draft";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import { StepDrum } from "../time/step-drum";
import styles from "./months-wheel.module.css";

const capitalize = (s: string) =>
  s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s;

const getLocalizedMonthLabel = (locale: string): string => {
  try {
    const dn = new Intl.DisplayNames(locale, { type: "dateTimeField" });
    const name = dn.of("month");
    if (name) return capitalize(name);
  } catch {
    // fall through
  }
  return "Month";
};

export type CalendarMonthsWheelProps = {
  /** Render short month names ("Jan") in the drum. aria stays long. */
  shortMonths?: boolean;
  /** Small localized label above the drum. */
  showLabel?: boolean;
  /**
   * Render a reset button below the drum. Click navigates the view back to
   * the current month (keeping the viewed year's day anchor). Default `false`.
   */
  showReset?: boolean;
  /** Override the reset button content. Default: localized current month. */
  resetLabel?: ReactNode;
  /** aria-label template for the reset button (registry key `resetMonth`). */
  resetMonthLabel?: string;
  /** aria-label for the months drum. Default: localized "Month" noun. */
  monthsLabel?: string;
  /** aria-label for the group wrapper (registry key `monthPicker`). */
  monthPickerLabel?: string;
  /**
   * Span modes: edit a range bound (`"from"`/`"to"`) instead of the view. Reads
   * that bound's month and commits via `setBoundDate` (the core owns ordering /
   * clamping). No effect on point selections or before a range exists.
   */
  bound?: "from" | "to";
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
  /** Observational: fires after the drum navigates. */
  onMonthSelect?: (year: number, month: number) => void;
};

export function CalendarMonthsWheel({
  shortMonths = false,
  showLabel = false,
  showReset = false,
  resetLabel,
  resetMonthLabel,
  monthsLabel,
  monthPickerLabel,
  bound,
  theme,
  scheme,
  col,
  className,
  onMonthSelect,
}: CalendarMonthsWheelProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const today = useToday();
  // Inside a confirm-staged trigger popup the wheel mutates the draft, not the
  // store: the view only moves when the trigger's Confirm applies the draft.
  const draft = usePickerDraft();

  const storeView = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);
  // Bound mode shows/edits the range bound; else the view. Draft staging wins.
  const boundDate = boundDateOf(selection, bound);
  const viewDate = draft ? draft.date : (boundDate ?? storeView);

  const locale = config.locale ?? "en";
  const localizedLabel = getLocalizedMonthLabel(locale);
  const drumLabel = monthsLabel ?? localizedLabel;

  // Labels are formatted via JS Date at the boundary (display only).
  const longFmt = new Intl.DateTimeFormat(locale, { month: "long" });
  const displayFmt = shortMonths
    ? new Intl.DateTimeFormat(locale, { month: "short" })
    : longFmt;
  const getValueText = (v: number) => longFmt.format(new Date(2024, v, 1));
  const format = (v: number) => displayFmt.format(new Date(2024, v, 1));

  // Drum value is 0-based month; viewDate.month is 1-based.
  const value = viewDate.month - 1;

  const handleDrumChange = (nextMonth: number): boolean | undefined => {
    const m = nextMonth + 1;
    if (draft) {
      draft.setDate(calendarDate(viewDate.year, m, 1));
    } else if (boundDate) {
      // Edit the bound: keep its day (clamped to the new month); core orders.
      const day = Math.min(boundDate.day, daysInMonth(viewDate.year, m));
      setBoundDate(calendarDate(viewDate.year, m, day), bound!);
      onMonthSelect?.(viewDate.year, m);
    } else {
      navigateTo(calendarDate(viewDate.year, m, 1));
      onMonthSelect?.(viewDate.year, m);
    }
    return undefined;
  };

  // "Now" reset: back to the current month within the viewed year. `useToday`
  // gates SSR (null until mount).
  const todayMonth =
    today !== null
      ? toCalendarDateTime(today, config.timeZone).date.month
      : null;
  const canReset = showReset && todayMonth !== null;
  const currentMonthName =
    todayMonth !== null
      ? longFmt.format(new Date(2024, todayMonth - 1, 1))
      : "";
  const handleReset = () => {
    if (todayMonth === null) return;
    const next = calendarDate(viewDate.year, todayMonth, 1);
    if (draft) {
      draft.setDate(next);
    } else {
      navigateTo(next);
      onMonthSelect?.(viewDate.year, todayMonth);
    }
  };

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-months-wheel=""
      data-area="months-wheel"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        className={styles.root}
        role="group"
        aria-label={t("monthPicker", undefined, monthPickerLabel)}
      >
        <div className={styles.drumCol}>
          {showLabel && (
            <span className={styles.drumLabel} aria-hidden>
              {localizedLabel}
            </span>
          )}
          <StepDrum
            value={value}
            max={12}
            step={1}
            circular
            label={drumLabel}
            getValueText={getValueText}
            format={format}
            onChange={handleDrumChange}
          />
        </div>
      </div>
      {canReset && (
        <UIButton
          size="sm"
          className={styles.resetBtn}
          onClick={handleReset}
          aria-label={t(
            "resetMonth",
            { month: currentMonthName },
            resetMonthLabel,
          )}
        >
          {resetLabel ?? <span>{currentMonthName}</span>}
        </UIButton>
      )}
    </div>
  );
}
