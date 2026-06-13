import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Directional page-turn animation for paged surfaces (Days month, YearsGrid
 * page). The NEW content — already committed to the DOM — slides into place from
 * the given edge. No remount: the grid keeps its nodes (memoized cells stay put,
 * React reconciles only what changed), and the motion is a single Web Animations
 * API run on `transform`/`opacity`, so it lives on the compositor and never
 * touches layout. Rapid paging cancels the in-flight run instead of stacking.
 *
 * Direction defaults to horizontal, inferred from the page `ordinal` delta
 * (forward → "right", back → "left"). Callers that move along the vertical axis
 * (keyboard Up/Down crossing a month boundary) pre-seed `setDirection` for the
 * next change. `prefers-reduced-motion` and engines without `element.animate`
 * (SSR, old happy-dom) are no-ops.
 */
export type SlideDirection = "left" | "right" | "up" | "down" | "none";

export interface PageSlideOptions {
  /** Travel distance of the incoming pane, in px. Default 14. */
  distance?: number;
  /** Duration in ms. Default 260. */
  duration?: number;
  /** Timing function. Default a gentle ease-out with a touch of overshoot. */
  easing?: string;
}

const DEFAULTS: Required<PageSlideOptions> = {
  distance: 14,
  duration: 260,
  easing: "cubic-bezier(0.34, 1.2, 0.64, 1)",
};

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function keyframesFor(
  dir: Exclude<SlideDirection, "none">,
  distance: number,
): Keyframe[] {
  const from =
    dir === "right"
      ? `translateX(${distance}px)`
      : dir === "left"
        ? `translateX(${-distance}px)`
        : dir === "down"
          ? `translateY(${-distance}px)`
          : `translateY(${distance}px)`; // "up"
  return [
    { opacity: .2, transform: from },
    { opacity: 1, transform: "translate(0, 0)" },
  ];
}

export function usePageSlide(
  ref: RefObject<HTMLElement | null>,
  ordinal: number,
  options?: PageSlideOptions,
) {
  const { distance, duration, easing } = { ...DEFAULTS, ...options };
  const prevOrdinal = useRef(ordinal);
  const overrideDir = useRef<SlideDirection | null>(null);
  const animation = useRef<Animation | null>(null);

  useIsomorphicLayoutEffect(() => {
    const prev = prevOrdinal.current;
    if (ordinal === prev) return;
    const dir = overrideDir.current ?? (ordinal > prev ? "right" : "left");
    overrideDir.current = null;
    prevOrdinal.current = ordinal;

    const el = ref.current;
    if (!el || dir === "none" || prefersReducedMotion()) return;
    if (typeof el.animate !== "function") return;

    animation.current?.cancel();
    animation.current = el.animate(keyframesFor(dir, distance), {
      duration,
      easing,
    });
  }, [ordinal, ref, distance, duration, easing]);

  return {
    /** Seed the axis for the next page change (e.g. keyboard Up/Down). */
    setDirection(dir: SlideDirection) {
      overrideDir.current = dir;
    },
  };
}
