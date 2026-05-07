import type React from "react";
import { useEffect, useMemo } from "react";
import { VirtualTrack } from "@/components/virtual-track/virtual-track";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import { Check, Clear } from "@/Icons";
import { clampBoundDate, computeBoundLimits } from "@/utils/clamp-bound-date";
import { isSameDay } from "@/utils/date-core";
import styles from "./days-track.module.css";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export interface CalendarDaysTrackProps {
  showMonthLabel?: boolean;
  bound?: "from" | "to";
  col?: number | string;
}

export const CalendarDaysTrack: React.FC<CalendarDaysTrackProps> = ({
  showMonthLabel = false,
  bound,
  col,
}) => {
  const { viewDate, navigateTo } = useNavigation();
  const { selectedDate, selectedDates, rangeStart, rangeEnd } =
    useSelectionValue();
  const { onChangeDate, onRangeBoundSet } = useSelectionActions();
  const { minDate, maxDate, locale, range, multiselect, readOnly } =
    useConfig();
  const { setDaysTrackActive } = useUI();
  const isMulti = !!multiselect;

  useEffect(() => {
    setDaysTrackActive(true);
    return () => setDaysTrackActive(false);
  }, [setDaysTrackActive]);

  const { isBound, boundDate, setLocalView, refDate } = useBoundDateView({
    bound,
    range,
    rangeStart,
    rangeEnd,
    viewDate,
  });

  const year = refDate.getFullYear();
  const month = refDate.getMonth();
  const days = useMemo(() => daysInMonth(year, month), [year, month]);

  const selectionDate = isBound
    ? boundDate
    : isMulti
      ? (selectedDates.find((d) => isSameDay(d, viewDate)) ?? null)
      : selectedDate;

  const selectedDay =
    selectionDate &&
    selectionDate.getFullYear() === year &&
    selectionDate.getMonth() === month
      ? selectionDate.getDate() - 1
      : refDate.getDate() - 1;

  const boundLimits = computeBoundLimits({
    bound,
    rangeStart,
    rangeEnd,
    refYear: year,
    refMonth: month,
    refDay: refDate.getDate(),
    daysInRefMonth: days,
  });

  const minFromAbs =
    minDate && minDate.getFullYear() === year && minDate.getMonth() === month
      ? minDate.getDate() - 1
      : undefined;
  const maxFromAbs =
    maxDate && maxDate.getFullYear() === year && maxDate.getMonth() === month
      ? maxDate.getDate() - 1
      : undefined;

  const minCandidates = [minFromAbs, boundLimits.dayMin].filter(
    (v): v is number => Number.isFinite(v as number),
  );
  const maxCandidates = [maxFromAbs, boundLimits.dayMax].filter(
    (v): v is number => Number.isFinite(v as number),
  );
  const minIndex = minCandidates.length
    ? Math.max(...minCandidates)
    : undefined;
  const maxIndex = maxCandidates.length
    ? Math.min(...maxCandidates)
    : undefined;

  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? days - 1;

  const handleChange = (index: number) => {
    const next = new Date(refDate);
    next.setFullYear(year);
    next.setMonth(month);
    next.setDate(index + 1);
    if (isMulti) {
      setLocalView(next);
    } else if (isBound) {
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
    } else {
      navigateTo(next);
      if (!range && !readOnly) onChangeDate(next);
    }
  };

  const shortMonth = useMemo(
    () =>
      showMonthLabel
        ? new Intl.DateTimeFormat(locale, { month: "short" }).format(
            new Date(year, month, 1),
          )
        : null,
    [showMonthLabel, locale, year, month],
  );

  const fullDateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale],
  );

  return (
    <VirtualTrack
      dataArea="days-track"
      count={days}
      initialIndex={selectedDay}
      circular
      minIndex={minIndex}
      maxIndex={maxIndex}
      half={5}
      initialItemWidth={44}
      pageStep={7}
      ariaLabel="Day"
      getAriaValueNow={(i) => i + 1}
      getAriaValueMin={() => minIdx + 1}
      getAriaValueMax={() => maxIdx + 1}
      getAriaValueText={(i) => {
        if (
          !Number.isFinite(year) ||
          !Number.isFinite(month) ||
          !Number.isFinite(i)
        )
          return "";
        const d = new Date(year, month, i + 1);
        return Number.isNaN(d.getTime()) ? "" : fullDateFmt.format(d);
      }}
      col={col}
      onChange={handleChange}
      renderItem={({ idx, isActive }) =>
        isActive && shortMonth ? (
          <span className={styles.activeLabel}>
            <span>{idx + 1}</span>
            <span className={styles.monthLabel}>{shortMonth}</span>
          </span>
        ) : (
          idx + 1
        )
      }
      renderOverlay={({ activeIndex }) => {
        if (!isMulti) return null;
        const previewDate = new Date(year, month, activeIndex + 1);
        const matchesExisting = selectedDates.some((d) =>
          isSameDay(d, previewDate),
        );
        const handleConfirm = () => {
          if (readOnly) return;
          onChangeDate(previewDate);
        };
        return (
          <button
            type="button"
            className={`${styles.confirmBtn} ${shared.interactive} ${shared.hovered} ${matchesExisting ? styles.removeBtn : ""}`}
            aria-label={
              matchesExisting ? "Remove selected date" : "Save selected date"
            }
            onClick={handleConfirm}
            onPointerDown={(e) => e.stopPropagation()}
            disabled={readOnly}
          >
            {matchesExisting ? <Clear /> : <Check />}
          </button>
        );
      }}
    />
  );
};
