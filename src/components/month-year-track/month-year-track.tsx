import { useRef, useEffect, useState } from "react";
import styles from "./month-year-track.module.css";
import { getDrumValue, getMonthListData, setMonth as applyMonth, setYear as applyYear } from "@/utils/date-utils";
import { Popup } from "../time-popup/time-popup";

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);
const SCROLL_THRESHOLD = 40;
const TOUCH_THRESHOLD = 28;

function SelectDrum({
  val,
  gestures,
  getLabel,
  getOffsetVal,
  isDisabled,
  onStep,
  onJump,
  label,
}: {
  val: number;
  gestures?: boolean;
  getLabel: (v: number) => string;
  getOffsetVal: (v: number, offset: number) => number;
  isDisabled: (v: number) => boolean;
  onStep: (dir: 1 | -1) => void;
  onJump: (target: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const stepRef = useRef(onStep);
  const wheelAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchAccum = useRef(0);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) < SCROLL_THRESHOLD) return;
      const dir = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      stepRef.current(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || !gestures) return;
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchAccum.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      e.preventDefault();
      const delta = e.touches[0].clientY - touchStartY.current;
      touchAccum.current -= delta;
      touchStartY.current = e.touches[0].clientY;
      if (Math.abs(touchAccum.current) < TOUCH_THRESHOLD) return;
      const dir = touchAccum.current > 0 ? 1 : -1;
      touchAccum.current = 0;
      stepRef.current(dir);
    };
    const onTouchEnd = () => {
      touchStartY.current = null;
      touchAccum.current = 0;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [gestures]);

  return (
    <div
      ref={ref}
      className={styles.drum}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={val}
      aria-valuetext={getLabel(val)}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") { e.preventDefault(); onStep(-1); }
        if (e.key === "ArrowDown") { e.preventDefault(); onStep(1); }
      }}
    >
      <div className={styles.highlight} />
      {OFFSETS.map((o) => {
        const isActive = o === 0;
        const dist = Math.abs(o);
        const opacity = dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.35 : 0.15;
        const dispVal = getOffsetVal(val, o);
        const disabled = isDisabled(dispVal);
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
            style={!isActive ? { opacity: disabled ? opacity * 0.4 : opacity } : undefined}
            aria-hidden={!isActive}
            onClick={isActive || disabled ? undefined : () => onJump(dispVal)}
          >
            {getLabel(dispVal)}
          </div>
        );
      })}
    </div>
  );
}

function MonthTrack({
  month,
  year,
  locale,
  startDate,
  endDate,
  shortMonths,
  gestures,
  onChange,
}: {
  month: number;
  year: number;
  locale: string;
  startDate?: Date | null;
  endDate?: Date | null;
  shortMonths?: boolean;
  gestures?: boolean;
  onChange: (month: number) => void;
}) {
  const monthsData = getMonthListData(locale, year, startDate, endDate, shortMonths);

  const isDisabled = (m: number) => monthsData[((m % 12) + 12) % 12].disabled;
  const getOffsetVal = (v: number, offset: number) => getDrumValue(v, offset, 12);
  const getLabel = (v: number) => monthsData[((v % 12) + 12) % 12].label;

  const step = (dir: 1 | -1) => {
    let next = getDrumValue(month, dir, 12);
    let attempts = 0;
    while (monthsData[next].disabled && attempts < 12) {
      next = getDrumValue(next, dir, 12);
      attempts++;
    }
    if (!monthsData[next].disabled) onChange(next);
  };

  return (
    <div className={styles.root}>
      <SelectDrum
        val={month}
        gestures={gestures}
        getLabel={getLabel}
        getOffsetVal={getOffsetVal}
        isDisabled={isDisabled}
        onStep={step}
        onJump={onChange}
        label="Month"
      />
    </div>
  );
}

function YearTrack({
  year,
  startDate,
  endDate,
  gestures,
  onChange,
}: {
  year: number;
  startDate?: Date | null;
  endDate?: Date | null;
  gestures?: boolean;
  onChange: (year: number) => void;
}) {
  const minYear = startDate ? startDate.getFullYear() : -Infinity;
  const maxYear = endDate ? endDate.getFullYear() : Infinity;

  const isDisabled = (y: number) => y < minYear || y > maxYear;
  const getOffsetVal = (v: number, offset: number) => v + offset;
  const getLabel = (v: number) => String(v);

  const step = (dir: 1 | -1) => {
    const next = year + dir;
    if (!isDisabled(next)) onChange(next);
  };

  return (
    <div className={styles.root}>
      <SelectDrum
        val={year}
        gestures={gestures}
        getLabel={getLabel}
        getOffsetVal={getOffsetVal}
        isDisabled={isDisabled}
        onStep={step}
        onJump={onChange}
        label="Year"
      />
    </div>
  );
}

export interface MonthPopupProps {
  date: Date;
  locale: string;
  startDate?: Date | null;
  endDate?: Date | null;
  shortMonths?: boolean;
  gestures?: boolean;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const MonthPopup = ({
  date,
  locale,
  startDate,
  endDate,
  shortMonths,
  gestures,
  onConfirm,
  onClose,
}: MonthPopupProps) => {
  const [month, setMonth] = useState(date.getMonth());
  return (
    <Popup onConfirm={() => onConfirm(applyMonth(date, month))} onClose={onClose}>
      <MonthTrack
        month={month}
        year={date.getFullYear()}
        locale={locale}
        startDate={startDate}
        endDate={endDate}
        shortMonths={shortMonths}
        gestures={gestures}
        onChange={setMonth}
      />
    </Popup>
  );
};

export interface YearPopupProps {
  date: Date;
  startDate?: Date | null;
  endDate?: Date | null;
  gestures?: boolean;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const YearPopup = ({
  date,
  startDate,
  endDate,
  gestures,
  onConfirm,
  onClose,
}: YearPopupProps) => {
  const [year, setYear] = useState(date.getFullYear());
  return (
    <Popup onConfirm={() => onConfirm(applyYear(date, year))} onClose={onClose}>
      <YearTrack
        year={year}
        startDate={startDate}
        endDate={endDate}
        gestures={gestures}
        onChange={setYear}
      />
    </Popup>
  );
};
