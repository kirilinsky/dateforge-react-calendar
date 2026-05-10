import { useMemo } from "react";
import type { StartOfWeek } from "@/types/calendar";
import type { WeekdayFormat } from "@/utils/calendar-data";
import { getWeekdaysNames } from "@/utils/date-utils";
import daysStyles from "./days.module.css";
import styles from "./weekdays.module.css";

interface WeekDaysProps {
  locale: string;
  startOfWeek: StartOfWeek;
  highlightWeekends: boolean;
  weekNumbers: boolean;
  hideWeekdays: boolean;
  weekdayFormat: WeekdayFormat;
}

const WeekDays = ({
  locale,
  startOfWeek,
  highlightWeekends,
  weekNumbers,
  hideWeekdays,
  weekdayFormat,
}: WeekDaysProps) => {
  const wDays = useMemo(
    () => getWeekdaysNames(locale, startOfWeek, weekdayFormat),
    [locale, startOfWeek, weekdayFormat],
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
            key={actualDay}
            className={`${styles.header}${isWeekend ? ` ${styles.weekendLight}` : ""}`.trim()}
            role="columnheader"
            aria-label={day}
            data-weekday-format={weekdayFormat}
          >
            {day}
          </div>
        );
      })}
    </div>
  );
};

export default WeekDays;
