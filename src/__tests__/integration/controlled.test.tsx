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

describe("defaultViewDate — Calendar root", () => {
  it("seeds initial view month without affecting selection", () => {
    const { container } = render(
      <Calendar defaultViewDate={new Date(2024, 5, 1)}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const label = grid.getAttribute("aria-label");
    expect(label?.toLowerCase()).toContain("june");
    expect(label).toContain("2024");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(0);
  });

  it("explicit value overrides defaultViewDate's month", () => {
    const { container } = render(
      <Calendar
        value={new Date(2024, 0, 5)}
        defaultViewDate={new Date(2024, 5, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const label = grid.getAttribute("aria-label");
    expect(label?.toLowerCase()).toContain("january");
  });
});

describe("maxDates cap", () => {
  it("Days click on a non-selected date does not fire onChange when cap is reached", async () => {
    const onChange = vi.fn();
    const D2 = (day: number) => new Date(2024, 5, day);
    const { container } = render(
      <Calendar
        mode="multiple"
        maxDates={3}
        value={[D2(1), D2(2), D2(3)]}
        onChange={onChange}
      >
        <CalendarDays />
      </Calendar>,
    );
    const target = findDayButton(container, 10);
    await userEvent.click(target);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Days click on an already-selected date toggles it off (frees a slot)", async () => {
    const onChange = vi.fn();
    const D2 = (day: number) => new Date(2024, 5, day);
    const { container } = render(
      <Calendar
        mode="multiple"
        maxDates={3}
        value={[D2(1), D2(2), D2(3)]}
        onChange={onChange}
      >
        <CalendarDays />
      </Calendar>,
    );
    const target = findDayButton(container, 2);
    await userEvent.click(target);
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as Date[];
    expect(last.length).toBe(2);
    expect(last.some((d) => d.getDate() === 2)).toBe(false);
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

describe("Invalid Date — drop policy", () => {
  it("single mode: invalid value yields no selection (no silent today fallback)", () => {
    const { container } = render(
      <Calendar value={new Date("nope") as never} defaultViewDate={D}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(0);
  });

  it("multiple mode: invalid entries are dropped, valid kept", () => {
    const { container } = render(
      <Calendar
        mode="multiple"
        value={[D, new Date("nope") as never, new Date(2024, 5, 20)]}
        defaultViewDate={D}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(2);
    const labels = selected.map((c) => c.textContent?.trim()).sort();
    expect(labels).toEqual(["15", "20"]);
  });

  it("range mode: invalid 'from' nulls the bound, 'to' kept if valid", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: new Date("nope") as never, to: new Date(2024, 5, 20) }}
        defaultViewDate={D}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter(
        (c) =>
          c.getAttribute("aria-selected") === "true" ||
          c.querySelector('[data-range="end"]') !== null,
      );
    expect(selected.length).toBeGreaterThan(0);
  });
});
