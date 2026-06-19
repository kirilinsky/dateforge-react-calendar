import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
// the v2 "carousel" feel. Pure function of signed distance from centre. `rtl`
// flips the tilt direction so the mirrored (row-reversed) strip leans the right
// way (the fade/scale/drop are symmetric and need no flip).
function getTrackItemStyle(
  signedDistance: number,
  rtl: boolean,
): TrackItemStyle {
  const distance = Math.abs(signedDistance);
  const activeMix = Math.max(0, Math.min(1, 1 - distance * 0.85));
  const opacity = Math.max(0.22, 1 - distance * 0.2);
  const scale = Math.max(0.68, 1 - distance * 0.075);
  const y = Math.min(distance * 0.1, 0.24);
  const tilt = Math.max(-18, Math.min(18, signedDistance * (rtl ? 7 : -7)));
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

  // RTL: the months run right-to-left. The spatial mirroring is FREE — the
  // inherited `direction: rtl` already reverses the flex row on the strip (do
  // NOT add `flex-direction: row-reverse`; it cancels that back to LTR). All the
  // JS does on top is fix the two PHYSICAL pieces the cascade can't flip: the
  // strip's `translateX` drag-centring shift (negated fractional term) and the
  // item `rotateY` tilt sign. The swipe physics are untouched, so the
  // gesture→month mapping matches LTR (drag left = next month). Detect via the
  // `dir` ATTRIBUTE of the nearest ancestor (works in tests, unlike computed
  // `direction`); a MutationObserver on <html> catches a dir flip that lands
  // AFTER mount — the Storybook toolbar sets `html[dir]` in an effect that runs
  // after this one (effects fire child-first), so a one-shot read would miss it.
  const [rtl, setRtl] = useState(false);
  useLayoutEffect(() => {
    const read = () => {
      const dir =
        containerRef.current?.closest("[dir]")?.getAttribute("dir") ??
        document.documentElement.getAttribute("dir");
      setRtl(dir === "rtl");
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["dir"],
    });
    return () => obs.disconnect();
  }, []);

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
  // RTL row-reverses the strip (next on the left), so the centring shift during
  // a drag runs the opposite way — negate the fractional term.
  const stripOffset =
    containerWidth / 2 -
    (half + (rtl ? -frac : frac)) * itemWidth -
    itemWidth / 2;

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
        data-rtl={rtl ? "" : undefined}
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
              style={getTrackItemStyle(signedDistance, rtl)}
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
