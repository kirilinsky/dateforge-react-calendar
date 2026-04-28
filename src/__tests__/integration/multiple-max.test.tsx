import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

const findDayButton = (container: HTMLElement, day: number): HTMLElement => {
  const grid = within(container).getByRole("grid");
  const cells = within(grid).getAllByRole("gridcell");
  for (const cell of cells) {
    const btn = cell.querySelector("button");
    if (!btn) continue;
    if (btn.textContent?.trim() === String(day)) return btn as HTMLElement;
  }
  throw new Error(`day ${day} not found`);
};

describe("multiple mode — maxDates limit", () => {
  it("marks unselected current-month days with data-max-reached when limit reached", () => {
    const dates = [D(2024, 5, 10), D(2024, 5, 11)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={2} value={dates}>
        <CalendarDays />
      </Calendar>,
    );
    const day15 = findDayButton(container, 15);
    expect(day15.getAttribute("data-max-reached")).toBe("true");
  });

  it("does NOT mark selected days as max-reached", () => {
    const dates = [D(2024, 5, 10), D(2024, 5, 11)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={2} value={dates}>
        <CalendarDays />
      </Calendar>,
    );
    const day10 = findDayButton(container, 10);
    expect(day10.getAttribute("data-max-reached")).toBeNull();
  });

  it("clicking unselected day at limit does NOT fire onChange", async () => {
    const onChange = vi.fn();
    const dates = [D(2024, 5, 10), D(2024, 5, 11)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={2} value={dates} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    const day20 = findDayButton(container, 20);
    await userEvent.click(day20);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clicking already-selected day at limit deselects it", async () => {
    const onChange = vi.fn();
    const dates = [D(2024, 5, 10), D(2024, 5, 11)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={2} value={dates} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    const day11 = findDayButton(container, 11);
    await userEvent.click(day11);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0] as Date[];
    expect(next).toHaveLength(1);
    expect(next[0].getDate()).toBe(10);
  });

  it("under-limit unselected days have no max-reached attr", () => {
    const dates = [D(2024, 5, 10)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={3} value={dates}>
        <CalendarDays />
      </Calendar>,
    );
    const day20 = findDayButton(container, 20);
    expect(day20.getAttribute("data-max-reached")).toBeNull();
  });

  it("under-limit click adds the date", async () => {
    const onChange = vi.fn();
    const dates = [D(2024, 5, 10)];
    const { container } = render(
      <Calendar mode="multiple" maxDates={3} value={dates} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    const day20 = findDayButton(container, 20);
    await userEvent.click(day20);
    expect(onChange).toHaveBeenCalled();
    const next = onChange.mock.calls.at(-1)?.[0] as Date[];
    expect(next).toHaveLength(2);
  });

  it("disabled day click never fires onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        defaultValue={D(2024, 5, 15)}
        minDate={D(2024, 5, 10)}
        onChange={onChange}
      >
        <CalendarDays />
      </Calendar>,
    );
    const day5 = findDayButton(container, 5);
    await userEvent.click(day5);
    expect(onChange).not.toHaveBeenCalled();
  });
});
