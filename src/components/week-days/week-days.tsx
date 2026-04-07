import { getWeekdaysNames } from "@/utils/date-utils";
import { useMemo } from "react";
import { useCalendarContext } from "../provider/provider";
import styles from "./weekdays.module.css";

const WeekDays = () => {
  const { locale, highlightWeekends, dark, startOfWeek, showWeekNumber, hideWeekdays } =
    useCalendarContext();

  const wDays = useMemo(
    () => getWeekdaysNames(locale, startOfWeek),
    [locale, startOfWeek],
  );

  if (hideWeekdays) return null;

  return (
    <div role="row" style={{ display: "contents" }}>
      {showWeekNumber && <div aria-hidden />}
      {wDays.map((day, i) => {
        const actualDay = (startOfWeek + i) % 7;
        const isWeekend =
          highlightWeekends && (actualDay === 0 || actualDay === 6);
        const weekendClass = isWeekend
          ? dark
            ? styles.weekendDark
            : styles.weekendLight
          : "";

        return (
          <div
            key={day}
            className={`${styles.header} ${weekendClass}`.trim()}
            role="columnheader"
            aria-label={day}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
};

export default WeekDays;
