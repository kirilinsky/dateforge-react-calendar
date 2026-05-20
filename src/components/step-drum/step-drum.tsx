import type React from "react";
import { useRef } from "react";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";
import { getDrumValue, padTime } from "@/utils/time-utils";
import styles from "./step-drum.module.css";

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
): DrumItemStyle => {
  const signedOffset = offset - dragOffset;
  const distance = Math.abs(signedOffset);
  const activeMix = Math.max(0, Math.min(1, 1 - distance * 0.85));
  const opacity = Math.max(0.18, 1 - distance * 0.28);
  const scale = Math.max(0.8, 1.06 - distance * 0.075);
  const y = signedOffset * 0.045;
  const z = 0.5 - distance * 0.2;
  const tilt = Math.max(-30, Math.min(30, signedOffset * -12));

  return {
    "--drum-item-active": `${Math.round(activeMix * 100)}%`,
    "--drum-item-opacity": opacity,
    "--drum-item-scale": scale,
    "--drum-item-shift": `${dragOffset * -100}%`,
    "--drum-item-y": `${y}em`,
    "--drum-item-z": `${z}em`,
    "--drum-item-tilt": `${tilt}deg`,
  };
};

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
  const index = getDrumValue(rawIndex, 0, count);
  const aligned = index * safeStep;
  const valueMax = (count - 1) * safeStep;

  const moveByIdx = (delta: number) => {
    if (readOnly) return;
    onChange(getDrumValue(index, delta, count) * safeStep);
  };

  const { dragOffset, isDragging } = useScrollAccumulator(ref, moveByIdx, {
    disabled: readOnly,
    dragThreshold: 24,
    requireHover: true,
  });

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
      data-dragging={isDragging || undefined}
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
        const idx = getDrumValue(index, o, count);
        const v = idx * safeStep;
        return (
          <div
            key={o}
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            style={getDrumItemStyle(o, dragOffset)}
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
