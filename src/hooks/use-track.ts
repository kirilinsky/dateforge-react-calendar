import { useEffect, useRef, useState } from "react";

const FRICTION = 0.86;
const SNAP_THRESHOLD = 8;
const SPRING_K = 0.18;
const SPRING_DAMP = 0.62;
const RUBBER_K = 0.12;
const RUBBER_DAMP = 0.5;
const SETTLE_PX = 0.4;
const WHEEL_DELTA_SCALE = 0.42;
const WHEEL_INERTIA_SCALE = 0.18;
const RELEASE_INERTIA_SCALE = 0.35;
const MAX_FRAME_VELOCITY = 18;

// Sticky physics for StepDrum — less inertia, harder snap, can't skip items.
const STICKY_FRICTION = 0.76;
const STICKY_SNAP_THRESHOLD = 14;
const STICKY_SPRING_K = 0.28;
const STICKY_SPRING_DAMP = 0.72;
const STICKY_WHEEL_INERTIA_SCALE = 0.08;
const STICKY_RELEASE_INERTIA_SCALE = 0.12;
const STICKY_MAX_FRAME_VELOCITY = 12;

interface UseTrackOptions {
  count?: number;
  initialIndex: number;
  snapKey?: unknown;
  pixelsPerItem?: number;
  axis?: "x" | "y";
  circular?: boolean;
  minIndex?: number;
  maxIndex?: number;
  rubberBand?: boolean;
  disabled?: boolean;
  sticky?: boolean;
  onChange: (index: number) => boolean | undefined;
  ref?: React.RefObject<HTMLDivElement | null>;
}

interface UseTrackReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  position: number; // float index (offset / pixelsPerItem)
  scrollTo: (targetIndex: number, options?: { animate?: boolean }) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: () => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  isInteracting: boolean;
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

export function useTrack({
  count,
  initialIndex,
  snapKey,
  pixelsPerItem = 52,
  axis = "x",
  circular = false,
  minIndex,
  maxIndex,
  rubberBand = true,
  disabled = false,
  sticky = false,
  onChange,
  ref: externalRef,
}: UseTrackOptions): UseTrackReturn {
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = externalRef ?? internalRef;
  const [position, setPosition] = useState(initialIndex);
  const [isInteracting, setIsInteracting] = useState(false);

  const opts = useRef({
    count,
    pixelsPerItem,
    axis,
    circular,
    minIndex,
    maxIndex,
    rubberBand,
    disabled,
    sticky,
    onChange,
  });
  opts.current = {
    count,
    pixelsPerItem,
    axis,
    circular,
    minIndex,
    maxIndex,
    rubberBand,
    disabled,
    sticky,
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
      rubberBand: rb,
    } = opts.current;
    const lo = mn ?? (c === undefined ? -Infinity : 0);
    const hi = mx ?? (c === undefined ? Infinity : c - 1);
    const bounded = mn !== undefined || mx !== undefined;
    const isCircular = circ && !bounded && c !== undefined;
    return { lo, hi, isCircular, c, ppi, rubberBand: rb };
  };

  const resolveIdx = (offset: number) => {
    const { lo, hi, isCircular, c, ppi } = getBounds();
    const raw = Math.round(offset / ppi);
    return isCircular && c !== undefined
      ? ((raw % c) + c) % c
      : clamp(raw, lo, hi);
  };

  const notifyIfChanged = (offset: number) => {
    const idx = resolveIdx(offset);
    if (p.current.snapped !== idx) {
      const prev = p.current.snapped;
      p.current.snapped = idx;
      if (p.current.fromGesture) navigator.vibrate?.(8);
      const accepted = opts.current.onChange(idx) !== false;
      if (!accepted) {
        // Hard stop: no syncTarget animation, instant return to last valid pos.
        const { ppi } = getBounds();
        p.current.snapped = prev;
        p.current.offset = prev * ppi;
        p.current.velocity = 0;
        p.current.syncTarget = null;
        setPosition(prev);
      }
    }
  };

  const isOffsetSnapped = () => {
    const { isCircular, c = 0, ppi } = getBounds();
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

  const normalizeIndex = (index: number) => {
    const { lo, hi, isCircular, c = 0 } = getBounds();
    return isCircular && c > 0 ? ((index % c) + c) % c : clamp(index, lo, hi);
  };

  const snapToIndex = (targetIndex: number) => {
    const { ppi } = getBounds();
    const idx = normalizeIndex(targetIndex);
    stopLoop();
    p.current.offset = idx * ppi;
    p.current.velocity = 0;
    p.current.syncTarget = null;
    p.current.snapped = idx;
    p.current.fromGesture = false;
    setPosition(idx);
  };

  const animate = () => {
    if (!p.current.isDragging) {
      const { lo, hi, isCircular, c = 0, ppi, rubberBand: rb } = getBounds();

      // Per-frame physics constants — sticky mode for drums, fluid for tracks.
      const s = opts.current.sticky;
      const friction = s ? STICKY_FRICTION : FRICTION;
      const snapThreshold = s ? STICKY_SNAP_THRESHOLD : SNAP_THRESHOLD;
      const springK = s ? STICKY_SPRING_K : SPRING_K;
      const springDamp = s ? STICKY_SPRING_DAMP : SPRING_DAMP;
      const maxFrameVel = s ? STICKY_MAX_FRAME_VELOCITY : MAX_FRAME_VELOCITY;

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

      p.current.velocity = clamp(
        p.current.velocity * friction,
        -maxFrameVel,
        maxFrameVel,
      );
      p.current.offset += p.current.velocity;

      if (!isCircular) {
        if (!rb) {
          const clampedOffset = clamp(p.current.offset, minOffset, maxOffset);
          if (clampedOffset !== p.current.offset) {
            p.current.offset = clampedOffset;
            p.current.velocity = 0;
          }
        } else if (p.current.offset < minOffset) {
          p.current.velocity += (minOffset - p.current.offset) * RUBBER_K;
          p.current.velocity *= RUBBER_DAMP;
        } else if (p.current.offset > maxOffset) {
          p.current.velocity += (maxOffset - p.current.offset) * RUBBER_K;
          p.current.velocity *= RUBBER_DAMP;
        } else if (Math.abs(p.current.velocity) < snapThreshold) {
          const idx = clamp(Math.round(p.current.offset / ppi), lo, hi);
          const target = idx * ppi;
          const diff = target - p.current.offset;
          p.current.velocity += diff * springK;
          p.current.velocity *= springDamp;
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

        if (Math.abs(p.current.velocity) < snapThreshold) {
          const rawIdx = p.current.offset / ppi;
          const idx = ((Math.round(rawIdx) % c) + c) % c;
          const target = idx * ppi;
          let diff = target - p.current.offset;
          if (diff > range / 2) diff -= range;
          if (diff < -range / 2) diff += range;
          p.current.velocity += diff * springK;
          p.current.velocity *= springDamp;
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
  const prevSnapKey = useRef(snapKey);
  const pendingInstantSync = useRef(false);
  useEffect(() => {
    const snapChanged = prevSnapKey.current !== snapKey;
    const initChanged = prevInit.current !== initialIndex;
    prevInit.current = initialIndex;
    prevSnapKey.current = snapKey;

    if (!initChanged) {
      if (snapChanged) pendingInstantSync.current = true;
      return;
    }

    if (snapChanged || pendingInstantSync.current) {
      pendingInstantSync.current = false;
      snapToIndex(initialIndex);
      return;
    }

    const { lo, hi, isCircular, c = 0, ppi } = getBounds();
    const idx = isCircular
      ? ((initialIndex % c) + c) % c
      : clamp(initialIndex, lo, hi);
    p.current.syncTarget = idx * ppi;
    p.current.velocity = 0;
    p.current.fromGesture = false;
    startLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialIndex, snapKey]);

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
        const { lo, hi, isCircular, c = 0, ppi, rubberBand: rb } = getBounds();
        const coordinate = opts.current.axis === "y" ? e.clientY : e.clientX;
        const delta = p.current.lastX - coordinate;
        p.current.lastX = coordinate;

        p.current.offset += delta;
        p.current.velocity = delta;

        if (!isCircular) {
          p.current.offset = clamp(
            p.current.offset,
            lo * ppi - (rb ? ppi : 0),
            hi * ppi + (rb ? ppi : 0),
          );
          if (
            !rb &&
            (p.current.offset === lo * ppi || p.current.offset === hi * ppi)
          ) {
            p.current.velocity = 0;
          }
        } else {
          const range = c * ppi;
          p.current.offset = ((p.current.offset % range) + range) % range;
        }

        notifyIfChanged(p.current.offset);
        setPosition(p.current.offset / ppi);
      },
      up: () => {
        const h = handlers.current;
        if (!h) return;
        p.current.isDragging = false;
        setIsInteracting(false);
        window.removeEventListener("pointermove", h.move);
        window.removeEventListener("pointerup", h.up);
        window.removeEventListener("pointercancel", h.up);
        const releaseScale = opts.current.sticky
          ? STICKY_RELEASE_INERTIA_SCALE
          : RELEASE_INERTIA_SCALE;
        p.current.velocity *= releaseScale;
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
      // Stop any in-flight RAF and null out the handlers ref so a late
      // pointerup (delivered after unmount) short-circuits instead of
      // scheduling a new animation frame on a dead component.
      stopLoop();
      handlers.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (opts.current.disabled) return;
    const h = handlers.current!;
    // Detach defensively in case a previous gesture left listeners attached.
    window.removeEventListener("pointermove", h.move);
    window.removeEventListener("pointerup", h.up);
    window.removeEventListener("pointercancel", h.up);

    p.current.isDragging = true;
    p.current.fromGesture = true;
    p.current.lastX = opts.current.axis === "y" ? e.clientY : e.clientX;
    p.current.velocity = 0;
    setIsInteracting(true);

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

  const scrollTo = (targetIndex: number, options?: { animate?: boolean }) => {
    if (opts.current.disabled) return;
    if (options?.animate === false) {
      snapToIndex(targetIndex);
      return;
    }
    const { lo, hi, isCircular, c = 0, ppi } = getBounds();
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
    let wheelTimer = 0;
    const handler = (e: WheelEvent) => {
      if (opts.current.disabled) return;
      // Pick the dominant axis. Mouse wheels only emit deltaY; trackpads emit
      // both. Either way, hijack scroll while the cursor is over the track.
      const useY =
        opts.current.axis === "y" || Math.abs(e.deltaY) > Math.abs(e.deltaX);
      const raw = useY ? e.deltaY : e.deltaX;
      if (raw === 0) return;
      e.preventDefault();

      const lineToPx = e.deltaMode === 1 ? 20 : e.deltaMode === 2 ? 300 : 1;
      const delta = raw * lineToPx * WHEEL_DELTA_SCALE;

      const { lo, hi, isCircular, c = 0, ppi, rubberBand: rb } = getBounds();
      setIsInteracting(true);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => setIsInteracting(false), 120);

      p.current.offset += delta;
      const inertiaScale = opts.current.sticky
        ? STICKY_WHEEL_INERTIA_SCALE
        : WHEEL_INERTIA_SCALE;
      p.current.velocity = delta * inertiaScale;

      if (!isCircular) {
        p.current.offset = clamp(
          p.current.offset,
          lo * ppi - (rb ? ppi : 0),
          hi * ppi + (rb ? ppi : 0),
        );
        if (
          !rb &&
          (p.current.offset === lo * ppi || p.current.offset === hi * ppi)
        ) {
          p.current.velocity = 0;
        }
      } else {
        const range = c * ppi;
        p.current.offset = ((p.current.offset % range) + range) % range;
      }

      notifyIfChanged(p.current.offset);
      setPosition(p.current.offset / ppi);
      if (shouldKeepAnimating()) startLoop();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => {
      window.clearTimeout(wheelTimer);
      el.removeEventListener("wheel", handler);
    };
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
    isInteracting,
  };
}
