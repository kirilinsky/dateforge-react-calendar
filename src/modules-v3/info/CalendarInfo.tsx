import type { ReactNode } from "react";
import { useMemo } from "react";
import { differenceInDays } from "../../core-v3/calendar-date";
import {
  fromCalendarDateTime,
  today as getToday,
} from "../../core-v3/timezone-boundary";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./info.module.css";

export type CalendarInfoProps = {
  allowClear?: boolean;
  showHome?: boolean;
  emptyLabel?: ReactNode;
  col?: number | string;
  className?: string;
};

function formatSingle(d: Date, locale?: string, timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
      ...(timeZone && { timeZone }),
    }).format(d);
  } catch {
    return d.toLocaleDateString(locale);
  }
}

function formatCount(n: number, locale?: string): string {
  try {
    return new Intl.RelativeTimeFormat(locale, { numeric: "always" })
      .formatToParts(n, "day")
      .find((p) => p.type === "integer")
      ? `${n}`
      : `${n}`;
  } catch {
    return `${n}`;
  }
}

export function CalendarInfo({
  allowClear = false,
  showHome = false,
  emptyLabel,
  col,
  className,
}: CalendarInfoProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { clear, navigateTo } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  const todayDate = useMemo(() => getToday(config.timeZone), [config.timeZone]);

  const isCurrentMonth =
    todayDate.year === viewDate.year && todayDate.month === viewDate.month;

  const summary = useMemo((): ReactNode => {
    if (selection.shape === "point") {
      const { dates } = selection;
      if (dates.length === 0) return null;
      if (dates.length === 1) {
        const r = fromCalendarDateTime(dates[0], config.timeZone);
        return r.ok
          ? formatSingle(r.date, config.locale, config.timeZone)
          : null;
      }
      return `${formatCount(dates.length, config.locale)} dates selected`;
    }
    const { ranges } = selection;
    if (ranges.length === 0) return null;
    if (ranges.length === 1) {
      const [range] = ranges;
      const days = differenceInDays(range.end, range.start) + 1;
      return `${days} day${days !== 1 ? "s" : ""}`;
    }
    return `${ranges.length} ranges`;
  }, [selection, config.timeZone, config.locale]);

  const hasSelection = summary !== null;
  const gridSlot = getGridSlotStyle(col);

  const showContent =
    hasSelection ||
    emptyLabel !== undefined ||
    showHome ||
    (allowClear && hasSelection);
  if (!showContent) return null;

  return (
    <div
      data-dateforge-info=""
      data-area="calendar-info"
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        className={[styles.summary, !hasSelection && styles.empty]
          .filter(Boolean)
          .join(" ")}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {hasSelection ? summary : emptyLabel}
      </div>
      {(showHome || (allowClear && hasSelection)) && (
        <div className={styles.actions}>
          {showHome && (
            <button
              type="button"
              className={styles.actionBtn}
              aria-label={t("home")}
              disabled={isCurrentMonth}
              onClick={() => navigateTo(todayDate)}
            >
              ↩
            </button>
          )}
          {allowClear && hasSelection && (
            <button
              type="button"
              className={styles.actionBtn}
              aria-label={t("clear")}
              disabled={config.readOnly}
              onClick={() => clear()}
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
}
