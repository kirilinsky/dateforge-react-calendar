import React from "react";
import styles from "./years-track.module.css";
import shared from "@/global/global.module.css";

interface CalendarYearsTrackProps {
  /** Number of years to show before and after the current year */
  range?: number;
}

export const YearsTrackComponent: React.FC<CalendarYearsTrackProps> = ({
  range = 5,
}) => {
  // TODO: wire up to navigation context, implement year selection
  const stubYears = Array.from({ length: range * 2 + 1 }, (_, i) => {
    const now = new Date().getFullYear();
    return now - range + i;
  });
  const currentYear = new Date().getFullYear();

  return (
    <div
      className={styles.yearsTrackContainer}
      data-area="years-track"
      style={{ gridArea: "YT" }}
    >
      {stubYears.map((year) => (
        <button
          key={year}
          type="button"
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

export { YearsTrackComponent as CalendarYearsTrack };
