import type React from "react";
import "@/styles/layers.css";
import { VirtualTrack } from "@/components/virtual-track/virtual-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import {
  DEFAULT_YEAR_TRACK_LABEL,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate, computeBoundLimits } from "@/utils/clamp-bound-date";
import { MAX_CALENDAR_YEAR, MIN_CALENDAR_YEAR } from "@/utils/year-range";
import styles from "./years-track.module.css";

const YEARS = Array.from(
  { length: MAX_CALENDAR_YEAR - MIN_CALENDAR_YEAR + 1 },
  (_, i) => MIN_CALENDAR_YEAR + i,
);

export interface CalendarYearsTrackProps {
  bound?: "from" | "to";
  col?: number | string;
  yearTrackLabel?: string;
  /**
   * Fires after the user lands on a year via the track. Receives the
   * navigated date (or clamped bound date in range mode). Use for standalone
   * year-picker UX without `CalendarDays`.
   */
  onYearSelect?: (date: Date) => void;
}

export const CalendarYearsTrack: React.FC<CalendarYearsTrackProps> = ({
  bound,
  col,
  yearTrackLabel,
  onYearSelect,
}) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate, range, readOnly, actionLabels } = useConfig();
  const resolvedYearTrackLabel = resolveActionLabel(
    yearTrackLabel,
    actionLabels.yearTrackLabel,
    DEFAULT_YEAR_TRACK_LABEL,
  );
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const { isBound, setLocalView, refDate } = useBoundDateView({
    bound,
    range,
    rangeStart,
    rangeEnd,
    viewDate,
  });
  const currentIndex = Math.max(
    0,
    Math.min(YEARS.length - 1, refDate.getFullYear() - MIN_CALENDAR_YEAR),
  );

  const refYear = refDate.getFullYear();
  const refMonth = refDate.getMonth();
  const daysInRefMonth = new Date(refYear, refMonth + 1, 0).getDate();
  const boundLimits = computeBoundLimits({
    bound,
    rangeStart,
    rangeEnd,
    refYear,
    refMonth,
    refDay: refDate.getDate(),
    daysInRefMonth,
  });

  const minFromAbs = minDate
    ? Math.max(0, minDate.getFullYear() - MIN_CALENDAR_YEAR)
    : undefined;
  const maxFromAbs = maxDate
    ? Math.min(YEARS.length - 1, maxDate.getFullYear() - MIN_CALENDAR_YEAR)
    : undefined;
  const minFromBound = Number.isFinite(boundLimits.yearMin)
    ? Math.max(0, boundLimits.yearMin - MIN_CALENDAR_YEAR)
    : undefined;
  const maxFromBound = Number.isFinite(boundLimits.yearMax)
    ? Math.min(YEARS.length - 1, boundLimits.yearMax - MIN_CALENDAR_YEAR)
    : undefined;

  const minCandidates = [minFromAbs, minFromBound].filter(
    (v): v is number => v !== undefined,
  );
  const maxCandidates = [maxFromAbs, maxFromBound].filter(
    (v): v is number => v !== undefined,
  );
  const minIndex = minCandidates.length
    ? Math.max(...minCandidates)
    : undefined;
  const maxIndex = maxCandidates.length
    ? Math.min(...maxCandidates)
    : undefined;

  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? YEARS.length - 1;

  const handleChange = (index: number) => {
    const next = new Date(refDate);
    next.setFullYear(YEARS[index]);
    if (isBound) {
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
      onYearSelect?.(clamped);
    } else {
      navigateTo(next);
      onYearSelect?.(next);
    }
  };

  return (
    <VirtualTrack
      dataArea="years-track"
      className={styles.container}
      count={YEARS.length}
      initialIndex={currentIndex}
      minIndex={minIndex}
      maxIndex={maxIndex}
      half={6}
      initialItemWidth={52}
      pageStep={10}
      ariaLabel={resolvedYearTrackLabel}
      getAriaValueNow={(i) => YEARS[i]}
      getAriaValueMin={() => YEARS[minIdx]}
      getAriaValueMax={() => YEARS[maxIdx]}
      getAriaValueText={(i) => String(YEARS[i])}
      col={col}
      onChange={handleChange}
      renderItem={({ idx }) => YEARS[idx]}
    />
  );
};
