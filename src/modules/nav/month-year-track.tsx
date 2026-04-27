import { useRef, useState } from "react";
import { Popup } from "@/components/popup/popup";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";
import {
  setMonth as applyMonth,
  setYear as applyYear,
  getDrumValue,
  getMonthListData,
} from "@/utils/date-utils";
import styles from "./month-year-track.module.css";

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);

function SelectDrum({
  val,
  getLabel,
  getOffsetVal,
  isDisabled,
  onStep,
  onJump,
  label,
}: {
  val: number;
  getLabel: (v: number) => string;
  getOffsetVal: (v: number, offset: number) => number;
  isDisabled: (v: number) => boolean;
  onStep: (dir: 1 | -1) => void;
  onJump: (target: number) => void;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollAccumulator(ref, onStep);

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
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onStep(-1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onStep(1);
        }
      }}
    >
      <div className={styles.highlight} />
      {OFFSETS.map((o) => {
        const isActive = o === 0;
        const dist = Math.abs(o);
        const opacity =
          dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.35 : 0.15;
        const dispVal = getOffsetVal(val, o);
        const disabled = isDisabled(dispVal);
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
            style={
              !isActive
                ? { opacity: disabled ? opacity * 0.4 : opacity }
                : undefined
            }
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
  minDate,
  maxDate,
  shortMonths,
  onChange,
}: {
  month: number;
  year: number;
  locale: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  shortMonths?: boolean;
  onChange: (month: number) => void;
}) {
  const monthsData = getMonthListData(
    locale,
    year,
    minDate,
    maxDate,
    shortMonths,
  );

  const isDisabled = (m: number) => monthsData[((m % 12) + 12) % 12].disabled;
  const getOffsetVal = (v: number, offset: number) =>
    getDrumValue(v, offset, 12);
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
  minDate,
  maxDate,
  onChange,
}: {
  year: number;
  minDate?: Date | null;
  maxDate?: Date | null;
  onChange: (year: number) => void;
}) {
  const minYear = minDate ? minDate.getFullYear() : -Infinity;
  const maxYear = maxDate ? maxDate.getFullYear() : Infinity;

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

interface MonthPopupProps {
  date: Date;
  locale: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  shortMonths?: boolean;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const MonthPopup = ({
  date,
  locale,
  minDate,
  maxDate,
  shortMonths,
  onConfirm,
  onClose,
}: MonthPopupProps) => {
  const [month, setMonth] = useState(date.getMonth());
  return (
    <Popup
      label="Select month"
      onConfirm={() => onConfirm(applyMonth(date, month))}
      onClose={onClose}
    >
      <MonthTrack
        month={month}
        year={date.getFullYear()}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        shortMonths={shortMonths}
        onChange={setMonth}
      />
    </Popup>
  );
};

interface YearPopupProps {
  date: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const YearPopup = ({
  date,
  minDate,
  maxDate,
  onConfirm,
  onClose,
}: YearPopupProps) => {
  const [year, setYear] = useState(date.getFullYear());
  return (
    <Popup
      label="Select year"
      onConfirm={() => onConfirm(applyYear(date, year))}
      onClose={onClose}
    >
      <YearTrack
        year={year}
        minDate={minDate}
        maxDate={maxDate}
        onChange={setYear}
      />
    </Popup>
  );
};
