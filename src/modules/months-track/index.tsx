import type React from "react";
import { useMemo } from "react";
import { VirtualTrack } from "@/components/virtual-track/virtual-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import { clampBoundDate, computeBoundLimits } from "@/utils/clamp-bound-date";
import { getMonthNames } from "@/utils/month-utils";
import styles from "./months-track.module.css";

export interface CalendarMonthsTrackProps {
  short?: boolean;
  showYearLabel?: boolean;
  bound?: "from" | "to";
  col?: number | string;
  /**
   * Fires after the user lands on a month via the track. Receives the
   * navigated date (or clamped bound date in range mode). Use for standalone
   * month-picker UX without `CalendarDays`.
   */
  onMonthSelect?: (date: Date) => void;
}

export const CalendarMonthsTrack: React.FC<CalendarMonthsTrackProps> = ({
  short = true,
  showYearLabel = false,
  bound,
  col,
  onMonthSelect,
}) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate, locale, range, readOnly } = useConfig();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const { isBound, setLocalView, refDate } = useBoundDateView({
    bound,
    range,
    rangeStart,
    rangeEnd,
    viewDate,
  });
  const year = refDate.getFullYear();
  const currentIndex = refDate.getMonth();
  const MONTHS = getMonthNames(locale, short);

  const daysInRefMonth = new Date(year, currentIndex + 1, 0).getDate();
  const boundLimits = computeBoundLimits({
    bound,
    rangeStart,
    rangeEnd,
    refYear: year,
    refMonth: currentIndex,
    refDay: refDate.getDate(),
    daysInRefMonth,
  });

  const minFromAbs =
    minDate && minDate.getFullYear() === year ? minDate.getMonth() : undefined;
  const maxFromAbs =
    maxDate && maxDate.getFullYear() === year ? maxDate.getMonth() : undefined;
  const minCandidates = [minFromAbs, boundLimits.monthMin].filter(
    (v): v is number => Number.isFinite(v as number),
  );
  const maxCandidates = [maxFromAbs, boundLimits.monthMax].filter(
    (v): v is number => Number.isFinite(v as number),
  );
  const minIndex = minCandidates.length
    ? Math.max(...minCandidates)
    : undefined;
  const maxIndex = maxCandidates.length
    ? Math.min(...maxCandidates)
    : undefined;

  const handleChange = (index: number) => {
    const next = new Date(refDate);
    next.setMonth(index);
    if (isBound) {
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
      onMonthSelect?.(clamped);
    } else {
      navigateTo(next);
      onMonthSelect?.(next);
    }
  };

  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? MONTHS.length - 1;

  const fmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }),
    [locale],
  );

  return (
    <VirtualTrack
      dataArea="months-track"
      className={styles.container}
      count={MONTHS.length}
      initialIndex={currentIndex}
      circular
      minIndex={minIndex}
      maxIndex={maxIndex}
      half={4}
      initialItemWidth={52}
      ariaLabel="Month"
      getAriaValueNow={(i) => i + 1}
      getAriaValueMin={() => minIdx + 1}
      getAriaValueMax={() => maxIdx + 1}
      getAriaValueText={(i) => fmt.format(new Date(year, i, 1))}
      col={col}
      onChange={handleChange}
      renderItem={({ idx, isActive }) =>
        isActive && showYearLabel ? (
          <span className={styles.activeLabel}>
            <span>{MONTHS[idx]}</span>
            <span className={styles.yearLabel}>{year}</span>
          </span>
        ) : (
          MONTHS[idx]
        )
      }
    />
  );
};
