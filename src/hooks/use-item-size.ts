import { useEffect, useState } from "react";

type Axis = "width" | "height";

/**
 * Measures the offset size of the first descendant matching `selector` inside
 * `ref.current` and keeps it in sync via `ResizeObserver`. Returns `initial`
 * until the element resolves (handles SSR + first paint).
 */
export function useItemSize(
  ref: React.RefObject<HTMLElement | null>,
  axis: Axis,
  initial: number,
  selector = "[data-item]",
): number {
  const [size, setSize] = useState(initial);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const container = ref.current;
    if (!container) return;
    const prop = axis === "width" ? "offsetWidth" : "offsetHeight";
    const measure = () => {
      const el = container.querySelector(selector) as HTMLElement | null;
      const next = el?.[prop] ?? 0;
      if (next > 0) setSize(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [ref, axis, selector]);

  return size;
}
