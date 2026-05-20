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

  const syncDateT = syncDate?.getTime();
  useEffect(() => {
    if (syncDate) setFocusedDate(syncDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncDateT]);

  // When the visible month changes (e.g. user clicked Nav prev/next, or any
  // other module called `navigateTo`), make sure `focusedDate` still falls
  // inside the visible month. Otherwise no cell carries `tabIndex={0}` and
  // Tab from outside the grid skips it entirely. Keyboard nav inside the
  // grid is unaffected — `moveFocus` already keeps focusedDate's month in
  // sync with viewDate.
  const viewMonth = viewDate.getMonth();
  const viewYear = viewDate.getFullYear();
  useEffect(() => {
    setFocusedDate((prev) =>
      prev.getMonth() === viewMonth && prev.getFullYear() === viewYear
        ? prev
        : viewDate,
    );
  }, [viewMonth, viewYear, viewDate]);

  useEffect(() => {
    if (!shouldFocusRef.current) return;
    shouldFocusRef.current = false;
    gridRef.current?.querySelector<HTMLElement>('[tabindex="0"]')?.focus();
  });

  // TODO: accept an optional isHidden(date) predicate so arrow keys skip over
  // out-of-range cells when CalendarDays runs with hideOutOfRange. Today the
  // workaround is to pair hideOutOfRange with blockNavigation.
  const moveFocus = useCallback(
    (next: Date) => {
      const leavesMonth =
        next.getMonth() !== viewDate.getMonth() ||
        next.getFullYear() !== viewDate.getFullYear();
      if (blockNavigation && leavesMonth) return;
      shouldFocusRef.current = true;
      setFocusedDate(next);
      if (leavesMonth) {
        navigateTo(
          new Date(
            next.getFullYear(),
            next.getMonth(),
            1,
            viewDate.getHours(),
            viewDate.getMinutes(),
            viewDate.getSeconds(),
          ),
        );
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
