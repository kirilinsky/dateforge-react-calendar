import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { useItemWidth } from "@/hooks/use-item-width";
import { useTrack } from "@/hooks/use-track";
import { Check, Clear } from "@/Icons";
import {
  clampBoundDate,
  computeBoundLimits,
} from "@/utils/clamp-bound-date";
import { isSameDay } from "@/utils/date-core";
import styles from "./days-track.module.css";

const HALF = 5;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

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

  const refDate_year = refDate.getFullYear();
  const refDate_month = refDate.getMonth();
  const year = refDate_year;
  const month = refDate_month;
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
  const minIndex = minCandidates.length ? Math.max(...minCandidates) : undefined;
  const maxIndex = maxCandidates.length ? Math.min(...maxCandidates) : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = useItemWidth(containerRef, 44);

  const {
    ref,
    position,
    scrollTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useTrack({
    count: days,
    initialIndex: selectedDay,
    pixelsPerItem: itemWidth,
    circular: true,
    minIndex,
    maxIndex,
    ref: containerRef,
    onChange: (index) => {
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
    },
  });

  const shortMonth = useMemo(
    () =>
      showMonthLabel
        ? new Intl.DateTimeFormat(locale, { month: "short" }).format(
            new Date(year, month, 1),
          )
        : null,
    [showMonthLabel, locale, year, month],
  );

  const currentIdx = ((Math.round(position) % days) + days) % days;
  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? days - 1;
  const fullDateLabel = useMemo(() => {
    if (
      !Number.isFinite(year) ||
      !Number.isFinite(month) ||
      !Number.isFinite(currentIdx)
    )
      return "";
    const d = new Date(year, month, currentIdx + 1);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  }, [locale, year, month, currentIdx]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -1;
    else if (e.key === "PageDown") delta = 7;
    else if (e.key === "PageUp") delta = -7;
    else if (e.key === "Home") {
      e.preventDefault();
      scrollTo(minIdx);
      return;
    } else if (e.key === "End") {
      e.preventDefault();
      scrollTo(maxIdx);
      return;
    } else return;
    e.preventDefault();
    scrollTo(Math.round(position) + delta);
  };

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset =
    containerWidth / 2 - (HALF + frac) * itemWidth - itemWidth / 2;

  const previewDate = useMemo(() => {
    const day = ((Math.round(position) % days) + days) % days;
    const d = new Date(refDate);
    d.setFullYear(year);
    d.setMonth(month);
    d.setDate(day + 1);
    return d;
  }, [position, days, refDate, year, month]);

  const matchesExisting =
    isMulti && selectedDates.some((d) => isSameDay(d, previewDate));

  const handleConfirm = () => {
    if (readOnly) return;
    onChangeDate(previewDate);
  };

  return (
    <div
      data-area="days-track"
      ref={ref}
      className={styles.container}
      role="spinbutton"
      tabIndex={0}
      aria-label="Day"
      aria-valuenow={currentIdx + 1}
      aria-valuemin={minIdx + 1}
      aria-valuemax={maxIdx + 1}
      aria-valuetext={fullDateLabel}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={useGridSlot(col)}
    >
      <div className={styles.highlight} aria-hidden />
      {isMulti && (
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
      )}
      <div
        className={styles.strip}
        style={{ transform: `translateX(${stripOffset}px)` }}
      >
        {OFFSETS.map((o) => {
          const raw = Math.round(position) + o;
          const idx = ((raw % days) + days) % days;
          const dist = Math.abs(raw - position);
          const isActive = dist < 0.5;
          const opacity = Math.max(0.2, 1 - dist * 0.18);
          const scale = Math.max(0.6, 1 - dist * 0.08);

          return (
            <div
              key={o}
              data-item
              className={`${styles.item} ${isActive ? styles.active : ""}`}
              style={{ opacity, transform: `scale(${scale})` }}
              aria-hidden={!isActive}
              onClick={
                !isActive ? () => scrollTo(Math.round(position) + o) : undefined
              }
            >
              {isActive && shortMonth ? (
                <span className={styles.activeLabel}>
                  <span>{idx + 1}</span>
                  <span className={styles.monthLabel}>{shortMonth}</span>
                </span>
              ) : (
                idx + 1
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
