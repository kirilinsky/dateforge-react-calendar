import { useEffect, useState } from "react";

export function useItemWidth(
  ref: React.RefObject<HTMLElement | null>,
  initialWidth: number,
  selector = "[data-item]",
): number {
  const [itemWidth, setItemWidth] = useState(initialWidth);

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const container = ref.current;
    if (!container) return;
    const measure = () => {
      const el = container.querySelector(selector) as HTMLElement | null;
      if (el) setItemWidth(el.offsetWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [ref, selector]);

  return itemWidth;
}
