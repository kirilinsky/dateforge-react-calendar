import React from "react";
import styles from "./selected-dates.module.css";
import shared from "@/global/global.module.css";
import { useConfig, useNavigation, useSelection } from "react-calendar-datetime";

const getRangeSep = (fmt: Intl.DateTimeFormat, start: Date, end: Date): string => {
  try {
    const parts = fmt.formatRangeToParts(start, end);
    const sources = parts.map((p) => (p as any).source as string);
    const afterStart = sources.lastIndexOf("startRange") + 1;
    const beforeEnd = sources.indexOf("endRange");
    if (afterStart > 0 && beforeEnd > afterStart) {
      return parts.slice(afterStart, beforeEnd).map((p) => p.value).join("");
    }
    return " – ";
  } catch {
    return " – ";
  }
};

type AlignValue = "left" | "center" | "right";
const alignToJustify: Record<AlignValue, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

interface CalendarSelectedDatesProps {
  allowClean?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: AlignValue;
  col?: number | string;
}

export const CalendarSelectedDates: React.FC<CalendarSelectedDatesProps> = ({
  allowClean = false,
  allowNavigate = false,
  animated = false,
  align = "left",
  col,
}) => {
  const { locale, range } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd, onChangeDate } = useSelection();

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
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
      isCurrentMonth(d) && allowNavigate ? shared.activeItem : styles.inactiveChip,
    ]
      .filter(Boolean)
      .join(" ");

  const clearBtn = allowClean ? (
    <button
      type="button"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hoverable}`}
      onClick={() => onChangeDate(null)}
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
        <span className={styles.rangeSep}>{rangeEnd ? getRangeSep(fmt, rangeStart, rangeEnd) : "…"}</span>
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
        const isActive = isCurrentMonth(d) && d.getDate() === date.getDate();
        return (
          <button
            key={i}
            type="button"
            onClick={() => allowNavigate && navigateTo(d)}
            className={[
              styles.chip,
              shared.interactive,
              shared.hoverable,
              isActive ? shared.activeItem : styles.inactiveChip,
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
      style={col !== undefined ? { gridColumn: typeof col === "number" ? `span ${col}` : col } : undefined}
    >
      <div className={styles.inner}>
        <div className={styles.chipsGroup} style={{ justifyContent: alignToJustify[align] }}>
          {chipsContent}
        </div>
        {clearBtn}
      </div>
    </div>
  );
};
