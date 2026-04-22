import { useRef, useEffect } from "react";
import styles from "./time-track.module.css";
import { getDrumValue, padTime } from "@/utils/date-utils";

interface TimeTrackProps {
  date: Date;
  hour12?: boolean;
  locale?: string;
  onChange: (date: Date) => void;
}

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);
const SCROLL_THRESHOLD = 40;
const TOUCH_THRESHOLD = 28;

const Drum = ({
  val,
  max,
  onMove,
  label,
  getValueText,
}: {
  val: number;
  max: number;
  onMove: (delta: number) => void;
  label: string;
  getValueText: (v: number) => string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const moveRef = useRef(onMove);
  const wheelAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const touchAccum = useRef(0);
  const isHovered = useRef(false);

  useEffect(() => {
    moveRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onEnter = () => { isHovered.current = true; };
    const onLeave = () => { isHovered.current = false; };
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!isHovered.current) return;
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) < SCROLL_THRESHOLD) return;
      const dir = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      moveRef.current(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchAccum.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      e.preventDefault();
      const deltaY = e.touches[0].clientY - touchStartY.current;
      touchAccum.current -= deltaY;
      touchStartY.current = e.touches[0].clientY;
      if (Math.abs(touchAccum.current) < TOUCH_THRESHOLD) return;
      const dir = touchAccum.current > 0 ? 1 : -1;
      touchAccum.current = 0;
      moveRef.current(dir);
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
  }, []);

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
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          onMove(-1);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          onMove(1);
        }
        if (e.key === "Home") {
          e.preventDefault();
          onMove(-val);
        }
        if (e.key === "End") {
          e.preventDefault();
          onMove(max - 1 - val);
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
            onClick={isActive ? undefined : () => onMove(o)}
          >
            {padTime(getDrumValue(val, o, max))}
          </div>
        );
      })}
    </div>
  );
};

const makeUnitFormatter = (locale: string, unit: "hour" | "minute") => {
  try {
    const fmt = new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay: "long" });
    return (v: number) => fmt.format(v);
  } catch {
    return (v: number) => String(v);
  }
};

export const TimeTrack = ({
  date,
  hour12 = false,
  locale = "en",
  onChange,
}: TimeTrackProps) => {
  const raw = date.getHours();
  const hours = hour12 ? raw % 12 || 12 : raw;
  const minutes = date.getMinutes();
  const period: "AM" | "PM" = raw >= 12 ? "PM" : "AM";

  const hourMax = hour12 ? 12 : 24;
  const hourText = makeUnitFormatter(locale, "hour");
  const minuteText = makeUnitFormatter(locale, "minute");

  const emit = (h: number, m: number, p: "AM" | "PM") => {
    const next = new Date(date);
    next.setHours(hour12 ? (p === "AM" ? h % 12 : (h % 12) + 12) : h, m, 0, 0);
    onChange(next);
  };

  const moveHours = (delta: number) =>
    emit(getDrumValue(hours, delta, hourMax), minutes, period);
  const moveMinutes = (delta: number) =>
    emit(hours, getDrumValue(minutes, delta, 60), period);

  return (
    <div className={styles.root} role="group" aria-label="Time picker">
      {hour12 && (
        <div className={styles.period}>
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.periodActive : ""}`}
              aria-pressed={period === p}
              onClick={() => emit(hours, minutes, p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <div className={styles.drums}>
        <Drum val={hours} max={hourMax} onMove={moveHours} label="Hours" getValueText={hourText} />
        <span className={styles.colon} aria-hidden>
          :
        </span>
        <Drum val={minutes} max={60} onMove={moveMinutes} label="Minutes" getValueText={minuteText} />
      </div>
    </div>
  );
};
