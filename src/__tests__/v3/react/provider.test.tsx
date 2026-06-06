import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { PublicRange } from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type { CalendarConfig } from "@/core-v3/state";
import {
  CalendarProvider,
  type CalendarProviderProps,
  useCalendarActions,
  useCalendarStore,
} from "@/react-v3/provider";
import { useStoreSelector } from "@/react-v3/use-store-selector";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(
  unit: SelectionUnit,
  mode: SelectionMode,
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit,
    mode,
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

function wrapper(props: Omit<CalendarProviderProps, "children">) {
  return ({ children }: { children: ReactNode }) => (
    <CalendarProvider {...props}>{children}</CalendarProvider>
  );
}

describe("CalendarProvider", () => {
  it("emits onChange with the public value on commit", () => {
    const onChange = vi.fn();
    const cfg = config("day", "single");
    const { result } = renderHook(() => useCalendarActions(), {
      wrapper: wrapper({ config: cfg, initialView: D(2026, 6, 1), onChange }),
    });

    act(() => result.current.selectDay(D(2026, 6, 5)));
    expect(onChange).toHaveBeenCalledTimes(1);
    const v = onChange.mock.calls[0][0] as Date;
    expect(v).toBeInstanceOf(Date);
    expect(v.getTime()).toBe(new Date(2026, 5, 5).getTime());
  });

  it("emits a range value and respects exclude segmentation", () => {
    const onChange = vi.fn();
    const cfg = config("day", "range", {
      exclude: compileDateRules({ weekends: true }),
    });
    const { result } = renderHook(() => useCalendarActions(), {
      wrapper: wrapper({ config: cfg, initialView: D(2026, 6, 1), onChange }),
    });

    act(() => result.current.selectDay(D(2026, 6, 5))); // anchor (no notify)
    act(() => result.current.selectDay(D(2026, 6, 9))); // commit
    expect(onChange).toHaveBeenCalledTimes(1);
    const segs = onChange.mock.calls[0][0] as PublicRange[];
    expect(Array.isArray(segs)).toBe(true);
    expect(segs).toHaveLength(2); // weekend cut
  });

  it("fires onViewChange when navigating", () => {
    const onViewChange = vi.fn();
    const cfg = config("day", "single");
    const { result } = renderHook(() => useCalendarActions(), {
      wrapper: wrapper({
        config: cfg,
        initialView: D(2026, 6, 1),
        onViewChange,
      }),
    });

    act(() => result.current.navigateBy("month", 1));
    expect(onViewChange).toHaveBeenCalledTimes(1);
    expect(onViewChange.mock.calls[0][0]).toEqual(D(2026, 7, 1));
  });

  it("reports rejected actions via onValidationReject", () => {
    const onValidationReject = vi.fn();
    const cfg = config("day", "single", { readOnly: true });
    const { result } = renderHook(() => useCalendarActions(), {
      wrapper: wrapper({
        config: cfg,
        initialView: D(2026, 6, 1),
        onValidationReject,
      }),
    });

    act(() => result.current.selectDay(D(2026, 6, 5)));
    expect(onValidationReject).toHaveBeenCalledTimes(1);
    expect(onValidationReject.mock.calls[0][0]).toMatchObject({
      ok: false,
      reason: "read-only",
    });
  });

  it("keeps stable action identity across renders", () => {
    const cfg = config("day", "single");
    const { result, rerender } = renderHook(() => useCalendarActions(), {
      wrapper: wrapper({ config: cfg, initialView: D(2026, 6, 1) }),
    });
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("seeds an uncontrolled selection from defaultSelection", () => {
    const cfg = config("day", "single");
    const { result } = renderHook(
      () => {
        const store = useCalendarStore();
        return useStoreSelector(store, (s) =>
          s.selection.shape === "point" ? s.selection.dates.length : 0,
        );
      },
      {
        wrapper: wrapper({
          config: cfg,
          initialView: D(2026, 6, 1),
          defaultSelection: {
            shape: "point",
            dates: [{ date: D(2026, 6, 3), time: MIDNIGHT }],
          },
        }),
      },
    );
    expect(result.current).toBe(1);
  });

  it("throws when the store hook is used outside a provider", () => {
    expect(() => renderHook(() => useCalendarStore())).toThrow(
      /within a CalendarProvider/,
    );
  });
});
