import { StepDrum } from "@/components/step-drum/step-drum";
import styles from "./time-track.module.css";

interface TimeStep {
  hour?: number;
  minute?: number;
  second?: number;
}

interface TimeTrackProps {
  date: Date;
  hour12?: boolean;
  locale?: string;
  showSeconds?: boolean;
  readOnly?: boolean;
  step?: TimeStep;
  onChange: (date: Date) => void;
}

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
  step,
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

  const hourStep = Math.max(1, step?.hour ?? 1);
  const minuteStep = Math.max(1, step?.minute ?? 1);
  const secondStep = Math.max(1, step?.second ?? 1);

  const emit = (h: number, m: number, s: number, p: "AM" | "PM") => {
    if (readOnly) return;
    const next = new Date(date);
    next.setHours(hour12 ? (p === "AM" ? h % 12 : (h % 12) + 12) : h, m, s, 0);
    onChange(next);
  };

  return (
    <div className={styles.root} role="group" aria-label="Time picker">
      {hour12 && (
        <button
          type="button"
          role="switch"
          aria-checked={period === "PM"}
          aria-label={`Time period, currently ${period === "AM" ? "before noon" : "after noon"}`}
          className={styles.period}
          data-period={period}
          onClick={() =>
            emit(hours, minutes, seconds, period === "AM" ? "PM" : "AM")
          }
          disabled={readOnly}
        >
          <span className={styles.periodThumb} aria-hidden />
          <span className={styles.periodLabel} aria-hidden>
            AM
          </span>
          <span className={styles.periodLabel} aria-hidden>
            PM
          </span>
        </button>
      )}
      <div className={styles.drums}>
        <StepDrum
          value={hours}
          max={hourMax}
          step={hourStep}
          label="Hours"
          getValueText={hourText}
          readOnly={readOnly}
          onChange={(h) => emit(h, minutes, seconds, period)}
        />
        <span className={styles.colon} aria-hidden>
          :
        </span>
        <StepDrum
          value={minutes}
          max={60}
          step={minuteStep}
          label="Minutes"
          getValueText={minuteText}
          readOnly={readOnly}
          onChange={(m) => emit(hours, m, seconds, period)}
        />
        {showSeconds && (
          <>
            <span className={styles.colon} aria-hidden>
              :
            </span>
            <StepDrum
              value={seconds}
              max={60}
              step={secondStep}
              label="Seconds"
              getValueText={secondText}
              readOnly={readOnly}
              onChange={(s) => emit(hours, minutes, s, period)}
            />
          </>
        )}
      </div>
    </div>
  );
};
