import { useCallback, useEffect, useRef, useState } from "react";

interface UseCalendarKeyboardArgs {
  viewDate: Date;
  initialFocusDate: Date;
  syncDate: Date | null;
  startOfWeek: number;
  blockNavigation?: boolean;
  navigateTo: (d: Date) => void;
  onSelect: (d: Date) => void;
}

export function useCalendarKeyboard({
  viewDate,
  initialFocusDate,
  syncDate,
  startOfWeek,
  blockNavigation = false,
  navigateTo,
  onSelect,
}: UseCalendarKeyboardArgs) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [focusedDate, setFocusedDate] = useState<Date>(() => initialFocusDate);
  const shouldFocusRef = useRef(false);

  // sync from external selection (click) — no DOM focus move
  const syncDateT = syncDate?.getTime();
  useEffect(() => {
    if (syncDate) setFocusedDate(syncDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncDateT]);

  // move DOM focus after keyboard navigation
  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  const moveFocus = useCallback(
    (next: Date) => {
      const leavesMonth =
        next.getMonth() !== viewDate.getMonth() ||
        next.getFullYear() !== viewDate.getFullYear();
      if (blockNavigation && leavesMonth) return;
      shouldFocusRef.current = true;
      setFocusedDate(next);
      if (leavesMonth) {
        navigateTo(new Date(next.getFullYear(), next.getMonth(), 1));
      }
    },
    [viewDate, navigateTo, blockNavigation],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, date: Date) => {
      const d = new Date(date);
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          moveFocus(new Date(d.setDate(d.getDate() - 1)));
          break;
        case "ArrowRight":
          e.preventDefault();
          moveFocus(new Date(d.setDate(d.getDate() + 1)));
          break;
        case "ArrowUp":
          e.preventDefault();
          moveFocus(new Date(d.setDate(d.getDate() - 7)));
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocus(new Date(d.setDate(d.getDate() + 7)));
          break;
        case "Home": {
          e.preventDefault();
          const daysFromStart = (d.getDay() - startOfWeek + 7) % 7;
          moveFocus(new Date(d.setDate(d.getDate() - daysFromStart)));
          break;
        }
        case "End": {
          e.preventDefault();
          const daysFromStart = (d.getDay() - startOfWeek + 7) % 7;
          moveFocus(new Date(d.setDate(d.getDate() + (6 - daysFromStart))));
          break;
        }
        case "PageUp":
          if (blockNavigation) break;
          e.preventDefault();
          moveFocus(
            e.shiftKey
              ? new Date(d.setFullYear(d.getFullYear() - 1))
              : new Date(d.setMonth(d.getMonth() - 1)),
          );
          break;
        case "PageDown":
          if (blockNavigation) break;
          e.preventDefault();
          moveFocus(
            e.shiftKey
              ? new Date(d.setFullYear(d.getFullYear() + 1))
              : new Date(d.setMonth(d.getMonth() + 1)),
          );
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          onSelect(date);
          break;
      }
    },
    [moveFocus, onSelect, startOfWeek],
  );

  return { gridRef, focusedDate, handleKeyDown };
}
