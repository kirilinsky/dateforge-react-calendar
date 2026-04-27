import { renderHook } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { useConfig } from "@/context/config-context";
import { CalendarProvider } from "@/core/provider";

const wrap =
  (
    props: Omit<React.ComponentProps<typeof CalendarProvider>, "children"> = {},
  ) =>
  ({ children }: { children: React.ReactNode }) =>
    React.createElement(CalendarProvider, { ...props, children });

describe("useConfig — defaults", () => {
  it("locale defaults to en", () => {
    const { result } = renderHook(() => useConfig(), { wrapper: wrap() });
    expect(result.current.locale).toBe("en");
  });

  it("hour12 defaults to false", () => {
    const { result } = renderHook(() => useConfig(), { wrapper: wrap() });
    expect(result.current.hour12).toBe(false);
  });

  it("gradient defaults to false", () => {
    const { result } = renderHook(() => useConfig(), { wrapper: wrap() });
    expect(result.current.gradient).toBe(false);
  });

  it("readOnly defaults to false", () => {
    const { result } = renderHook(() => useConfig(), { wrapper: wrap() });
    expect(result.current.readOnly).toBe(false);
  });

  it("range defaults to false (mode=single)", () => {
    const { result } = renderHook(() => useConfig(), { wrapper: wrap() });
    expect(result.current.range).toBe(false);
  });
});

describe("useConfig — prop overrides", () => {
  it("locale prop propagates", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ locale: "ru" }),
    });
    expect(result.current.locale).toBe("ru");
  });

  it("hour12=true propagates", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ hour12: true }),
    });
    expect(result.current.hour12).toBe(true);
  });

  it("gradient=true propagates", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ gradient: true }),
    });
    expect(result.current.gradient).toBe(true);
  });

  it("readOnly=true propagates", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ readOnly: true }),
    });
    expect(result.current.readOnly).toBe(true);
  });

  it("mode=range → range=true", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ mode: "range" }),
    });
    expect(result.current.range).toBe(true);
  });

  it("mode=multiple → multiselect truthy", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ mode: "multiple" }),
    });
    expect(result.current.multiselect).toBeTruthy();
  });

  it("maxDates propagates as multiselect count", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ mode: "multiple", maxDates: 3 }),
    });
    expect(result.current.multiselect).toBe(3);
  });

  it("minDate propagates", () => {
    const min = new Date(2024, 0, 1);
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ minDate: min }),
    });
    expect(result.current.minDate?.getTime()).toBe(min.getTime());
  });

  it("maxDate propagates", () => {
    const max = new Date(2024, 11, 31);
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ maxDate: max }),
    });
    expect(result.current.maxDate?.getTime()).toBe(max.getTime());
  });

  it("timeZone propagates", () => {
    const { result } = renderHook(() => useConfig(), {
      wrapper: wrap({ timeZone: "UTC" }),
    });
    expect(result.current.timeZone).toBe("UTC");
  });
});
