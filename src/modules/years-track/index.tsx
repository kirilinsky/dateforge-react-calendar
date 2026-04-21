import React from "react";
import styles from "./years-track.module.css";
import shared from "@/global/global.module.css";
import { useNavigation } from "react-calendar-datetime";

interface CalendarYearsTrackProps {
  range?: number;
  col?: number | string;
}

export const CalendarYearsTrack: React.FC<CalendarYearsTrackProps> = ({
  range = 5,
  col,
}) => {
  const { viewDate, navigateTo } = useNavigation();
  const currentYear = viewDate.getFullYear();

  const years = Array.from({ length: range * 2 + 1 }, (_, i) => {
    return currentYear - range + i;
  });

  const handleClick = (year: number) => {
    const next = new Date(viewDate);
    next.setFullYear(year);
    navigateTo(next);
  };

  return (
    <div className={styles.yearsTrackContainer} data-area="years-track" style={col !== undefined ? { gridColumn: col } : undefined}>
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => handleClick(year)}
          className={[
            styles.chip,
            shared.interactive,
            shared.hoverable,
            year === currentYear ? shared.activeItem : styles.inactiveChip,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {year}
        </button>
      ))}
    </div>
  );
};
