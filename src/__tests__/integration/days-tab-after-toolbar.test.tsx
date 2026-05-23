import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { TestToolbar } from "../helpers/test-toolbar";

const VIEW_DATE = new Date(2024, 5, 15); // June 15 2024

const getGrid = (container: HTMLElement): HTMLElement =>
  within(container).getAllByRole("grid")[0] as HTMLElement;

const tabbableCellsIn = (grid: HTMLElement): HTMLElement[] =>
  Array.from(grid.querySelectorAll('button[tabindex="0"]')) as HTMLElement[];

describe("CalendarDays — Tab reachability after toolbar navigation", () => {
  // Regression: when viewDate moves out from under focusedDate (e.g. toolbar
  // prev/next click), focusedDate must follow so the grid keeps exactly one
  // tabbable cell. Otherwise Tab from toolbar skips the grid entirely.
  it("after clicking Next month, the visible grid has exactly one tabbable cell", () => {
    const { container, getByLabelText } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <TestToolbar showMonthPicker />
        <CalendarDays />
      </Calendar>,
    );

    const gridBefore = getGrid(container);
    expect(gridBefore.getAttribute("aria-label")).toMatch(/June 2024/);
    expect(tabbableCellsIn(gridBefore)).toHaveLength(1);

    fireEvent.click(getByLabelText("Next month"));

    const gridAfter = getGrid(container);
    expect(gridAfter.getAttribute("aria-label")).toMatch(/July 2024/);
    const tabbable = tabbableCellsIn(gridAfter);
    expect(tabbable).toHaveLength(1);

    // And that single tabbable cell belongs to the currently visible month
    // (not a trailing/leading other-month cell).
    const cell = tabbable[0]?.closest('[role="gridcell"]') as HTMLElement;
    expect(cell.querySelector("[data-other-month]")).toBeNull();
  });

  it("after clicking Previous month, the visible grid has exactly one tabbable cell", () => {
    const { container, getByLabelText } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <TestToolbar showMonthPicker />
        <CalendarDays />
      </Calendar>,
    );

    fireEvent.click(getByLabelText("Previous month"));

    const grid = getGrid(container);
    expect(grid.getAttribute("aria-label")).toMatch(/May 2024/);
    const tabbable = tabbableCellsIn(grid);
    expect(tabbable).toHaveLength(1);
    const cell = tabbable[0]?.closest('[role="gridcell"]') as HTMLElement;
    expect(cell.querySelector("[data-other-month]")).toBeNull();
  });

  it("with no selection, jumping multiple months keeps the grid tabbable", () => {
    const { container, getByLabelText } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <TestToolbar showMonthPicker />
        <CalendarDays />
      </Calendar>,
    );

    fireEvent.click(getByLabelText("Next month"));
    fireEvent.click(getByLabelText("Next month"));
    fireEvent.click(getByLabelText("Next month"));

    const grid = getGrid(container);
    expect(grid.getAttribute("aria-label")).toMatch(/September 2024/);
    expect(tabbableCellsIn(grid)).toHaveLength(1);
  });
});
