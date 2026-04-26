import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, within, act } from "@testing-library/react";
import { Profiler } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";

const D = new Date(2024, 5, 15);

const findDayButton = (container: HTMLElement, day: number): HTMLElement => {
  const grid = within(container).getByRole("grid");
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

    // Click first day to start range pick — turns on hoverDate gating.
    fireEvent.click(findDayButton(container, 5));
    const before = navRenders.length;

    // Move hover across several cells.
    for (const day of [10, 11, 12, 13, 14]) {
      fireEvent.mouseEnter(findDayButton(container, day));
    }

    expect(navRenders.length).toBe(before);
  });

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

    // Advance 3 seconds — three nowTime ticks.
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(daysRenders.length).toBe(before);
  });
});
