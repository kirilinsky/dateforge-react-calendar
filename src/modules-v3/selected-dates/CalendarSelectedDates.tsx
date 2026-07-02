import { useMemo, useState } from "react";
import type { CalendarDate } from "../../core-v3/calendar-date";
import { dateKey } from "../../core-v3/calendar-date";

import { fromCalendarDateTime } from "../../core-v3/timezone-boundary";
import { ClearIcon } from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./selected-dates.module.css";

export type CalendarSelectedDatesProps = {
  allowClear?: boolean;
  allowClearPerChip?: boolean;
  allowNavigate?: boolean;
  showTime?: boolean;
  /**
   * Collapse the chip list after N chips; the rest hide behind a "+{count}"
   * chip that expands on click (v2 parity). Omit for no collapsing.
   */
  maxVisibleChips?: number;
  /** Visible text of the overflow chip; `{count}` interpolates. Default `"+{count}"`. */
  overflowLabel?: string;
  /** Chip row alignment. Default `"left"`. */
  align?: "left" | "center" | "right";
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
};

function formatDate(
  d: Date,
  locale?: string,
  timeZone?: string,
  showTime?: boolean,
): string {
  try {
    const opts: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "short",
      year: "numeric",
      ...(timeZone && { timeZone }),
    };
    const datePart = new Intl.DateTimeFormat(locale, opts).format(d);
    if (!showTime) return datePart;
    const timePart = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone && { timeZone }),
    }).format(d);
    return `${datePart} ${timePart}`;
  } catch {
    return d.toLocaleDateString(locale);
  }
}

type ChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
};

function Chip({
  label,
  active,
  onClick,
  onRemove,
  removeLabel,
  disabled,
}: ChipProps) {
  if (onRemove) {
    return (
      <span className={styles.chipGroup} data-active={active ? "" : undefined}>
        <button
          type="button"
          className={styles.chipMain}
          onClick={onClick}
          disabled={disabled}
        >
          {label}
        </button>
        <button
          type="button"
          className={styles.chipRemove}
          aria-label={removeLabel}
          onClick={onRemove}
          disabled={disabled}
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={styles.chip}
      data-active={active ? "" : undefined}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export function CalendarSelectedDates({
  allowClear = false,
  allowClearPerChip = false,
  allowNavigate = true,
  showTime = false,
  maxVisibleChips,
  overflowLabel = "+{count}",
  align = "left",
  col,
  className,
  theme,
  scheme,
}: CalendarSelectedDatesProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, clear, removeDate, removeRange } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  const fmt = useMemo(
    () => (d: Date) => formatDate(d, config.locale, config.timeZone, showTime),
    [config.locale, config.timeZone, showTime],
  );

  const isCurrentMonth = (d: CalendarDate) =>
    d.year === viewDate.year && d.month === viewDate.month;

  const alignStyle = {
    justifyContent:
      align === "right"
        ? "flex-end"
        : align === "center"
          ? "center"
          : "flex-start",
  } as const;
  const gridSlot = { ...getGridSlotStyle(col), ...alignStyle };

  // Chip overflow: cap the visible chips, park the rest behind a "+N" expander.
  const [expanded, setExpanded] = useState(false);
  const cap =
    maxVisibleChips === undefined || !Number.isFinite(maxVisibleChips)
      ? Number.POSITIVE_INFINITY
      : Math.max(0, Math.floor(maxVisibleChips));

  if (selection.shape === "point") {
    if (selection.dates.length === 0) return null;

    return (
      <div
        data-dateforge-selected-dates=""
        data-area="selected-dates"
        data-theme={theme}
        data-scheme={scheme}
        className={[styles.container, className].filter(Boolean).join(" ")}
        style={gridSlot}
      >
        {(expanded ? selection.dates : selection.dates.slice(0, cap)).map(
          (dt) => {
            const r = fromCalendarDateTime(dt, config.timeZone);
            if (!r.ok) return null;
            const active = isCurrentMonth(dt.date);
            return (
              <Chip
                key={dateKey(dt.date)}
                label={fmt(r.date)}
                active={active}
                disabled={config.readOnly}
                onClick={allowNavigate ? () => navigateTo(dt.date) : undefined}
                onRemove={
                  allowClearPerChip ? () => removeDate(dt.date) : undefined
                }
                removeLabel={t("removeSelectedDate")}
              />
            );
          },
        )}
        {!expanded && selection.dates.length > cap && (
          <UIButton
            size="sm"
            data-overflow-chip=""
            aria-label={t("showMoreSelectedDates", {
              count: selection.dates.length - cap,
            })}
            onClick={() => setExpanded(true)}
          >
            {overflowLabel.replaceAll(
              "{count}",
              String(selection.dates.length - cap),
            )}
          </UIButton>
        )}
        {allowClear && (
          <UIButton
            variant="ghost"
            size="sm"
            className={styles.clearBtn}
            aria-label={t("clear")}
            onClick={() => clear()}
            disabled={config.readOnly}
          >
            <ClearIcon />
            {t("clear")}
          </UIButton>
        )}
      </div>
    );
  }

  // Span selection
  const { ranges } = selection;
  if (ranges.length === 0) return null;

  const fromTime = selection.fromTime;
  const toTime = selection.toTime;

  return (
    <div
      data-dateforge-selected-dates=""
      data-area="selected-dates"
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      {ranges.map((range, index) => {
        const { start, end } = range;
        const startDt = {
          date: start,
          time: fromTime ?? { hour: 0, minute: 0, second: 0, ms: 0 },
        };
        const endDt = {
          date: end,
          time: toTime ?? { hour: 0, minute: 0, second: 0, ms: 0 },
        };
        const startR = fromCalendarDateTime(startDt, config.timeZone);
        const endR = fromCalendarDateTime(endDt, config.timeZone);
        if (!startR.ok || !endR.ok) return null;
        return (
          <span
            key={`${dateKey(start)}-${dateKey(end)}`}
            style={{ display: "contents" }}
          >
            <Chip
              label={fmt(startR.date)}
              active={isCurrentMonth(start)}
              disabled={config.readOnly}
              onClick={allowNavigate ? () => navigateTo(start) : undefined}
              onRemove={
                allowClearPerChip && ranges.length === 1
                  ? () => removeRange(index)
                  : undefined
              }
              removeLabel={t("removeRangeStart")}
            />
            <span className={styles.sep} aria-hidden>
              –
            </span>
            <Chip
              label={fmt(endR.date)}
              active={isCurrentMonth(end)}
              disabled={config.readOnly}
              onClick={allowNavigate ? () => navigateTo(end) : undefined}
              onRemove={
                allowClearPerChip ? () => removeRange(index) : undefined
              }
              removeLabel={t("removeRangeEnd")}
            />
          </span>
        );
      })}
      {allowClear && (
        <UIButton
          variant="ghost"
          size="sm"
          className={styles.clearBtn}
          aria-label={t("clear")}
          onClick={() => clear()}
          disabled={config.readOnly}
        >
          <ClearIcon />
          {t("clear")}
        </UIButton>
      )}
    </div>
  );
}
