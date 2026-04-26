import { useEffect, useRef } from "react";

interface UseScrollAccumulatorOptions {
  wheelThreshold?: number;
  touchThreshold?: number;
  requireHover?: boolean;
}

export function useScrollAccumulator(
  ref: React.RefObject<HTMLElement | null>,
  onStep: (dir: 1 | -1) => void,
  {
    wheelThreshold = 40,
    touchThreshold = 28,
    requireHover = false,
  }: UseScrollAccumulatorOptions = {},
): void {
  const stepRef = useRef(onStep);
  useEffect(() => { stepRef.current = onStep; }, [onStep]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const isHovered = { current: false };

    const onEnter = () => { isHovered.current = true; };
    const onLeave = () => { isHovered.current = false; };
    if (requireHover) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    }

    const wheelAccum = { current: 0 };
    const onWheel = (e: WheelEvent) => {
      if (requireHover && !isHovered.current) return;
      e.preventDefault();
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) < wheelThreshold) return;
      const dir = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      stepRef.current(dir);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    const touchStartY = { current: null as number | null };
    const touchAccum = { current: 0 };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchAccum.current = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      e.preventDefault();
      const delta = e.touches[0].clientY - touchStartY.current;
      touchAccum.current -= delta;
      touchStartY.current = e.touches[0].clientY;
      if (Math.abs(touchAccum.current) < touchThreshold) return;
      const dir = touchAccum.current > 0 ? 1 : -1;
      touchAccum.current = 0;
      stepRef.current(dir);
    };
    const onTouchEnd = () => {
      touchStartY.current = null;
      touchAccum.current = 0;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      if (requireHover) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      }
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);
}
