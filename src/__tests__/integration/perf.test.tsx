import { act, fireEvent, render, within } from "@testing-library/react";
import { Profiler } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";

const D = new Date(2024, 5, 15);

const findDayButton = (container: HTMLElement, day: number): HTMLElement => {
  const grid =
    container.getAttribute("role") === "grid"
      ? container
      : within(container).getAllByRole("grid")[0];
  const cells = within(grid).getAllByRole("gridcell");
  for (const cell of cells) {
    if (cell.getAttribute("aria-hidden") === "true") continue;
    const btn = cell.querySelector("button");
    if (btn?.textContent?.trim() === String(day)) return btn as HTMLElement;
  }
  throw new Error(`day ${day} not found`);
};

describe("perf — module re-render boundaries", () => {
  it("hover preview in range mode does not re-render Nav subtree", () => {
    const navRenders: number[] = [];
    const onNavRender = () => navRenders.push(performance.now());

    const { container } = render(
      <Calendar mode="range" defaultViewDate={D}>
        <Profiler id="nav" onRender={onNavRender}>
          <CalendarNav />
        </Profiler>
        <CalendarDays />
      </Calendar>,
    );

    fireEvent.click(findDayButton(container, 5));
    const before = navRenders.length;

    for (const day of [10, 11, 12, 13, 14]) {
      fireEvent.mouseEnter(findDayButton(container, day));
    }

    expect(navRenders.length).toBe(before);
  });
});

describe("perf — showNowTime isolation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("showNowTime tick does not re-render CalendarDays", () => {
    const daysRenders: number[] = [];
    const onDaysRender = () => daysRenders.push(performance.now());

    render(
      <Calendar value={D}>
        <CalendarNav showNowTime />
        <Profiler id="days" onRender={onDaysRender}>
          <CalendarDays />
        </Profiler>
      </Calendar>,
    );

    const before = daysRenders.length;

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(daysRenders.length).toBe(before);
  });
});

describe("perf — hover throttling", () => {
  it("rAF-coalesces multiple mouseEnter into one commit", () => {
    const rafQueue: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });

    const daysRenders: number[] = [];
    const { container } = render(
      <Calendar mode="range" defaultViewDate={D}>
        <Profiler id="days" onRender={() => daysRenders.push(0)}>
          <CalendarDays />
        </Profiler>
      </Calendar>,
    );

    fireEvent.click(findDayButton(container, 5));
    rafQueue.length = 0;
    const beforeRenders = daysRenders.length;

    for (const day of [10, 11, 12, 13, 14]) {
      fireEvent.mouseEnter(findDayButton(container, day));
    }

    expect(rafQueue.length).toBe(1);
    expect(daysRenders.length).toBe(beforeRenders);

    act(() => {
      const pending = rafQueue.splice(0, rafQueue.length);
      for (const cb of pending) cb(performance.now());
    });

    expect(daysRenders.length).toBeGreaterThan(beforeRenders);

    rafSpy.mockRestore();
  });

  it("mouseLeave cancels pending hover rAF", () => {
    const rafQueue: Array<FrameRequestCallback | null> = [];
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });
    const cafSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id) => {
        const idx = (id as number) - 1;
        if (idx >= 0 && idx < rafQueue.length) rafQueue[idx] = null;
      });

    const { container } = render(
      <Calendar mode="range" defaultViewDate={D}>
        <CalendarDays />
      </Calendar>,
    );

    fireEvent.click(findDayButton(container, 5));
    rafQueue.length = 0;
    cafSpy.mockClear();

    fireEvent.mouseEnter(findDayButton(container, 12));
    expect(rafQueue.length).toBe(1);

    const grid = within(container).getByRole("grid");
    const area = grid.parentElement as HTMLElement;
    fireEvent.mouseLeave(area);

    expect(cafSpy).toHaveBeenCalled();

    act(() => {
      for (const cb of rafQueue) if (cb) cb(performance.now());
    });

    rafSpy.mockRestore();
    cafSpy.mockRestore();
  });

  it("falls back to synchronous setHoverDate when rAF unavailable", () => {
    const originalRaf = window.requestAnimationFrame;
    const globalRaf = (globalThis as { requestAnimationFrame?: unknown })
      .requestAnimationFrame;
    // @ts-expect-error — intentionally remove rAF to exercise fallback.
    delete window.requestAnimationFrame;
    (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame =
      undefined;

    try {
      const { container } = render(
        <Calendar mode="range" defaultViewDate={D}>
          <CalendarDays />
        </Calendar>,
      );
      fireEvent.click(findDayButton(container, 5));
      expect(() =>
        fireEvent.mouseEnter(findDayButton(container, 10)),
      ).not.toThrow();
    } finally {
      window.requestAnimationFrame = originalRaf;
      (
        globalThis as { requestAnimationFrame?: unknown }
      ).requestAnimationFrame = globalRaf;
    }
  });
});

describe("perf — hover scope gating (effectiveHoverDate)", () => {
  it("hovering inside month A does not change preview classes in month B", () => {
    const rafQueue: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((cb) => {
        rafQueue.push(cb);
        return rafQueue.length;
      });

    const { container } = render(
      <Calendar mode="range" defaultViewDate={D}>
        <CalendarDays />
        <CalendarDays offset={6} />
      </Calendar>,
    );

    const grids = within(container).getAllByRole("grid");
    expect(grids.length).toBe(2);

    const monthBGrid = grids[1];
    const monthBButtonsBefore = within(monthBGrid)
      .getAllByRole("gridcell")
      .map((c) => c.querySelector("button")?.className ?? "");

    fireEvent.click(findDayButton(grids[0] as HTMLElement, 5));
    act(() => {
      const pending = rafQueue.splice(0, rafQueue.length);
      for (const cb of pending) cb(performance.now());
    });

    fireEvent.mouseEnter(findDayButton(grids[0] as HTMLElement, 12));
    act(() => {
      const pending = rafQueue.splice(0, rafQueue.length);
      for (const cb of pending) cb(performance.now());
    });

    const monthBButtonsAfter = within(monthBGrid)
      .getAllByRole("gridcell")
      .map((c) => c.querySelector("button")?.className ?? "");

    expect(monthBButtonsAfter).toEqual(monthBButtonsBefore);

    rafSpy.mockRestore();
  });
});
