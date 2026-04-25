import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCalendarKeyboard } from "@/hooks/use-calendar-keyboard";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const base = {
  viewDate: d(2024, 6, 15),
  initialFocusDate: d(2024, 6, 15),
  syncDate: null as Date | null,
  startOfWeek: 1,
  navigateTo: vi.fn(),
  onSelect: vi.fn(),
};

function makeKeyEvent(key: string, extra?: Partial<KeyboardEvent>) {
  return {
    key,
    preventDefault: vi.fn(),
    shiftKey: false,
    ...extra,
  } as unknown as React.KeyboardEvent;
}

describe("useCalendarKeyboard", () => {
  it("initialises focusedDate from initialFocusDate", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    expect(result.current.focusedDate.getTime()).toBe(base.initialFocusDate.getTime());
  });

  it("ArrowRight moves +1 day", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowRight"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(16);
  });

  it("ArrowLeft moves -1 day", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowLeft"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(14);
  });

  it("ArrowDown moves +7 days", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowDown"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(22);
  });

  it("ArrowUp moves -7 days", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("ArrowUp"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(8);
  });

  it("Enter calls onSelect with the date", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCalendarKeyboard({ ...base, onSelect }));
    const date = d(2024, 6, 15);
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("Enter"), date);
    });
    expect(onSelect).toHaveBeenCalledWith(date);
  });

  it("Space calls onSelect with the date", () => {
    const onSelect = vi.fn();
    const { result } = renderHook(() => useCalendarKeyboard({ ...base, onSelect }));
    const date = d(2024, 6, 15);
    act(() => {
      result.current.handleKeyDown(makeKeyEvent(" "), date);
    });
    expect(onSelect).toHaveBeenCalledWith(date);
  });

  it("PageDown moves +1 month", () => {
    const navigateTo = vi.fn();
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, navigateTo }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("PageDown"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getMonth()).toBe(6); // July
  });

  it("PageUp moves -1 month", () => {
    const navigateTo = vi.fn();
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, navigateTo }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("PageUp"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getMonth()).toBe(4); // May
  });

  it("Shift+PageDown moves +1 year", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    act(() => {
      result.current.handleKeyDown(
        makeKeyEvent("PageDown", { shiftKey: true }),
        d(2024, 6, 15),
      );
    });
    expect(result.current.focusedDate.getFullYear()).toBe(2025);
  });

  it("navigateTo called when focus leaves current month", () => {
    const navigateTo = vi.fn();
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, navigateTo, viewDate: d(2024, 6, 15) }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("PageDown"), d(2024, 6, 15));
    });
    expect(navigateTo).toHaveBeenCalled();
  });

  it("blockNavigation=true prevents leaving month via PageDown", () => {
    const navigateTo = vi.fn();
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, navigateTo, blockNavigation: true }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("PageDown"), d(2024, 6, 15));
    });
    expect(navigateTo).not.toHaveBeenCalled();
  });

  it("syncDate change updates focusedDate", () => {
    let syncDate: Date | null = null;
    const { result, rerender } = renderHook(() =>
      useCalendarKeyboard({ ...base, syncDate }),
    );
    const newDate = d(2024, 8, 5);
    act(() => { syncDate = newDate; });
    rerender();
    expect(result.current.focusedDate.getTime()).toBe(newDate.getTime());
  });

  it("Home moves to start of week (Mon=startOfWeek=1)", () => {
    // 2024-06-15 is Saturday; Mon of that week is 2024-06-10
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, startOfWeek: 1 }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("Home"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(10);
  });

  it("End moves to end of week", () => {
    // 2024-06-15 is Saturday; Sun of that week is 2024-06-16
    const { result } = renderHook(() =>
      useCalendarKeyboard({ ...base, startOfWeek: 1 }),
    );
    act(() => {
      result.current.handleKeyDown(makeKeyEvent("End"), d(2024, 6, 15));
    });
    expect(result.current.focusedDate.getDate()).toBe(16);
  });

  it("returns gridRef", () => {
    const { result } = renderHook(() => useCalendarKeyboard({ ...base }));
    expect(result.current.gridRef).toBeDefined();
  });
});
