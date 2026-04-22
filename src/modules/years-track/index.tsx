import React, { useEffect, useState } from "react";
import styles from "./years-track.module.css";
import { useNavigation, useConfig } from "react-calendar-datetime";
import { useTrack } from "@/hooks/use-track";

const MIN_YEAR = 1900;
const MAX_YEAR = 2100;
const YEARS = Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i);
const HALF = 6;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

interface CalendarYearsTrackProps {
  col?: number | string;
}

export const CalendarYearsTrack: React.FC<CalendarYearsTrackProps> = ({ col }) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate } = useConfig();
  const currentIndex = Math.max(0, Math.min(YEARS.length - 1, viewDate.getFullYear() - MIN_YEAR));
  const [itemWidth, setItemWidth] = useState(52);

  const minIndex = minDate ? Math.max(0, minDate.getFullYear() - MIN_YEAR) : undefined;
  const maxIndex = maxDate ? Math.min(YEARS.length - 1, maxDate.getFullYear() - MIN_YEAR) : undefined;

  const { ref, position, scrollTo, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useTrack({
    count: YEARS.length,
    initialIndex: currentIndex,
    pixelsPerItem: itemWidth,
    minIndex,
    maxIndex,
    onChange: (index) => {
      const next = new Date(viewDate);
      next.setFullYear(YEARS[index]);
      navigateTo(next);
    },
  });

  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const measure = () => {
      const el = container.querySelector("[data-item]") as HTMLElement | null;
      if (el) setItemWidth(el.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [ref]);

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset = containerWidth / 2 - (HALF + frac) * itemWidth - itemWidth / 2;

  return (
    <div
      data-area="years-track"
      ref={ref}
      className={styles.container}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={col !== undefined ? { gridColumn: typeof col === "number" ? `span ${col}` : col } : undefined}
    >
      <div className={styles.highlight} />
      <div className={styles.strip} style={{ transform: `translateX(${stripOffset}px)` }}>
        {OFFSETS.map((o) => {
          const idx = Math.max(0, Math.min(YEARS.length - 1, Math.round(position) + o));
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
              onClick={!isActive ? () => scrollTo(Math.round(position) + o) : undefined}
            >
              {YEARS[idx]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
