import React from "react";
import styles from "./selected-dates.module.css";
import shared from "@/global/global.module.css";
import { useCalendarContext } from "../provider/provider";

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

export const SelectedDatesComponent: React.FC = () => {
  const {
    selectedDates,
    date,
    navigateTo,
    locale,
    range,
    rangeStart,
    rangeEnd,
    onChangeDate,
    allowCleanSelected = true,
    allowNavigateSelected = true,
  } = useCalendarContext();

  const fmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const isCurrentMonth = (d: Date) =>
    d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();

  const chipClass = (d: Date) =>
    [
      styles.chip,
      shared.interactive,
      shared.hoverable,
      isCurrentMonth(d) && allowNavigateSelected ? shared.activeItem : styles.inactiveChip,
    ]
      .filter(Boolean)
      .join(" ");

  const clearBtn = (
    <button
      type="button"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hoverable}`}
      onClick={() => onChangeDate(null)}
      style={
        allowCleanSelected
          ? undefined
          : { visibility: "hidden", pointerEvents: "none" }
      }
      tabIndex={allowCleanSelected ? undefined : -1}
      aria-hidden={!allowCleanSelected}
    >
      ×
    </button>
  );

  if (range) {
    if (!rangeStart) return null;

    const sep = rangeEnd ? getRangeSep(fmt, rangeStart, rangeEnd) : " – ";

    return (
      <div className={styles.selectedContainer} style={{ gridArea: "SD" }}>
        <button
          type="button"
          onClick={() => allowNavigateSelected && navigateTo(rangeStart)}
          className={chipClass(rangeStart)}
        >
          {fmt.format(rangeStart)}
        </button>
        <span className={styles.rangeSep}>{rangeEnd ? sep : "…"}</span>
        {rangeEnd && (
          <button
            type="button"
            onClick={() => allowNavigateSelected && navigateTo(rangeEnd)}
            className={chipClass(rangeEnd)}
          >
            {fmt.format(rangeEnd)}
          </button>
        )}
        {clearBtn}
      </div>
    );
  }

  if (!selectedDates.length) return null;

  return (
    <div className={styles.selectedContainer} style={{ gridArea: "SD" }}>
      {selectedDates.map((d, i) => {
        const isActive = isCurrentMonth(d) && d.getDate() === date.getDate();
        return (
          <button
            key={i}
            type="button"
            onClick={() => allowNavigateSelected && navigateTo(d)}
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
      {clearBtn}
    </div>
  );
};
