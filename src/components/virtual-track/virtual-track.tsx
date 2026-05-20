import type React from "react";
import { useRef } from "react";
import { useUI } from "@/context/ui-context";
import { useItemWidth } from "@/hooks/use-item-width";
import { useTrack } from "@/hooks/use-track";
import type { CalendarTheme } from "@/types/themes";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import styles from "./virtual-track.module.css";

type TrackItemStyle = React.CSSProperties & {
  "--track-item-active": string;
  "--track-item-opacity": number;
  "--track-item-scale": number;
  "--track-item-y": string;
  "--track-item-tilt": string;
};

interface VirtualTrackRenderArgs {
  idx: number;
  raw: number;
  isActive: boolean;
}

interface VirtualTrackProps {
  count: number;
  initialIndex: number;
  circular?: boolean;
  minIndex?: number;
  maxIndex?: number;
  onChange: (index: number) => void;

  half: number;
  initialItemWidth?: number;

  pageStep?: number;

  dataArea: string;
  ariaLabel: string;
  getAriaValueNow: (idx: number) => number;
  getAriaValueMin: (idx: number) => number;
  getAriaValueMax: (idx: number) => number;
  getAriaValueText: (idx: number) => string;

  col?: number | string;
  theme?: CalendarTheme;
  className?: string;
  itemClassName?: string;
  activeClassName?: string;
  highlightClassName?: string;
  stripClassName?: string;

  renderItem: (args: VirtualTrackRenderArgs) => React.ReactNode;
  renderOverlay?: (args: { activeIndex: number }) => React.ReactNode;
}

const cx = (...parts: Array<string | undefined>) =>
  parts.filter(Boolean).join(" ");

const getTrackItemStyle = (signedDistance: number): TrackItemStyle => {
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
};

export const VirtualTrack: React.FC<VirtualTrackProps> = ({
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
  className,
  itemClassName,
  activeClassName,
  highlightClassName,
  stripClassName,
  renderItem,
  renderOverlay,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemWidth = useItemWidth(containerRef, initialItemWidth);
  const { activeTheme } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);

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
    onChange,
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
      data-theme={themeScope.dataTheme}
      style={{ ...getGridSlotStyle(col), ...themeScope.style }}
    >
      <div className={cx(styles.highlight, highlightClassName)} aria-hidden />
      {renderOverlay?.({ activeIndex })}
      <div
        className={cx(styles.strip, stripClassName)}
        style={{ transform: `translateX(${stripOffset}px)` }}
      >
        {offsets.map((o) => {
          const raw = round + o;
          let idx: number;
          if (circular) {
            idx = ((raw % count) + count) % count;
          } else {
            idx = Math.max(0, Math.min(count - 1, raw));
          }
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
                isActive ? activeClassName : undefined,
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
};
