import type React from "react";
import { useRef } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { useItemWidth } from "@/hooks/use-item-width";
import { useTrack } from "@/hooks/use-track";
import {
  clampBoundDate,
  computeBoundLimits,
} from "@/utils/clamp-bound-date";
import styles from "./years-track.module.css";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const YEARS = Array.from(
  { length: MAX_YEAR - MIN_YEAR + 1 },
  (_, i) => MIN_YEAR + i,
);
const HALF = 6;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

export interface CalendarYearsTrackProps {
  bound?: "from" | "to";
  col?: number | string;
}

export const CalendarYearsTrack: React.FC<CalendarYearsTrackProps> = ({
  bound,
  col,
}) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate, range, readOnly } = useConfig();
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
    Math.min(YEARS.length - 1, refDate.getFullYear() - MIN_YEAR),
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
    ? Math.max(0, minDate.getFullYear() - MIN_YEAR)
    : undefined;
  const maxFromAbs = maxDate
    ? Math.min(YEARS.length - 1, maxDate.getFullYear() - MIN_YEAR)
    : undefined;
  const minFromBound = Number.isFinite(boundLimits.yearMin)
    ? Math.max(0, boundLimits.yearMin - MIN_YEAR)
    : undefined;
  const maxFromBound = Number.isFinite(boundLimits.yearMax)
    ? Math.min(YEARS.length - 1, boundLimits.yearMax - MIN_YEAR)
    : undefined;

  const minCandidates = [minFromAbs, minFromBound].filter(
    (v): v is number => v !== undefined,
  );
  const maxCandidates = [maxFromAbs, maxFromBound].filter(
    (v): v is number => v !== undefined,
  );
  const minIndex = minCandidates.length ? Math.max(...minCandidates) : undefined;
  const maxIndex = maxCandidates.length ? Math.min(...maxCandidates) : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = useItemWidth(containerRef, 52);

  const {
    ref,
    position,
    scrollTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useTrack({
    count: YEARS.length,
    initialIndex: currentIndex,
    pixelsPerItem: itemWidth,
    minIndex,
    maxIndex,
    ref: containerRef,
    onChange: (index) => {
      const next = new Date(refDate);
      next.setFullYear(YEARS[index]);
      if (isBound) {
        const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
        setLocalView(clamped);
        if (!readOnly) onRangeBoundSet(bound!, clamped);
      } else {
        navigateTo(next);
      }
    },
  });

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset =
    containerWidth / 2 - (HALF + frac) * itemWidth - itemWidth / 2;

  const currentIdx = Math.max(
    0,
    Math.min(YEARS.length - 1, Math.round(position)),
  );
  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? YEARS.length - 1;
  const currentYear = YEARS[currentIdx];

  const onKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -1;
    else if (e.key === "PageDown") delta = 10;
    else if (e.key === "PageUp") delta = -10;
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
    scrollTo(currentIdx + delta);
  };

  return (
    <div
      data-area="years-track"
      ref={ref}
      className={styles.container}
      role="spinbutton"
      tabIndex={0}
      aria-label="Year"
      aria-valuenow={currentYear}
      aria-valuemin={YEARS[minIdx]}
      aria-valuemax={YEARS[maxIdx]}
      aria-valuetext={String(currentYear)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={useGridSlot(col)}
    >
      <div className={styles.highlight} aria-hidden />
      <div
        className={styles.strip}
        style={{ transform: `translateX(${stripOffset}px)` }}
      >
        {OFFSETS.map((o) => {
          const idx = Math.max(
            0,
            Math.min(YEARS.length - 1, Math.round(position) + o),
          );
          const dist = Math.abs(Math.round(position) + o - position);
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
              {YEARS[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
