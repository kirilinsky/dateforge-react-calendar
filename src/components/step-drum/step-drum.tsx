import type React from "react";
import { useRef } from "react";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";
import { padTime } from "@/utils/time-utils";
import styles from "./step-drum.module.css";

const OFFSETS = Array.from({ length: 7 }, (_, i) => i - 3);

interface StepDrumProps {
  value: number;
  max: number;
  step?: number;
  onChange: (next: number) => void;
  label: string;
  getValueText: (v: number) => string;
  format?: (v: number) => string;
  readOnly?: boolean;
  className?: string;
}

export const StepDrum: React.FC<StepDrumProps> = ({
  value,
  max,
  step = 1,
  onChange,
  label,
  getValueText,
  format = padTime,
  readOnly,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const safeStep = step > 0 ? step : 1;
  const count = Math.max(1, Math.floor(max / safeStep));
  const rawIndex = Math.floor(value / safeStep);
  const index = ((rawIndex % count) + count) % count;
  const aligned = index * safeStep;
  const valueMax = (count - 1) * safeStep;

  const moveByIdx = (delta: number) => {
    if (readOnly) return;
    const next = (((index + delta) % count) + count) % count;
    onChange(next * safeStep);
  };

  useScrollAccumulator(ref, moveByIdx, { requireHover: true });

  return (
    <div
      ref={ref}
      className={[styles.drum, className].filter(Boolean).join(" ")}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={aligned}
      aria-valuemin={0}
      aria-valuemax={valueMax}
      aria-valuetext={getValueText(aligned)}
      aria-disabled={readOnly || undefined}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          moveByIdx(-1);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          moveByIdx(1);
        } else if (e.key === "Home") {
          e.preventDefault();
          moveByIdx(-index);
        } else if (e.key === "End") {
          e.preventDefault();
          moveByIdx(count - 1 - index);
        }
      }}
    >
      <div className={styles.highlight} aria-hidden />
      {OFFSETS.map((o) => {
        const isActive = o === 0;
        const dist = Math.abs(o);
        const opacity =
          dist === 0 ? 1 : dist === 1 ? 0.6 : dist === 2 ? 0.35 : 0.15;
        const idx = (((index + o) % count) + count) % count;
        const v = idx * safeStep;
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            style={!isActive ? { opacity } : undefined}
            aria-hidden={!isActive}
            onClick={isActive ? undefined : () => moveByIdx(o)}
          >
            {format(v)}
          </div>
        );
      })}
    </div>
  );
};
