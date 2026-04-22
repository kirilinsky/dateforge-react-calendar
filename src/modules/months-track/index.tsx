import React, { useEffect, useState } from "react";
import styles from "./months-track.module.css";
import { useNavigation } from "@/context/navigation-context";
import { useConfig } from "@/context/config-context";
import { useTrack } from "@/hooks/use-track";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { getMonthNames } from "@/utils/month-utils";

const HALF = 4;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

export interface CalendarMonthsTrackProps {
  shortMonths?: boolean;
  col?: number | string;
}

export const CalendarMonthsTrack: React.FC<CalendarMonthsTrackProps> = ({ shortMonths = true, col }) => {
  const { viewDate, navigateTo } = useNavigation();
  const { minDate, maxDate, locale } = useConfig();
  const year = viewDate.getFullYear();
  const currentIndex = viewDate.getMonth();
  const MONTHS = getMonthNames(locale, shortMonths);
  const [itemWidth, setItemWidth] = useState(52);

  const minIndex = minDate && minDate.getFullYear() === year ? minDate.getMonth() : undefined;
  const maxIndex = maxDate && maxDate.getFullYear() === year ? maxDate.getMonth() : undefined;

  const { ref, position, scrollTo, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useTrack({
    count: MONTHS.length,
    initialIndex: currentIndex,
    pixelsPerItem: itemWidth,
    circular: true,
    minIndex,
    maxIndex,
    onChange: (index) => {
      const next = new Date(viewDate);
      next.setMonth(index);
      navigateTo(next);
    },
  });

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
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
      data-area="months-track"
      ref={ref}
      className={styles.container}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={useGridSlot(col)}
    >
      <div className={styles.highlight} />
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
