import { useRef, useState } from "react";
import { Popup } from "@/components/popup/popup";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";
import type { CalendarTheme } from "@/types/themes";
import {
  setMonth as applyMonth,
  setYear as applyYear,
  getDrumValue,
  getMonthListData,
} from "@/utils/date-utils";
import styles from "./month-year-track.module.css";

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);

type DrumItemStyle = React.CSSProperties & {
  "--drum-item-active": string;
  "--drum-item-opacity": number;
  "--drum-item-scale": number;
  "--drum-item-shift": string;
  "--drum-item-y": string;
  "--drum-item-z": string;
  "--drum-item-tilt": string;
};

const getDrumItemStyle = (
  offset: number,
  dragOffset: number,
  disabled: boolean,
): DrumItemStyle => {
  const signedOffset = offset - dragOffset;
  const distance = Math.abs(signedOffset);
  const activeMix = Math.max(0, Math.min(1, 1 - distance * 1.35));
  const opacity = Math.max(0.18, 1 - distance * 0.28);
  const scale = Math.max(0.8, 1.06 - distance * 0.075);
  const y = signedOffset * 0.045;
  const z = 0.5 - distance * 0.2;
  const tilt = Math.max(-30, Math.min(30, signedOffset * -12));

  return {
    "--drum-item-active": `${Math.round(activeMix * 100)}%`,
    "--drum-item-opacity": disabled ? opacity * 0.4 : opacity,
    "--drum-item-scale": scale,
    "--drum-item-shift": `${dragOffset * -100}%`,
    "--drum-item-y": `${y}em`,
    "--drum-item-z": `${z}em`,
    "--drum-item-tilt": `${tilt}deg`,
  };
};

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

  const { dragOffset, isDragging } = useScrollAccumulator(ref, onStep, {
    dragThreshold: 24,
  });

  return (
    <div
      ref={ref}
      className={styles.drum}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={val}
      aria-valuetext={getLabel(val)}
      data-dragging={isDragging || undefined}
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
        const dispVal = getOffsetVal(val, o);
        const disabled = isDisabled(dispVal);
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
            style={getDrumItemStyle(o, dragOffset, disabled)}
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
  label,
  onChange,
}: {
  month: number;
  year: number;
  locale: string;
  minDate?: Date | null;
  maxDate?: Date | null;
  shortMonths?: boolean;
  label: string;
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
        label={label}
      />
    </div>
  );
}

function YearTrack({
  year,
  minDate,
  maxDate,
  label,
  onChange,
}: {
  year: number;
  minDate?: Date | null;
  maxDate?: Date | null;
  label: string;
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
        label={label}
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
  confirmLabel?: string;
  label?: string;
  monthTrackLabel?: string;
  theme?: CalendarTheme;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const MonthPopup = ({
  date,
  locale,
  minDate,
  maxDate,
  shortMonths,
  confirmLabel,
  label = "Select month",
  monthTrackLabel = "Month",
  theme,
  onConfirm,
  onClose,
}: MonthPopupProps) => {
  const [month, setMonth] = useState(date.getMonth());
  return (
    <Popup
      label={label}
      confirmLabel={confirmLabel}
      theme={theme}
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
        label={monthTrackLabel}
        onChange={setMonth}
      />
    </Popup>
  );
};

interface YearPopupProps {
  date: Date;
  minDate?: Date | null;
  maxDate?: Date | null;
  confirmLabel?: string;
  label?: string;
  yearTrackLabel?: string;
  theme?: CalendarTheme;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

export const YearPopup = ({
  date,
  minDate,
  maxDate,
  confirmLabel,
  label = "Select year",
  yearTrackLabel = "Year",
  theme,
  onConfirm,
  onClose,
}: YearPopupProps) => {
  const [year, setYear] = useState(date.getFullYear());
  return (
    <Popup
      label={label}
      confirmLabel={confirmLabel}
      theme={theme}
      onConfirm={() => onConfirm(applyYear(date, year))}
      onClose={onClose}
    >
      <YearTrack
        year={year}
        minDate={minDate}
        maxDate={maxDate}
        label={yearTrackLabel}
        onChange={setYear}
      />
    </Popup>
  );
};
