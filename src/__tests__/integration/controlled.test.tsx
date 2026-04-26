import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";

const D = new Date(2024, 5, 15);

const findDayButton = (container: HTMLElement, day: number): HTMLElement => {
  const grid = within(container).getByRole("grid");
  const cells = within(grid).getAllByRole("gridcell");
  for (const cell of cells) {
    if (cell.getAttribute("aria-hidden") === "true") continue;
    const btn = cell.querySelector("button");
    if (!btn) continue;
    if (btn.textContent?.trim() === String(day)) return btn as HTMLElement;
  }
  throw new Error(`day ${day} not found`);
};

describe("defaultValue — uncontrolled with seed", () => {
  it("seeds selected date on mount", () => {
    const { container } = render(
      <Calendar defaultValue={D}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
    expect(selected[0].textContent).toContain("15");
  });

  it("internal state updates on click without value prop", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar defaultValue={D} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    await userEvent.click(findDayButton(container, 20));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(20);
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected[0].textContent).toContain("20");
  });

  it("changing defaultValue after mount does not re-sync state", () => {
    const { container, rerender } = render(
      <Calendar defaultValue={D}>
        <CalendarDays />
      </Calendar>,
    );
    rerender(
      <Calendar defaultValue={new Date(2024, 5, 25)}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected[0].textContent).toContain("15");
  });
});

describe("controlled vs uncontrolled — value precedence", () => {
  it("value takes precedence over defaultValue when both provided", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 5)} defaultValue={D}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected[0].textContent).toContain("5");
  });

  it("controlled value changes are synced after mount", () => {
    const { container, rerender } = render(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    rerender(
      <Calendar value={new Date(2024, 5, 25)}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected[0].textContent).toContain("25");
  });
});
