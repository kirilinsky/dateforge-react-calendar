import React, { useMemo, useRef } from "react";
import { useItemWidth } from "@/hooks/use-item-width";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import styles from "./months-track.module.css";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue, useSelectionActions } from "@/context/selection-context";
import { useConfig } from "@/context/config-context";
import { useTrack } from "@/hooks/use-track";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { getMonthNames } from "@/utils/month-utils";

const HALF = 4;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

export interface CalendarMonthsTrackProps {
  short?: boolean;
  bound?: "from" | "to";
  col?: number | string;
}

export const CalendarMonthsTrack: React.FC<CalendarMonthsTrackProps> = ({ short = true, bound, col }) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate, locale, range, readOnly } = useConfig();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { onRangeBoundSet } = useSelectionActions();
  const { isBound, setLocalView, refDate } = useBoundDateView({ bound, range, rangeStart, rangeEnd, viewDate });
  const year = refDate.getFullYear();
  const currentIndex = refDate.getMonth();
  const MONTHS = getMonthNames(locale, short);
  const minIndex = minDate && minDate.getFullYear() === year ? minDate.getMonth() : undefined;
  const maxIndex = maxDate && maxDate.getFullYear() === year ? maxDate.getMonth() : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = useItemWidth(containerRef, 52);

  const { ref, position, scrollTo, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useTrack({
    count: MONTHS.length,
    initialIndex: currentIndex,
    pixelsPerItem: itemWidth,
    circular: true,
    minIndex,
    maxIndex,
    ref: containerRef,
    onChange: (index) => {
      const next = new Date(refDate);
      next.setMonth(index);
      if (isBound) {
        setLocalView(next);
        if (!readOnly) onRangeBoundSet(bound!, next);
      } else {
        navigateTo(next);
      }
    },
  });

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset = containerWidth / 2 - (HALF + frac) * itemWidth - itemWidth / 2;

  const currentIdx = ((Math.round(position) % MONTHS.length) + MONTHS.length) % MONTHS.length;
  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? MONTHS.length - 1;
  const fullMonthName = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long" }).format(new Date(year, currentIdx, 1)),
    [locale, year, currentIdx],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -1;
    else if (e.key === "Home") { e.preventDefault(); scrollTo(minIdx); return; }
    else if (e.key === "End") { e.preventDefault(); scrollTo(maxIdx); return; }
    else return;
    e.preventDefault();
    scrollTo(Math.round(position) + delta);
  };

  return (
    <div
      data-area="months-track"
      ref={ref}
      className={styles.container}
      role="spinbutton"
      tabIndex={0}
      aria-label="Month"
      aria-valuenow={currentIdx + 1}
      aria-valuemin={minIdx + 1}
      aria-valuemax={maxIdx + 1}
      aria-valuetext={fullMonthName}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={useGridSlot(col)}
    >
      <div className={styles.highlight} aria-hidden />
      <div className={styles.strip} style={{ transform: `translateX(${stripOffset}px)` }}>
        {OFFSETS.map((o) => {
          const raw = Math.round(position) + o;
          const idx = ((raw % MONTHS.length) + MONTHS.length) % MONTHS.length;
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
              onClick={!isActive ? () => scrollTo(Math.round(position) + o) : undefined}
            >
              {MONTHS[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
