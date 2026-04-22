import { useEffect, useRef, useState } from "react";

const FRICTION = 0.95; // inertia decay — high = long glide
const SNAP_THRESHOLD = 3.5; // px/frame — catch earlier for visible overshoot
const SPRING_K = 0.08; // spring stiffness
const SPRING_DAMP = 0.82; // underdamped (< critical) → bouncy overshoot
const RUBBER_K = 0.12; // boundary spring stiffness
const RUBBER_DAMP = 0.75; // boundary damping
const SETTLE_PX = 0.4; // close enough to consider settled

interface UseTrackOptions {
  count: number;
  initialIndex: number;
  pixelsPerItem?: number;
  circular?: boolean;
  minIndex?: number;
  maxIndex?: number;
  onChange: (index: number) => void;
}

export interface UseTrackReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  position: number; // float index (offset / pixelsPerItem)
  scrollTo: (targetIndex: number) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function useTrack({
  count,
  initialIndex,
  pixelsPerItem = 52,
  circular = false,
  minIndex,
  maxIndex,
  onChange,
}: UseTrackOptions): UseTrackReturn {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(initialIndex);

  const opts = useRef({
    count,
    pixelsPerItem,
    circular,
    minIndex,
    maxIndex,
    onChange,
  });
  opts.current = {
    count,
    pixelsPerItem,
    circular,
    minIndex,
    maxIndex,
    onChange,
  };

  const p = useRef({
    offset: initialIndex * pixelsPerItem, // position in px
    velocity: 0, // px/frame
    isDragging: false,
    lastX: 0,
    snapped: initialIndex,
  });

  const getBounds = () => {
    const {
      count: c,
      pixelsPerItem: ppi,
      circular: circ,
      minIndex: mn,
      maxIndex: mx,
    } = opts.current;
    const lo = mn ?? 0;
    const hi = mx ?? c - 1;
    const bounded = mn !== undefined || mx !== undefined;
    const isCircular = circ && !bounded;
    return { lo, hi, isCircular, c, ppi };
  };

  const resolveIdx = (offset: number) => {
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const raw = Math.round(offset / ppi);
    return isCircular ? ((raw % c) + c) % c : clamp(raw, lo, hi);
  };

  const notifyIfChanged = (offset: number) => {
    const idx = resolveIdx(offset);
    if (p.current.snapped !== idx) {
      p.current.snapped = idx;
      navigator.vibrate?.(8);
      opts.current.onChange(idx);
    }
  };

  // always-running animation loop — reads everything through refs
  useEffect(() => {
    const animate = () => {
      if (!p.current.isDragging) {
        const { lo, hi, isCircular, c, ppi } = getBounds();
        const minOffset = lo * ppi;
        const maxOffset = hi * ppi;

        p.current.velocity *= FRICTION;
        p.current.offset += p.current.velocity;

        if (!isCircular) {
          if (p.current.offset < minOffset) {
            // rubber-band: spring back to lower bound
            p.current.velocity += (minOffset - p.current.offset) * RUBBER_K;
            p.current.velocity *= RUBBER_DAMP;
          } else if (p.current.offset > maxOffset) {
            // rubber-band: spring back to upper bound
            p.current.velocity += (maxOffset - p.current.offset) * RUBBER_K;
            p.current.velocity *= RUBBER_DAMP;
          } else if (Math.abs(p.current.velocity) < SNAP_THRESHOLD) {
            const idx = clamp(Math.round(p.current.offset / ppi), lo, hi);
            const target = idx * ppi;
            const diff = target - p.current.offset;
            p.current.velocity += diff * SPRING_K;
            p.current.velocity *= SPRING_DAMP;
            if (
              Math.abs(diff) < SETTLE_PX &&
              Math.abs(p.current.velocity) < SETTLE_PX
            ) {
              p.current.offset = target;
              p.current.velocity = 0;
            }
          }
        } else {
          // circular: keep offset in [0, count * ppi), spring snap when slow
          const range = c * ppi;
          p.current.offset = ((p.current.offset % range) + range) % range;

          if (Math.abs(p.current.velocity) < SNAP_THRESHOLD) {
            const rawIdx = p.current.offset / ppi;
            const idx = ((Math.round(rawIdx) % c) + c) % c;
            const target = idx * ppi;
            // shortest path through wrap
            let diff = target - p.current.offset;
            if (diff > range / 2) diff -= range;
            if (diff < -range / 2) diff += range;
            p.current.velocity += diff * SPRING_K;
            p.current.velocity *= SPRING_DAMP;
            if (
              Math.abs(diff) < SETTLE_PX &&
              Math.abs(p.current.velocity) < SETTLE_PX
            ) {
              p.current.offset = target;
              p.current.velocity = 0;
            }
          }
        }

        notifyIfChanged(p.current.offset);
        setPosition(p.current.offset / opts.current.pixelsPerItem);
      }

      rafId = requestAnimationFrame(animate);
    };

    let rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync when initialIndex changes externally (e.g. month change, external date selection)
  const prevInit = useRef(initialIndex);
  useEffect(() => {
    if (prevInit.current === initialIndex) return;
    prevInit.current = initialIndex;
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const idx = isCircular
      ? ((initialIndex % c) + c) % c
      : clamp(initialIndex, lo, hi);
    p.current.offset = idx * ppi;
    p.current.velocity = 0;
    p.current.snapped = idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  const prevPpi = useRef(pixelsPerItem);
  useEffect(() => {
    if (prevPpi.current === pixelsPerItem) return;
    const oldPpi = prevPpi.current;
    prevPpi.current = pixelsPerItem;
    p.current.offset = (p.current.offset / oldPpi) * pixelsPerItem;
    p.current.velocity = (p.current.velocity / oldPpi) * pixelsPerItem;
  }, [pixelsPerItem]);

  const onPointerDown = (e: React.PointerEvent) => {
    p.current.isDragging = true;
    p.current.lastX = e.clientX;
    p.current.velocity = 0;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!p.current.isDragging) return;
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const delta = p.current.lastX - e.clientX;
    p.current.lastX = e.clientX;

    p.current.offset += delta;
    p.current.velocity = delta; // hand off momentum on release

    if (!isCircular) {
      p.current.offset = clamp(
        p.current.offset,
        lo * ppi - ppi,
        hi * ppi + ppi,
      );
    } else {
      const range = c * ppi;
      p.current.offset = ((p.current.offset % range) + range) % range;
    }

    notifyIfChanged(p.current.offset);
    setPosition(p.current.offset / ppi);
  };

  const onPointerUp = () => {
    p.current.isDragging = false;
  };

  const scrollTo = (targetIndex: number) => {
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const idx = isCircular
      ? ((targetIndex % c) + c) % c
      : clamp(targetIndex, lo, hi);
    const targetOffset = idx * ppi;
    const diff = targetOffset - p.current.offset;
    p.current.velocity += clamp(diff * 0.15, -30, 30);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta =
        e.deltaMode === 1 ? raw * 20 : e.deltaMode === 2 ? raw * 300 : raw;
      p.current.velocity += delta * 0.08;
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ref,
    position,
    scrollTo,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel: onPointerUp,
  };
}
