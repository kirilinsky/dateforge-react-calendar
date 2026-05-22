import type React from "react";
import { useRef } from "react";
import { useItemSize } from "@/hooks/use-item-size";
import { useTrack } from "@/hooks/use-track";
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
  signedOffset: number,
  wheelOffset: number,
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
    "--drum-item-opacity": opacity,
    "--drum-item-scale": scale,
    "--drum-item-shift": `${wheelOffset * -100}%`,
    "--drum-item-y": `${y}em`,
    "--drum-item-z": `${z}em`,
    "--drum-item-tilt": `${tilt}deg`,
  };
};

interface StepDrumProps {
  value: number;
  max: number;
  minValue?: number;
  maxValue?: number;
  step?: number;
  circular?: boolean;
  snapKey?: unknown;
  onChange: (next: number) => boolean | undefined;
  label: string;
  getAriaValue?: (v: number) => number;
  getValueText: (v: number) => string;
  format?: (v: number) => string;
  readOnly?: boolean;
  className?: string;
}

export const StepDrum: React.FC<StepDrumProps> = ({
  value,
  max,
  minValue,
  maxValue,
  step = 1,
  circular = true,
  snapKey,
  onChange,
  label,
  getAriaValue = (v) => v,
  getValueText,
  format = padTime,
  readOnly,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const itemHeight = useItemSize(ref, "height", 28);
  const pixelsPerItem = Math.max(itemHeight, 28);

  const safeStep = step > 0 ? step : 1;
  const count = Math.max(1, Math.floor(max / safeStep));
  const rawIndex = Math.floor(value / safeStep);
  const baseMinIndex =
    minValue === undefined ? undefined : Math.ceil(minValue / safeStep);
  const baseMaxIndex =
    maxValue === undefined ? undefined : Math.floor(maxValue / safeStep);
  const hasBounds = baseMinIndex !== undefined || baseMaxIndex !== undefined;
  const isFiniteWheel = hasBounds || !circular;
  const clampIndex = (idx: number, lo = 0, hi = count - 1) =>
    Math.min(Math.max(idx, lo), hi);
  const normalizedMinIndex =
    baseMinIndex === undefined ? 0 : clampIndex(baseMinIndex);
  const normalizedMaxIndex =
    baseMaxIndex === undefined ? count - 1 : clampIndex(baseMaxIndex);
  const noValidRange = normalizedMinIndex > normalizedMaxIndex;
  const fallbackIndex = clampIndex(rawIndex);
  const minIndex = noValidRange ? fallbackIndex : normalizedMinIndex;
  const maxIndex = noValidRange ? fallbackIndex : normalizedMaxIndex;
  const resolveIndex = (idx: number) =>
    isFiniteWheel
      ? clampIndex(idx, minIndex, maxIndex)
      : getDrumValue(idx, 0, count);
  const index = resolveIndex(rawIndex);
  const aligned = index * safeStep;
  const valueMin = minIndex * safeStep;
  const valueMax = maxIndex * safeStep;

  const moveByIdx = (delta: number) => {
    if (readOnly) return;
    const nextIndex = resolveIndex(index + delta);
    if (nextIndex === index) return;
    if (onChange(nextIndex * safeStep) !== false) {
      scrollTo(nextIndex);
    }
  };

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
    disabled: readOnly,
    initialIndex: index,
    maxIndex: isFiniteWheel ? maxIndex : undefined,
    minIndex: isFiniteWheel ? minIndex : undefined,
    onChange: (next) => onChange(next * safeStep),
    pixelsPerItem,
    ref,
    rubberBand: !isFiniteWheel,
    snapKey,
    sticky: true,
  });
  const renderPosition = isFiniteWheel
    ? clampIndex(position, minIndex, maxIndex)
    : position;
  const round = Math.round(renderPosition);
  const wheelOffset = renderPosition - round;

  return (
    <div
      ref={ref}
      className={[styles.drum, className].filter(Boolean).join(" ")}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={getAriaValue(aligned)}
      aria-valuemin={getAriaValue(valueMin)}
      aria-valuemax={getAriaValue(valueMax)}
      aria-valuetext={getValueText(aligned)}
      aria-disabled={readOnly || undefined}
      data-dragging={isInteracting || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
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
        const raw = round + o;
        const signedDistance = raw - renderPosition;
        const isActive = Math.abs(signedDistance) < 0.5;
        const isOutOfRange =
          isFiniteWheel && (raw < minIndex || raw > maxIndex);
        const idx = isFiniteWheel ? raw : getDrumValue(raw, 0, count);
        const v = idx * safeStep;
        return (
          <div
            key={o}
            data-item
            className={`${styles.item} ${isActive ? styles.active : ""}`}
            style={getDrumItemStyle(signedDistance, wheelOffset)}
            aria-hidden={!isActive || isOutOfRange}
            onClick={isActive || isOutOfRange ? undefined : () => scrollTo(raw)}
          >
            {isOutOfRange ? " " : format(v)}
          </div>
        );
      })}
    </div>
  );
};
