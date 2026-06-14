import { type CSSProperties, type ReactNode, useRef } from "react";
import { useItemSize } from "../hooks/use-item-size";
import { useTrack } from "../hooks/use-track";
import { getGridSlotStyle } from "../utils/get-grid-slot-style";
import styles from "./virtual-track.module.css";

/**
 * Horizontal physics track — the shared primitive behind Days/Months/Years
 * tracks (the v2 "track" family). A `role="spinbutton"` strip that scrolls with
 * momentum/rubber-band (`useTrack`), virtualized to `half*2+1` items around the
 * centre, with per-item depth (opacity/scale/tilt) and a centred highlight.
 *
 * Reuses the v3 physics (`useTrack`, shared with `StepDrum`) and `useItemSize`.
 * Shape/size come from appearance tokens (`--cal-size-track-item`,
 * `--cal-track-height`, `--cal-radius`); colors from `--c-*`. Per-module
 * `theme`/`scheme` ride on the container like every other module.
 */
type TrackItemStyle = CSSProperties & {
  "--track-item-active": string;
  "--track-item-opacity": number;
  "--track-item-scale": number;
  "--track-item-y": string;
  "--track-item-tilt": string;
};

export type VirtualTrackProps = {
  count: number;
  initialIndex: number;
  circular?: boolean;
  minIndex?: number;
  maxIndex?: number;
  onChange: (index: number) => void;
  /** Half-window of items rendered each side of the centre. */
  half: number;
  initialItemWidth?: number;
  /** PageUp/Down jump size. */
  pageStep?: number;
  dataArea: string;
  ariaLabel: string;
  getAriaValueNow: (idx: number) => number;
  getAriaValueMin: (idx: number) => number;
  getAriaValueMax: (idx: number) => number;
  getAriaValueText: (idx: number) => string;
  col?: number | string;
  theme?: string;
  scheme?: "light" | "dark" | "auto";
  className?: string;
  /** Extra container style — e.g. a wider `--cal-size-track-item`. */
  style?: CSSProperties;
  itemClassName?: string;
  renderItem: (args: {
    idx: number;
    raw: number;
    isActive: boolean;
  }) => ReactNode;
  renderOverlay?: (args: { activeIndex: number }) => ReactNode;
};

const cx = (...parts: (string | undefined)[]) =>
  parts.filter(Boolean).join(" ");

// Depth-of-field: items further from the centre fade, shrink, tilt and drop —
// the v2 "carousel" feel. Pure function of signed distance from centre.
function getTrackItemStyle(signedDistance: number): TrackItemStyle {
  const distance = Math.abs(signedDistance);
  const activeMix = Math.max(0, Math.min(1, 1 - distance * 0.85));
  const opacity = Math.max(0.22, 1 - distance * 0.2);
  const scale = Math.max(0.68, 1 - distance * 0.075);
  const y = Math.min(distance * 0.1, 0.24);
  const tilt = Math.max(-18, Math.min(18, signedDistance * -7));
  return {
    "--track-item-active": `${Math.round(activeMix * 100)}%`,
    "--track-item-opacity": opacity,
    "--track-item-scale": scale,
    "--track-item-y": `${y}em`,
    "--track-item-tilt": `${tilt}deg`,
  };
}

export function VirtualTrack({
  count,
  initialIndex,
  circular = false,
  minIndex,
  maxIndex,
  onChange,
  half,
  initialItemWidth = 44,
  pageStep,
  dataArea,
  ariaLabel,
  getAriaValueNow,
  getAriaValueMin,
  getAriaValueMax,
  getAriaValueText,
  col,
  theme,
  scheme,
  className,
  style,
  itemClassName,
  renderItem,
  renderOverlay,
}: VirtualTrackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = useItemSize(containerRef, "width", initialItemWidth);

  const offsets = Array.from({ length: half * 2 + 1 }, (_, i) => i - half);

  const {
    ref,
    position,
    scrollTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  } = useTrack({
    count,
    initialIndex,
    pixelsPerItem: itemWidth,
    circular,
    minIndex,
    maxIndex,
    ref: containerRef,
    onChange: (idx) => {
      onChange(idx);
      return undefined;
    },
  });

  const containerWidth = ref.current?.offsetWidth ?? 0;
  const frac = position - Math.round(position);
  const stripOffset =
    containerWidth / 2 - (half + frac) * itemWidth - itemWidth / 2;

  const round = Math.round(position);
  const activeIndex = circular
    ? ((round % count) + count) % count
    : Math.max(0, Math.min(count - 1, round));

  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? count - 1;

  const onKeyDown = (e: React.KeyboardEvent) => {
    let delta = 0;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") delta = 1;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") delta = -1;
    else if (pageStep !== undefined && e.key === "PageDown") delta = pageStep;
    else if (pageStep !== undefined && e.key === "PageUp") delta = -pageStep;
    else if (e.key === "Home") {
      e.preventDefault();
      scrollTo(minIdx);
      return;
    } else if (e.key === "End") {
      e.preventDefault();
      scrollTo(maxIdx);
      return;
    } else return;
    e.preventDefault();
    scrollTo(round + delta);
  };

  return (
    <div
      data-area={dataArea}
      data-theme={theme}
      data-scheme={scheme}
      ref={ref}
      className={cx(styles.container, className)}
      role="spinbutton"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuenow={getAriaValueNow(activeIndex)}
      aria-valuemin={getAriaValueMin(activeIndex)}
      aria-valuemax={getAriaValueMax(activeIndex)}
      aria-valuetext={getAriaValueText(activeIndex)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      style={{ ...getGridSlotStyle(col), ...style }}
    >
      <div className={styles.highlight} aria-hidden />
      {renderOverlay?.({ activeIndex })}
      <div
        className={styles.strip}
        style={{ transform: `translateX(${stripOffset}px)` }}
      >
        {offsets.map((o) => {
          const raw = round + o;
          const idx = circular
            ? ((raw % count) + count) % count
            : Math.max(0, Math.min(count - 1, raw));
          const signedDistance = raw - position;
          const isActive = Math.abs(signedDistance) < 0.5;
          return (
            <div
              key={o}
              data-item
              className={cx(
                styles.item,
                itemClassName,
                isActive ? styles.active : undefined,
              )}
              style={getTrackItemStyle(signedDistance)}
              aria-hidden={!isActive}
              onClick={!isActive ? () => scrollTo(round + o) : undefined}
            >
              <span className={styles.itemText}>
                {renderItem({ idx, raw, isActive })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
