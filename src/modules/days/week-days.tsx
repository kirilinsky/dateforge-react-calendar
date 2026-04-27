import { useMemo } from "react";
import type { StartOfWeek } from "@/types/calendar";
import { getWeekdaysNames } from "@/utils/date-utils";
import daysStyles from "./days.module.css";
import styles from "./weekdays.module.css";

interface WeekDaysProps {
  locale: string;
  startOfWeek: StartOfWeek;
  highlightWeekends: boolean;
  weekNumbers: boolean;
  hideWeekdays: boolean;
}

const WeekDays = ({
  locale,
  startOfWeek,
  highlightWeekends,
  weekNumbers,
  hideWeekdays,
}: WeekDaysProps) => {
  const wDays = useMemo(
    () => getWeekdaysNames(locale, startOfWeek),
    [locale, startOfWeek],
  );

  if (hideWeekdays) return null;

  return (
    <div role="row" className={daysStyles.weekRow}>
      {weekNumbers && <div aria-hidden />}
      {wDays.map((day, i) => {
        const actualDay = (startOfWeek + i) % 7;
        const isWeekend =
          highlightWeekends && (actualDay === 0 || actualDay === 6);

        return (
          <div
            key={day}
            className={`${styles.header}${isWeekend ? ` ${styles.weekendLight}` : ""}`.trim()}
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
