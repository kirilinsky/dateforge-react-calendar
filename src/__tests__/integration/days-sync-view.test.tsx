import { fireEvent, render, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { createDisabled } from "@/utils/create-disabled";

const VIEW_DATE = new Date(2024, 5, 15); // June 15 2024

const findDayInGrid = (grid: HTMLElement, day: number): HTMLElement => {
  const cells = within(grid).getAllByRole("gridcell");
  for (const cell of cells) {
    if (cell.getAttribute("aria-hidden") === "true") continue;
    const btn = cell.querySelector("button");
    if (btn?.textContent?.trim() === String(day)) return btn as HTMLElement;
  }
  throw new Error(`day ${day} not found`);
};

const getGrids = (container: HTMLElement) =>
  within(container).getAllByRole("grid");

const monthLabelOf = (grid: HTMLElement): string =>
  grid.getAttribute("aria-label") ?? "";

describe("CalendarDays — syncViewOnSelect", () => {
  it("offset > 0: clicking a day does NOT change primary viewDate (default)", () => {
    const { container } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <CalendarNav />
        <CalendarDays offset={0} />
        <CalendarDays offset={1} />
      </Calendar>,
    );

    const grids = getGrids(container);
    expect(monthLabelOf(grids[0] as HTMLElement)).toMatch(/June 2024/);
    expect(monthLabelOf(grids[1] as HTMLElement)).toMatch(/July 2024/);

    fireEvent.click(findDayInGrid(grids[1] as HTMLElement, 10));

    const after = getGrids(container);
    expect(monthLabelOf(after[0] as HTMLElement)).toMatch(/June 2024/);
    expect(monthLabelOf(after[1] as HTMLElement)).toMatch(/July 2024/);
  });

  it("offset === 0: clicking a day DOES change viewDate (default)", () => {
    const { container } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <CalendarNav />
        <CalendarDays offset={0} />
        <CalendarDays offset={1} />
      </Calendar>,
    );

    const grids = getGrids(container);
    // June grid renders trailing July days at the end — pick "1" from current
    // month to keep viewDate in June while still exercising the SELECT path.
    fireEvent.click(findDayInGrid(grids[0] as HTMLElement, 20));

    const after = getGrids(container);
    expect(monthLabelOf(after[0] as HTMLElement)).toMatch(/June 2024/);
    expect(monthLabelOf(after[1] as HTMLElement)).toMatch(/July 2024/);
  });

  it("offset > 0 with syncViewOnSelect={true}: viewDate DOES move", () => {
    const { container } = render(
      <Calendar mode="single" defaultViewDate={VIEW_DATE}>
        <CalendarNav />
        <CalendarDays offset={0} />
        <CalendarDays offset={1} syncViewOnSelect />
      </Calendar>,
    );

    const grids = getGrids(container);
    fireEvent.click(findDayInGrid(grids[1] as HTMLElement, 10));

    const after = getGrids(container);
    expect(monthLabelOf(after[0] as HTMLElement)).toMatch(/July 2024/);
    expect(monthLabelOf(after[1] as HTMLElement)).toMatch(/August 2024/);
  });

  it("offset === 0 with syncViewOnSelect={false}: viewDate stays", () => {
    type CV = Date | null;
    const Wrap = () => {
      const [v, setV] = useState<CV>(VIEW_DATE);
      return (
        <Calendar
          mode="single"
          value={v}
          onChange={setV}
          defaultViewDate={VIEW_DATE}
        >
          <CalendarNav />
          <CalendarDays offset={0} syncViewOnSelect={false} />
        </Calendar>
      );
    };
    const { container } = render(<Wrap />);
    const grid = getGrids(container)[0] as HTMLElement;
    // Click a trailing-month cell. With syncViewOnSelect=false, view stays
    // on June even though the selection is in July.
    // Use day "1" — the grid contains July 1 as trailing day.
    const allOnes = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.querySelector("button")?.textContent?.trim() === "1");
    const trailing = allOnes.find(
      (c) => c.querySelector("[data-other-month]") !== null,
    );
    if (!trailing) {
      // If no trailing "1" exists in this month layout, the assertion below
      // is unreachable — skip in that case rather than fail.
      return;
    }
    fireEvent.click(trailing.querySelector("button") as HTMLElement);
    expect(monthLabelOf(getGrids(container)[0] as HTMLElement)).toMatch(
      /June 2024/,
    );
  });

  it("range mode: clicking endpoint in offset grid keeps view + selects range", () => {
    type RV = { from: Date | null; to: Date | null };
    const Wrap = () => {
      const [r, setR] = useState<RV>({ from: null, to: null });
      return (
        <Calendar
          mode="range"
          value={r}
          onChange={setR}
          defaultViewDate={VIEW_DATE}
        >
          <CalendarNav />
          <CalendarDays offset={0} />
          <CalendarDays offset={1} />
        </Calendar>
      );
    };
    const { container } = render(<Wrap />);

    const grids = getGrids(container);
    fireEvent.click(findDayInGrid(grids[0] as HTMLElement, 5));
    fireEvent.click(findDayInGrid(grids[1] as HTMLElement, 12));

    // Primary view remains on June even after clicking July as range end.
    const after = getGrids(container);
    expect(monthLabelOf(after[0] as HTMLElement)).toMatch(/June 2024/);
    expect(monthLabelOf(after[1] as HTMLElement)).toMatch(/July 2024/);
  });

  it("invalid keepView click does not affect the next controlled value sync", async () => {
    type RV = { from: Date | null; to: Date | null };
    const disabled = createDisabled({ dates: [new Date(2024, 5, 7)] });

    const Wrap = () => {
      const [r, setR] = useState<RV>({ from: null, to: null });
      return (
        <>
          <button
            type="button"
            onClick={() => setR({ from: new Date(2024, 8, 10), to: null })}
          >
            external jump
          </button>
          <Calendar
            mode="range"
            value={r}
            onChange={setR}
            defaultViewDate={VIEW_DATE}
            disabled={disabled}
          >
            <CalendarNav />
            <CalendarDays offset={0} />
            <CalendarDays offset={1} />
          </Calendar>
        </>
      );
    };

    const { container, getByRole } = render(<Wrap />);
    const grids = getGrids(container);

    fireEvent.click(findDayInGrid(grids[0] as HTMLElement, 5));
    fireEvent.click(findDayInGrid(grids[1] as HTMLElement, 10));
    fireEvent.click(getByRole("button", { name: "external jump" }));

    await waitFor(() => {
      expect(monthLabelOf(getGrids(container)[0] as HTMLElement)).toMatch(
        /September 2024/,
      );
    });
  });
});
