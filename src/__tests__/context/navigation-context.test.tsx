import { act, renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { useNavigation } from "@/context/navigation-context";
import { CalendarProvider } from "@/core/provider";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const wrap =
  (
    props: Omit<React.ComponentProps<typeof CalendarProvider>, "children"> = {},
  ) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(CalendarProvider, { ...props, children });

describe("useNavigation", () => {
  it("viewDate initialises from value", () => {
    const date = d(2024, 6, 15);
    const { result } = renderHook(() => useNavigation(), {
      wrapper: wrap({ value: date }),
    });
    expect(result.current.viewDate.getMonth()).toBe(5); // June = 5
    expect(result.current.viewDate.getFullYear()).toBe(2024);
  });

  it("viewDate defaults to today when no value", () => {
    const { result } = renderHook(() => useNavigation(), { wrapper: wrap() });
    const now = new Date();
    expect(result.current.viewDate.getFullYear()).toBe(now.getFullYear());
    expect(result.current.viewDate.getMonth()).toBe(now.getMonth());
  });

  it("navigateTo updates viewDate", () => {
    const { result } = renderHook(() => useNavigation(), { wrapper: wrap() });
    const target = d(2025, 3, 1);
    act(() => result.current.navigateTo(target));
    expect(result.current.viewDate.getTime()).toBe(target.getTime());
  });

  it("navigateTo is a function", () => {
    const { result } = renderHook(() => useNavigation(), { wrapper: wrap() });
    expect(typeof result.current.navigateTo).toBe("function");
  });

  it("viewDate reflects range start when mode=range with value", () => {
    const from = d(2024, 3, 10);
    const to = d(2024, 3, 25);
    const { result } = renderHook(() => useNavigation(), {
      wrapper: wrap({ mode: "range", value: { from, to } } as any),
    });
    expect(result.current.viewDate.getMonth()).toBe(2); // March = 2
  });
});
