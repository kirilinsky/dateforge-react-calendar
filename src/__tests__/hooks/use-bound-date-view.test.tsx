import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBoundDateView } from "@/hooks/use-bound-date-view";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const base = {
  range: true,
  rangeStart: null as Date | null,
  rangeEnd: null as Date | null,
  viewDate: d(2024, 6, 1),
};

describe("useBoundDateView", () => {
  it("isBound=false when range=false", () => {
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, range: false }),
    );
    expect(result.current.isBound).toBe(false);
  });

  it("isBound=false when no bound prop", () => {
    const { result } = renderHook(() => useBoundDateView({ ...base }));
    expect(result.current.isBound).toBe(false);
  });

  it("isBound=true when range=true and bound set", () => {
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from" }),
    );
    expect(result.current.isBound).toBe(true);
  });

  it("bound=from → boundDate === rangeStart", () => {
    const start = d(2024, 6, 5);
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from", rangeStart: start }),
    );
    expect(result.current.boundDate).toBe(start);
  });

  it("bound=to → boundDate === rangeEnd", () => {
    const end = d(2024, 6, 20);
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "to", rangeEnd: end }),
    );
    expect(result.current.boundDate).toBe(end);
  });

  it("isBound=false → boundDate === null", () => {
    const { result } = renderHook(() => useBoundDateView({ ...base }));
    expect(result.current.boundDate).toBeNull();
  });

  it("localView initialises from boundDate when bound set", () => {
    const start = d(2024, 6, 10);
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from", rangeStart: start }),
    );
    expect(result.current.localView.getTime()).toBe(start.getTime());
  });

  it("localView initialises from viewDate when not bound", () => {
    const { result } = renderHook(() => useBoundDateView({ ...base }));
    expect(result.current.localView.getTime()).toBe(base.viewDate.getTime());
  });

  it("refDate === localView when isBound", () => {
    const start = d(2024, 6, 10);
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from", rangeStart: start }),
    );
    expect(result.current.refDate).toBe(result.current.localView);
  });

  it("refDate === viewDate when not bound", () => {
    const { result } = renderHook(() => useBoundDateView({ ...base }));
    expect(result.current.refDate).toBe(base.viewDate);
  });

  it("boundDate change syncs localView via effect", () => {
    const start = d(2024, 6, 5);
    const newStart = d(2024, 7, 1);
    let rangeStart = start;

    const { result, rerender } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from", rangeStart }),
    );
    expect(result.current.localView.getTime()).toBe(start.getTime());

    act(() => {
      rangeStart = newStart;
    });
    rerender();

    expect(result.current.localView.getTime()).toBe(newStart.getTime());
  });

  it("setLocalView updates localView", () => {
    const { result } = renderHook(() =>
      useBoundDateView({ ...base, bound: "from", rangeStart: d(2024, 6, 5) }),
    );
    const next = d(2024, 8, 1);
    act(() => result.current.setLocalView(next));
    expect(result.current.localView.getTime()).toBe(next.getTime());
  });
});
