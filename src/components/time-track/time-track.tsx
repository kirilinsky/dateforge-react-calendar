import { StepDrum } from "@/components/step-drum/step-drum";
import styles from "./time-track.module.css";

interface TimeStep {
  hour?: number;
  minute?: number;
  second?: number;
}

export type TimeLabelStyle = "short" | "long";

interface TimeTrackProps {
  date: Date;
  hour12?: boolean;
  locale?: string;
  showSeconds?: boolean;
  readOnly?: boolean;
  step?: TimeStep;
  labels?: TimeLabelStyle;
  onChange: (date: Date) => void;
}

const SHORT_LABELS = { hour: "HH", minute: "MM", second: "SS" } as const;

const getLongLabel = (
  locale: string,
  field: "hour" | "minute" | "second",
): string => {
  try {
    const dn = new Intl.DisplayNames(locale, { type: "dateTimeField" });
    const name = dn.of(field);
    if (name) return name;
  } catch {
    // fall through
  }
  return field;
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
  step,
  labels,
  onChange,
}: TimeTrackProps) => {
  const resolveLabel = (field: "hour" | "minute" | "second") => {
    if (!labels) return null;
    if (labels === "short") return SHORT_LABELS[field];
    return getLongLabel(locale, field);
  };
  const hourLabel = resolveLabel("hour");
  const minuteLabel = resolveLabel("minute");
  const secondLabel = resolveLabel("second");
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
          <span className={styles.periodLabel} data-value="AM" aria-hidden>
            AM
          </span>
          <span className={styles.periodLabel} data-value="PM" aria-hidden>
            PM
          </span>
        </button>
      )}
      <div className={styles.drums} data-labels={labels || undefined}>
        <div className={styles.drumCol}>
          {hourLabel && (
            <span className={styles.drumLabel} aria-hidden>
              {hourLabel}
            </span>
          )}
          <StepDrum
            value={hours}
            max={hourMax}
            step={hourStep}
            label="Hours"
            getValueText={hourText}
            readOnly={readOnly}
            onChange={(h) => emit(h, minutes, seconds, period)}
          />
        </div>
        <div className={styles.colonCol} aria-hidden>
          {labels && <span className={styles.drumLabel}>&nbsp;</span>}
          <span className={styles.colon}>:</span>
        </div>
        <div className={styles.drumCol}>
          {minuteLabel && (
            <span className={styles.drumLabel} aria-hidden>
              {minuteLabel}
            </span>
          )}
          <StepDrum
            value={minutes}
            max={60}
            step={minuteStep}
            label="Minutes"
            getValueText={minuteText}
            readOnly={readOnly}
            onChange={(m) => emit(hours, m, seconds, period)}
          />
        </div>
        {showSeconds && (
          <>
            <div className={styles.colonCol} aria-hidden>
              {labels && <span className={styles.drumLabel}>&nbsp;</span>}
              <span className={styles.colon}>:</span>
            </div>
            <div className={styles.drumCol}>
              {secondLabel && (
                <span className={styles.drumLabel} aria-hidden>
                  {secondLabel}
                </span>
              )}
              <StepDrum
                value={seconds}
                max={60}
                step={secondStep}
                label="Seconds"
                getValueText={secondText}
                readOnly={readOnly}
                onChange={(s) => emit(hours, minutes, s, period)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
