import React from "react";
import styles from "./selected-dates.module.css";
import shared from "@/global/global.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionValue,
  useSelectionActions,
} from "@/context/selection-context";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { alignToJustify, AlignValue } from "@/utils/layout-utils";
import { isSameDay } from "@/utils/date-core";

const getRangeSep = (
  fmt: Intl.DateTimeFormat,
  start: Date,
  end: Date,
): string => {
  try {
    const parts = fmt.formatRangeToParts(start, end);
    const sources = parts.map((p) => (p as any).source as string);
    const afterStart = sources.lastIndexOf("startRange") + 1;
    const beforeEnd = sources.indexOf("endRange");
    if (afterStart > 0 && beforeEnd > afterStart) {
      return parts
        .slice(afterStart, beforeEnd)
        .map((p) => p.value)
        .join("");
    }
    return " – ";
  } catch {
    return " – ";
  }
};


export interface CalendarSelectedDatesProps {
  allowClear?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: AlignValue;
  showTime?: boolean;
  col?: number | string;
}

export const CalendarSelectedDates: React.FC<CalendarSelectedDatesProps> = ({
  allowClear = true,
  allowNavigate = true,
  animated = true,
  align = "left",
  showTime = false,
  col,
}) => {
  const { locale, range, hour12, timeZone, readOnly } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate } = useSelectionActions();

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(showTime && { hour: "numeric", minute: "2-digit", hour12 }),
    ...(timeZone && { timeZone }),
  });

  const hasContent = range ? !!rangeStart : selectedDates.length > 0;

  if (!animated && !hasContent) return null;

  const isCurrentMonth = (d: Date) =>
    d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();

  const chipClass = (d: Date) =>
    [
      styles.chip,
      shared.interactive,
      shared.hoverable,
      isCurrentMonth(d) && allowNavigate
        ? shared.activeItem
        : styles.inactiveChip,
    ]
      .filter(Boolean)
      .join(" ");

  const clearBtn = allowClear ? (
    <button
      type="button"
      aria-label="Clear"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hoverable}`}
      onClick={() => onChangeDate(null)}
      disabled={readOnly}
    >
      ×
    </button>
  ) : null;

  const chipsContent = range ? (
    rangeStart ? (
      <>
        <button
          type="button"
          onClick={() => allowNavigate && navigateTo(rangeStart)}
          className={chipClass(rangeStart)}
        >
          {fmt.format(rangeStart)}
        </button>
        <span className={styles.rangeSep}>
          {rangeEnd ? getRangeSep(fmt, rangeStart, rangeEnd) : "…"}
        </span>
        {rangeEnd && (
          <button
            type="button"
            onClick={() => allowNavigate && navigateTo(rangeEnd)}
            className={chipClass(rangeEnd)}
          >
            {fmt.format(rangeEnd)}
          </button>
        )}
      </>
    ) : null
  ) : (
    <>
      {selectedDates.map((d, i) => {
        const isActive = isSameDay(d, date);
        return (
          <button
            key={i}
            type="button"
            data-active={isActive || undefined}
            onClick={() => allowNavigate && navigateTo(d)}
            className={[
              styles.chip,
              shared.interactive,
              shared.hoverable,
              isActive ? shared.activeItem : styles.inactiveChip,
              isActive ? styles.activeChip : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {fmt.format(d)}
          </button>
        );
      })}
    </>
  );

  return (
    <div
      className={[
        styles.selectedContainer,
        animated ? styles.animated : "",
        animated && hasContent ? styles.visible : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-area="selected-dates"
      style={useGridSlot(col)}
    >
      <div className={styles.inner}>
        <div
          className={styles.chipsGroup}
          style={{ justifyContent: alignToJustify[align] }}
        >
          {chipsContent}
        </div>
        {clearBtn}
      </div>
    </div>
  );
};
