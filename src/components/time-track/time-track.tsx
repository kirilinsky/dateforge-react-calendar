import { StepDrum } from "@/components/step-drum/step-drum";
import { getNumberFormat } from "@/utils/intl-cache";
import { padTime } from "@/utils/time-utils";
import styles from "./time-track.module.css";

interface TimeStep {
  hour?: number;
  minute?: number;
  second?: number;
}

export type TimeLabelStyle = "short" | "long";

export interface BoundTimeLimit {
  hours?: number;
  minutes?: number;
  seconds?: number;
}

interface TimeTrackProps {
  date: Date;
  hour12?: boolean;
  locale?: string;
  showSeconds?: boolean;
  readOnly?: boolean;
  step?: TimeStep;
  circular?: boolean;
  snapKey?: unknown;
  labels?: TimeLabelStyle;
  hoursLabel?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  /** Per-drum lower bound for bound="to" (24h values). Cross-drum: minutes
   *  constraint only applies when hours == boundMin.hours. */
  boundMin?: BoundTimeLimit;
  /** Per-drum upper bound for bound="from" (24h values). */
  boundMax?: BoundTimeLimit;
  onChange: (date: Date) => boolean | undefined;
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
  const fmt = getNumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "long",
  });
  return fmt ? (v: number) => fmt.format(v) : (v: number) => String(v);
};

export const TimeTrack = ({
  date,
  hour12 = false,
  locale = "en",
  showSeconds = false,
  readOnly = false,
  step,
  circular = true,
  snapKey,
  labels,
  hoursLabel = "Hours",
  minutesLabel = "Minutes",
  secondsLabel = "Seconds",
  timePeriodLabel = "Time period, currently {period}",
  timePickerLabel = "Time picker",
  boundMin,
  boundMax,
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

  const emit = (
    h: number,
    m: number,
    s: number,
    p: "AM" | "PM",
  ): boolean | undefined => {
    if (readOnly) return;
    const next = new Date(date);
    next.setHours(hour12 ? (p === "AM" ? h % 12 : (h % 12) + 12) : h, m, s, 0);
    return onChange(next);
  };

  // Per-drum bounds (24h only — hour12 AM/PM split makes min/max per-drum complex).
  // Cross-drum: minute min/max only applies when the current hour equals the
  // bound hour, otherwise the whole hour direction is clear.
  const minHour = !hour12 ? boundMin?.hours : undefined;
  const maxHour = !hour12 ? boundMax?.hours : undefined;
  const minMinute =
    !hour12 && boundMin?.hours !== undefined && raw === boundMin.hours
      ? boundMin.minutes
      : undefined;
  const maxMinute =
    !hour12 && boundMax?.hours !== undefined && raw === boundMax.hours
      ? boundMax.minutes
      : undefined;
  const minSecond =
    !hour12 &&
    boundMin?.hours !== undefined &&
    raw === boundMin.hours &&
    boundMin.minutes !== undefined &&
    minutes === boundMin.minutes
      ? boundMin.seconds
      : undefined;
  const maxSecond =
    !hour12 &&
    boundMax?.hours !== undefined &&
    raw === boundMax.hours &&
    boundMax.minutes !== undefined &&
    minutes === boundMax.minutes
      ? boundMax.seconds
      : undefined;

  return (
    <div className={styles.root} role="group" aria-label={timePickerLabel}>
      {hour12 && (
        <button
          type="button"
          role="switch"
          aria-checked={period === "PM"}
          aria-label={timePeriodLabel.replaceAll(
            "{period}",
            period === "AM" ? "before noon" : "after noon",
          )}
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
            value={hour12 ? hours - 1 : hours}
            max={hourMax}
            step={hourStep}
            circular={circular}
            snapKey={snapKey}
            label={hoursLabel}
            minValue={minHour}
            maxValue={maxHour}
            getValueText={hour12 ? (v) => hourText(v + 1) : hourText}
            format={hour12 ? (v) => padTime(v + 1) : undefined}
            readOnly={readOnly}
            onChange={(h) => emit(hour12 ? h + 1 : h, minutes, seconds, period)}
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
            circular={circular}
            snapKey={snapKey}
            label={minutesLabel}
            minValue={minMinute}
            maxValue={maxMinute}
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
                circular={circular}
                snapKey={snapKey}
                label={secondsLabel}
                minValue={minSecond}
                maxValue={maxSecond}
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
