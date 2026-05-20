import { useEffect, useRef, useState } from "react";

interface UseScrollAccumulatorOptions {
  wheelThreshold?: number;
  touchThreshold?: number;
  dragThreshold?: number;
  requireHover?: boolean;
  disabled?: boolean;
}

interface UseScrollAccumulatorReturn {
  dragOffset: number;
  isDragging: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function useScrollAccumulator(
  ref: React.RefObject<HTMLElement | null>,
  onStep: (dir: 1 | -1) => void,
  {
    wheelThreshold = 40,
    touchThreshold = 28,
    dragThreshold = touchThreshold,
    requireHover = false,
    disabled = false,
  }: UseScrollAccumulatorOptions = {},
): UseScrollAccumulatorReturn {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const stepRef = useRef(onStep);
  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (disabled) {
      setDragOffset(0);
      setIsDragging(false);
      return;
    }
    const isHovered = { current: false };

    const onEnter = () => {
      isHovered.current = true;
    };
    const onLeave = () => {
      isHovered.current = false;
    };
    if (requireHover) {
      el.addEventListener("mouseenter", onEnter);
      el.addEventListener("mouseleave", onLeave);
    }

    const clearVisualOffset = () => {
      setIsDragging(false);
      setDragOffset(0);
    };

    const applySignedDelta = (
      accum: { current: number },
      signedDelta: number,
      threshold: number,
    ) => {
      accum.current += signedDelta;
      while (Math.abs(accum.current) >= threshold) {
        const dir = accum.current > 0 ? 1 : -1;
        accum.current -= dir * threshold;
        stepRef.current(dir);
      }
      setDragOffset(clamp(accum.current / threshold, -0.95, 0.95));
    };

    const releaseRemainder = (
      accum: { current: number },
      threshold: number,
      commitRatio = 0.35,
    ) => {
      if (Math.abs(accum.current) >= threshold * commitRatio) {
        stepRef.current(accum.current > 0 ? 1 : -1);
      }
      accum.current = 0;
      clearVisualOffset();
    };

    const wheelAccum = { current: 0 };
    const wheelReset = { current: 0 };
    const onWheel = (e: WheelEvent) => {
      if (requireHover && !isHovered.current) return;
      e.preventDefault();
      setIsDragging(true);
      applySignedDelta(wheelAccum, e.deltaY, wheelThreshold);
      window.clearTimeout(wheelReset.current);
      wheelReset.current = window.setTimeout(() => {
        wheelAccum.current = 0;
        clearVisualOffset();
      }, 90);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    const touchStartY = { current: null as number | null };
    const touchAccum = { current: 0 };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchAccum.current = 0;
      setIsDragging(true);
      setDragOffset(0);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      e.preventDefault();
      const delta = e.touches[0].clientY - touchStartY.current;
      touchStartY.current = e.touches[0].clientY;
      applySignedDelta(touchAccum, -delta, dragThreshold);
    };
    const onTouchEnd = () => {
      touchStartY.current = null;
      releaseRemainder(touchAccum, dragThreshold);
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    const pointerLastY = { current: null as number | null };
    const pointerAccum = { current: 0 };
    const endPointerDrag = () => {
      pointerLastY.current = null;
      releaseRemainder(pointerAccum, dragThreshold);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointerDrag);
      window.removeEventListener("pointercancel", endPointerDrag);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (pointerLastY.current === null) return;
      e.preventDefault();
      const delta = e.clientY - pointerLastY.current;
      pointerLastY.current = e.clientY;
      applySignedDelta(pointerAccum, -delta, dragThreshold);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (
        e.pointerType &&
        e.pointerType !== "mouse" &&
        e.pointerType !== "pen"
      ) {
        return;
      }
      e.preventDefault();
      pointerLastY.current = e.clientY;
      pointerAccum.current = 0;
      setIsDragging(true);
      setDragOffset(0);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointerDrag);
      window.removeEventListener("pointercancel", endPointerDrag);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endPointerDrag);
      window.addEventListener("pointercancel", endPointerDrag);
    };
    el.addEventListener("pointerdown", onPointerDown);

    return () => {
      if (requireHover) {
        el.removeEventListener("mouseenter", onEnter);
        el.removeEventListener("mouseleave", onLeave);
      }
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endPointerDrag);
      window.removeEventListener("pointercancel", endPointerDrag);
      window.clearTimeout(wheelReset.current);
    };
  }, [
    ref,
    disabled,
    dragThreshold,
    requireHover,
    touchThreshold,
    wheelThreshold,
  ]);

  return { dragOffset, isDragging };
}
