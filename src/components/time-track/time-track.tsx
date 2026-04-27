import { useRef } from "react";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";
import { getDrumValue, padTime } from "@/utils/date-utils";
import styles from "./time-track.module.css";

interface TimeTrackProps {
  date: Date;
  hour12?: boolean;
  locale?: string;
  showSeconds?: boolean;
  readOnly?: boolean;
  onChange: (date: Date) => void;
}

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);

const Drum = ({
  val,
  max,
  onMove,
  label,
  getValueText,
  readOnly,
}: {
  val: number;
  max: number;
  onMove: (delta: number) => void;
  label: string;
  getValueText: (v: number) => string;
  readOnly?: boolean;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const guardedMove = (delta: number) => {
    if (readOnly) return;
    onMove(delta);
  };

  useScrollAccumulator(ref, guardedMove, { requireHover: true });

  return (
    <div
      ref={ref}
      className={styles.drum}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={val}
      aria-valuemin={0}
      aria-valuemax={max - 1}
      aria-valuetext={getValueText(val)}
      aria-disabled={readOnly || undefined}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          guardedMove(-1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          guardedMove(1);
        }
        if (e.key === "Home") {
          e.preventDefault();
          guardedMove(-val);
        }
        if (e.key === "End") {
          e.preventDefault();
          guardedMove(max - 1 - val);
        }
      }}
    >
      <div className={styles.highlight} />
      {OFFSETS.map((o) => {
        const isActive = o === 0;
        const dist = Math.abs(o);
        const opacity =
          dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.35 : 0.15;
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            style={!isActive ? { opacity } : undefined}
            aria-hidden={!isActive}
            onClick={isActive ? undefined : () => guardedMove(o)}
          >
            {padTime(getDrumValue(val, o, max))}
          </div>
        );
      })}
    </div>
  );
};

const makeUnitFormatter = (
  locale: string,
  unit: "hour" | "minute" | "second",
) => {
  try {
    const fmt = new Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: "long",
    });
    return (v: number) => fmt.format(v);
  } catch {
    return (v: number) => String(v);
  }
};

export const TimeTrack = ({
  date,
  hour12 = false,
  locale = "en",
  showSeconds = false,
  readOnly = false,
  onChange,
}: TimeTrackProps) => {
  const raw = date.getHours();
  const hours = hour12 ? raw % 12 || 12 : raw;
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const period: "AM" | "PM" = raw >= 12 ? "PM" : "AM";

  const hourMax = hour12 ? 12 : 24;
  const hourText = makeUnitFormatter(locale, "hour");
  const minuteText = makeUnitFormatter(locale, "minute");
  const secondText = makeUnitFormatter(locale, "second");

  const emit = (h: number, m: number, s: number, p: "AM" | "PM") => {
    if (readOnly) return;
    const next = new Date(date);
    next.setHours(hour12 ? (p === "AM" ? h % 12 : (h % 12) + 12) : h, m, s, 0);
    onChange(next);
  };

  const moveHours = (delta: number) =>
    emit(getDrumValue(hours, delta, hourMax), minutes, seconds, period);
  const moveMinutes = (delta: number) =>
    emit(hours, getDrumValue(minutes, delta, 60), seconds, period);
  const moveSeconds = (delta: number) =>
    emit(hours, minutes, getDrumValue(seconds, delta, 60), period);

  return (
    <div className={styles.root} role="group" aria-label="Time picker">
      {hour12 && (
        <div className={styles.period}>
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.periodActive : ""}`}
              aria-pressed={period === p}
              onClick={() => emit(hours, minutes, seconds, p)}
              disabled={readOnly}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <div className={styles.drums}>
        <Drum
          val={hours}
          max={hourMax}
          onMove={moveHours}
          label="Hours"
          getValueText={hourText}
          readOnly={readOnly}
        />
        <span className={styles.colon} aria-hidden>
          :
        </span>
        <Drum
          val={minutes}
          max={60}
          onMove={moveMinutes}
          label="Minutes"
          getValueText={minuteText}
          readOnly={readOnly}
        />
        {showSeconds && (
          <>
            <span className={styles.colon} aria-hidden>
              :
            </span>
            <Drum
              val={seconds}
              max={60}
              onMove={moveSeconds}
              label="Seconds"
              getValueText={secondText}
              readOnly={readOnly}
            />
          </>
        )}
      </div>
    </div>
  );
};
