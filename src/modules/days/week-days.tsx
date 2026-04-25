import { getWeekdaysNames } from "@/utils/date-utils";
import { useMemo } from "react";
import { useUI } from "@/context/ui-context";
import { StartOfWeek } from "@/types/calendar";
import styles from "./weekdays.module.css";

interface WeekDaysProps {
  locale: string;
  startOfWeek: StartOfWeek;
  highlightWeekends: boolean;
  weekNumbers: boolean;
  hideWeekdays: boolean;
}

const WeekDays = ({ locale, startOfWeek, highlightWeekends, weekNumbers, hideWeekdays }: WeekDaysProps) => {
  const { dark } = useUI();

  const wDays = useMemo(
    () => getWeekdaysNames(locale, startOfWeek),
    [locale, startOfWeek],
  );

  if (hideWeekdays) return null;

  return (
    <div role="row" style={{ display: "contents" }}>
      {weekNumbers && <div aria-hidden />}
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
