import { useCallback, useEffect, useRef, useState } from "react";

interface UseRovingTileFocusArgs {
  itemCount: number;
  activeIndex?: number;
  itemSelector?: string;
}

const DEFAULT_SELECTOR = "[data-roving-tile]";

const clampIndex = (index: number, count: number) =>
  Math.max(0, Math.min(index, Math.max(0, count - 1)));

const isNavigable = (el: HTMLElement) => {
  if (el.hasAttribute("disabled")) return false;
  if (el.getAttribute("aria-hidden") === "true") return false;
  if (el.hidden) return false;
  return getComputedStyle(el).visibility !== "hidden";
};

const centerX = (rect: DOMRect) => rect.left + rect.width / 2;

const nearestVertical = (
  current: HTMLElement,
  candidates: HTMLElement[],
  dir: -1 | 1,
) => {
  const currentRect = current.getBoundingClientRect();
  const currentCenter = centerX(currentRect);
  let best: { el: HTMLElement; score: number } | null = null;

  for (const el of candidates) {
    if (el === current) continue;
    const rect = el.getBoundingClientRect();
    const isAfter =
      dir > 0 ? rect.top > currentRect.top : rect.top < currentRect.top;
    if (!isAfter) continue;
    const verticalDistance =
      dir > 0 ? rect.top - currentRect.top : currentRect.top - rect.top;
    const horizontalDistance = Math.abs(centerX(rect) - currentCenter);
    const score = verticalDistance * 1000 + horizontalDistance;
    if (!best || score < best.score) best = { el, score };
  }

  return best?.el ?? null;
};

export function useRovingTileFocus({
  itemCount,
  activeIndex = 0,
  itemSelector = DEFAULT_SELECTOR,
}: UseRovingTileFocusArgs) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(() =>
    clampIndex(activeIndex, itemCount),
  );
  const shouldFocusRef = useRef(false);

  useEffect(() => {
    setFocusIndex(clampIndex(activeIndex, itemCount));
  }, [activeIndex, itemCount]);

  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    containerRef.current
      ?.querySelector<HTMLElement>(`[data-roving-index="${focusIndex}"]`)
      ?.focus();
  }, [focusIndex]);

  const getItems = useCallback(
    () =>
      Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>(itemSelector) ?? [],
      ).filter(isNavigable),
    [itemSelector],
  );

  const moveTo = useCallback(
    (next: HTMLElement | null) => {
      if (!next) return;
      const index = Number(next.dataset.rovingIndex);
      if (!Number.isInteger(index)) return;
      shouldFocusRef.current = true;
      setFocusIndex(clampIndex(index, itemCount));
    },
    [itemCount],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        e.key !== "ArrowLeft" &&
        e.key !== "ArrowRight" &&
        e.key !== "ArrowUp" &&
        e.key !== "ArrowDown" &&
        e.key !== "Home" &&
        e.key !== "End"
      ) {
        return;
      }

      const target = e.target as HTMLElement | null;
      const current = target?.closest<HTMLElement>(itemSelector);
      if (!current || !containerRef.current?.contains(current)) return;

      const items = getItems();
      const currentPosition = items.indexOf(current);
      if (currentPosition < 0) return;

      e.preventDefault();

      if (e.key === "Home") {
        moveTo(items[0] ?? null);
        return;
      }
      if (e.key === "End") {
        moveTo(items[items.length - 1] ?? null);
        return;
      }
      if (e.key === "ArrowLeft") {
        moveTo(items[currentPosition - 1] ?? null);
        return;
      }
      if (e.key === "ArrowRight") {
        moveTo(items[currentPosition + 1] ?? null);
        return;
      }

      moveTo(nearestVertical(current, items, e.key === "ArrowDown" ? 1 : -1));
    },
    [getItems, itemSelector, moveTo],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      "data-roving-tile": "",
      "data-roving-index": index,
      tabIndex: index === focusIndex ? 0 : -1,
    }),
    [focusIndex],
  );

  return { containerRef, handleKeyDown, getItemProps };
}
