import { useRef, useState } from "react";
import { Popup } from "@/components/popup/popup";
import { useItemSize } from "@/hooks/use-item-size";
import { useTrack } from "@/hooks/use-track";
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
  signedOffset: number,
  wheelOffset: number,
  disabled: boolean,
): DrumItemStyle => {
  const distance = Math.abs(signedOffset);
  const activeMix = Math.max(0, Math.min(1, 1 - distance * 0.85));
  const opacity = Math.max(0.18, 1 - distance * 0.28);
  const scale = Math.max(0.8, 1.06 - distance * 0.075);
  const y = signedOffset * 0.045;
  const z = 0.5 - distance * 0.2;
  const tilt = Math.max(-30, Math.min(30, signedOffset * -12));

  return {
    "--drum-item-active": `${Math.round(activeMix * 100)}%`,
    "--drum-item-opacity": disabled ? opacity * 0.4 : opacity,
    "--drum-item-scale": scale,
    "--drum-item-shift": `${wheelOffset * -100}%`,
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
  onJump,
  label,
  count,
  circular,
  minIndex,
  maxIndex,
}: {
  val: number;
  getLabel: (v: number) => string;
  getOffsetVal: (v: number, offset: number) => number;
  isDisabled: (v: number) => boolean;
  onJump: (target: number) => void;
  label: string;
  count?: number;
  circular?: boolean;
  minIndex?: number;
  maxIndex?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const itemHeight = useItemSize(ref, "height", 28);

  const {
    position,
    scrollTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    isInteracting,
  } = useTrack({
    axis: "y",
    circular,
    count,
    initialIndex: val,
    maxIndex,
    minIndex,
    onChange: (next) => {
      if (!isDisabled(next)) onJump(next);
      return undefined;
    },
    pixelsPerItem: itemHeight,
    ref,
  });
  const round = Math.round(position);
  const wheelOffset = position - round;
  const activeValue = getOffsetVal(0, round);

  return (
    <div
      ref={ref}
      className={styles.drum}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={activeValue}
      aria-valuetext={getLabel(activeValue)}
      data-dragging={isInteracting || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          scrollTo(round - 1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          scrollTo(round + 1);
        }
      }}
    >
      <div className={styles.highlight} />
      {OFFSETS.map((o) => {
        const raw = round + o;
        const signedDistance = raw - position;
        const isActive = Math.abs(signedDistance) < 0.5;
        const dispVal = getOffsetVal(0, raw);
        const disabled = isDisabled(dispVal);
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""} ${disabled ? styles.disabled : ""}`}
            style={getDrumItemStyle(signedDistance, wheelOffset, disabled)}
            aria-hidden={!isActive}
            onClick={isActive || disabled ? undefined : () => scrollTo(raw)}
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
  const enabledMonths = monthsData
    .map((item, index) => (item.disabled ? null : index))
    .filter((item): item is number => item !== null);
  const bounded = enabledMonths.length > 0 && enabledMonths.length < 12;

  return (
    <div className={styles.root}>
      <SelectDrum
        circular={!bounded}
        count={12}
        val={month}
        getLabel={getLabel}
        getOffsetVal={getOffsetVal}
        isDisabled={isDisabled}
        onJump={onChange}
        minIndex={bounded ? enabledMonths[0] : undefined}
        maxIndex={bounded ? enabledMonths.at(-1) : undefined}
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

  return (
    <div className={styles.root}>
      <SelectDrum
        val={year}
        getLabel={getLabel}
        getOffsetVal={getOffsetVal}
        isDisabled={isDisabled}
        onJump={onChange}
        minIndex={Number.isFinite(minYear) ? minYear : undefined}
        maxIndex={Number.isFinite(maxYear) ? maxYear : undefined}
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
