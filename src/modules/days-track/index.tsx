import React, { useEffect, useMemo, useState } from "react";
import styles from "./days-track.module.css";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue, useSelectionActions } from "@/context/selection-context";
import { useConfig } from "@/context/config-context";
import { useUI } from "@/context/ui-context";
import { useTrack } from "@/hooks/use-track";
import { useGridSlot } from "@/hooks/use-grid-slot";

const HALF = 5;
const OFFSETS = Array.from({ length: HALF * 2 + 1 }, (_, i) => i - HALF);

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export interface CalendarDaysTrackProps {
  showMonthLabel?: boolean;
  col?: number | string;
}

export const CalendarDaysTrack: React.FC<CalendarDaysTrackProps> = ({ showMonthLabel = false, col }) => {
  const { viewDate, navigateTo } = useNavigation();
  const { selectedDate } = useSelectionValue();
  const { onChangeDate } = useSelectionActions();
  const { minDate, maxDate, locale } = useConfig();
  const { setDaysTrackActive } = useUI();

  useEffect(() => {
    setDaysTrackActive(true);
    return () => setDaysTrackActive(false);
  }, [setDaysTrackActive]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const days = useMemo(() => daysInMonth(year, month), [year, month]);

  const selectedDay =
    selectedDate &&
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month
      ? selectedDate.getDate() - 1
      : viewDate.getDate() - 1;

  const [itemWidth, setItemWidth] = useState(44);

  const minIndex =
    minDate && minDate.getFullYear() === year && minDate.getMonth() === month
      ? minDate.getDate() - 1
      : undefined;
  const maxIndex =
    maxDate && maxDate.getFullYear() === year && maxDate.getMonth() === month
      ? maxDate.getDate() - 1
      : undefined;

  const { ref, position, scrollTo, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useTrack({
    count: days,
    initialIndex: selectedDay,
    pixelsPerItem: itemWidth,
    circular: true,
    minIndex,
    maxIndex,
    onChange: (index) => {
      const next = new Date(viewDate);
      next.setFullYear(year);
      next.setMonth(month);
      next.setDate(index + 1);
      navigateTo(next);
      onChangeDate(next);
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

  const shortMonth = useMemo(
    () => showMonthLabel
      ? new Intl.DateTimeFormat(locale, { month: "short" }).format(new Date(year, month, 1))
      : null,
    [showMonthLabel, locale, year, month],
  );

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset = containerWidth / 2 - (HALF + frac) * itemWidth - itemWidth / 2;

  return (
    <div
      data-area="days-track"
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
              onClick={!isActive ? () => scrollTo(Math.round(position) + o) : undefined}
            >
              {isActive && shortMonth ? (
                <span className={styles.activeLabel}>
                  <span>{idx + 1}</span>
                  <span className={styles.monthLabel}>{shortMonth}</span>
                </span>
              ) : idx + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};
