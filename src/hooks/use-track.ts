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
  ref?: React.RefObject<HTMLDivElement | null>;
}

interface UseTrackReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  position: number; // float index (offset / pixelsPerItem)
  scrollTo: (targetIndex: number) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: () => void;
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
  ref: externalRef,
}: UseTrackOptions): UseTrackReturn {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = externalRef ?? internalRef;
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
    offset: initialIndex * pixelsPerItem,
    velocity: 0,
    isDragging: false,
    lastX: 0,
    snapped: initialIndex,
    syncTarget: null as number | null,
    fromGesture: false,
  });
  const rafId = useRef<number | null>(null);

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
      if (p.current.fromGesture) navigator.vibrate?.(8);
      opts.current.onChange(idx);
    }
  };

  const isOffsetSnapped = () => {
    const { isCircular, c, ppi } = getBounds();
    const target = resolveIdx(p.current.offset) * ppi;
    const diff = Math.abs(target - p.current.offset);
    if (!isCircular) return diff < SETTLE_PX;
    const range = c * ppi;
    return Math.min(diff, range - diff) < SETTLE_PX;
  };

  const shouldKeepAnimating = () =>
    p.current.isDragging ||
    p.current.syncTarget !== null ||
    p.current.velocity !== 0 ||
    !isOffsetSnapped();

  const stopLoop = () => {
    if (rafId.current === null) return;
    cancelAnimationFrame(rafId.current);
    rafId.current = null;
  };

  const animate = () => {
    if (!p.current.isDragging) {
      const { lo, hi, isCircular, c, ppi } = getBounds();

      if (p.current.syncTarget !== null) {
        const range = c * ppi;
        let target = p.current.syncTarget;
        if (isCircular) {
          let diff = target - p.current.offset;
          if (diff > range / 2) diff -= range;
          if (diff < -range / 2) diff += range;
          target = p.current.offset + diff;
        }
        const diff = target - p.current.offset;
        p.current.offset += diff * 0.18;
        p.current.velocity = 0;
        if (isCircular) {
          p.current.offset = ((p.current.offset % range) + range) % range;
        }
        if (Math.abs(diff) < SETTLE_PX) {
          p.current.offset = isCircular
            ? ((p.current.syncTarget % range) + range) % range
            : p.current.syncTarget;
          p.current.syncTarget = null;
        }
        p.current.snapped = resolveIdx(p.current.offset);
        setPosition(p.current.offset / ppi);
        rafId.current = shouldKeepAnimating()
          ? requestAnimationFrame(animate)
          : null;
        return;
      }

      const minOffset = lo * ppi;
      const maxOffset = hi * ppi;

      p.current.velocity *= FRICTION;
      p.current.offset += p.current.velocity;

      if (!isCircular) {
        if (p.current.offset < minOffset) {
          p.current.velocity += (minOffset - p.current.offset) * RUBBER_K;
          p.current.velocity *= RUBBER_DAMP;
        } else if (p.current.offset > maxOffset) {
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
        const range = c * ppi;
        p.current.offset = ((p.current.offset % range) + range) % range;

        if (Math.abs(p.current.velocity) < SNAP_THRESHOLD) {
          const rawIdx = p.current.offset / ppi;
          const idx = ((Math.round(rawIdx) % c) + c) % c;
          const target = idx * ppi;
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

    rafId.current = shouldKeepAnimating()
      ? requestAnimationFrame(animate)
      : null;
  };

  const startLoop = () => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    return stopLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevInit = useRef(initialIndex);
  useEffect(() => {
    if (prevInit.current === initialIndex) return;
    prevInit.current = initialIndex;
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const idx = isCircular
      ? ((initialIndex % c) + c) % c
      : clamp(initialIndex, lo, hi);
    p.current.syncTarget = idx * ppi;
    p.current.velocity = 0;
    p.current.fromGesture = false;
    startLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex]);

  const prevPpi = useRef(pixelsPerItem);
  useEffect(() => {
    if (prevPpi.current === pixelsPerItem) return;
    const oldPpi = prevPpi.current;
    prevPpi.current = pixelsPerItem;
    p.current.offset = (p.current.offset / oldPpi) * pixelsPerItem;
    p.current.velocity = (p.current.velocity / oldPpi) * pixelsPerItem;
    if (shouldKeepAnimating()) startLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pixelsPerItem]);

  // Stable window-level handlers, set up once on mount.
  // Reason: relying on React's onPointerMove/Up on the element itself loses
  // events the moment the cursor leaves the element bounds — leaving isDragging
  // stuck at true. Window listeners catch the pointerup wherever it happens.
  const handlers = useRef<{
    move: (e: PointerEvent) => void;
    up: () => void;
  } | null>(null);
  if (!handlers.current) {
    handlers.current = {
      move: (e: PointerEvent) => {
        if (!p.current.isDragging) return;
        const { lo, hi, isCircular, c, ppi } = getBounds();
        const delta = p.current.lastX - e.clientX;
        p.current.lastX = e.clientX;

        p.current.offset += delta;
        p.current.velocity = delta;

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
      },
      up: () => {
        p.current.isDragging = false;
        const h = handlers.current!;
        window.removeEventListener("pointermove", h.move);
        window.removeEventListener("pointerup", h.up);
        window.removeEventListener("pointercancel", h.up);
        startLoop();
      },
    };
  }

  // Cleanup window listeners on unmount.
  useEffect(() => {
    return () => {
      const h = handlers.current;
      if (!h) return;
      window.removeEventListener("pointermove", h.move);
      window.removeEventListener("pointerup", h.up);
      window.removeEventListener("pointercancel", h.up);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const h = handlers.current!;
    // Detach defensively in case a previous gesture left listeners attached.
    window.removeEventListener("pointermove", h.move);
    window.removeEventListener("pointerup", h.up);
    window.removeEventListener("pointercancel", h.up);

    p.current.isDragging = true;
    p.current.fromGesture = true;
    p.current.lastX = e.clientX;
    p.current.velocity = 0;

    window.addEventListener("pointermove", h.move);
    window.addEventListener("pointerup", h.up);
    window.addEventListener("pointercancel", h.up);
    startLoop();
  };

  const onPointerMove = () => {
    // No-op: handled at window level.
  };

  const onPointerUp = () => {
    // No-op: handled at window level.
  };

  const scrollTo = (targetIndex: number) => {
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const idx = isCircular
      ? ((targetIndex % c) + c) % c
      : clamp(targetIndex, lo, hi);
    const targetOffset = idx * ppi;
    const diff = targetOffset - p.current.offset;
    p.current.velocity += clamp(diff * 0.15, -30, 30);
    startLoop();
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      // Pick the dominant axis. Mouse wheels only emit deltaY; trackpads emit
      // both. Either way, hijack scroll while the cursor is over the track.
      const useY = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      const raw = useY ? e.deltaY : e.deltaX;
      if (raw === 0) return;
      e.preventDefault();

      const lineToPx = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 300 : 1;
      const delta = raw * lineToPx;

      const { lo, hi, isCircular, c, ppi } = getBounds();

      // Direct offset push — feels like real scroll. Velocity carries small
      // residual for inertia after the wheel stops.
      p.current.offset += delta;
      p.current.velocity = delta * 0.6;

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
      startLoop();
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
