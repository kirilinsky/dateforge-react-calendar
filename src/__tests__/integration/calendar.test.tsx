import { describe, it, expect, vi } from "vitest";
import { render, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import type { DateRange } from "@/types/calendar";

const VIEW_DATE = new Date(2024, 5, 15); // June 15 2024

const renderRange = (props: {
  value?: DateRange;
  onChange?: (v: DateRange) => void;
}) =>
  render(
    <Calendar
      mode="range"
      value={props.value ?? { from: null, to: null }}
      defaultViewDate={VIEW_DATE}
      onChange={props.onChange}
    >
      <CalendarDays />
    </Calendar>,
  );

const findDayButton = (container: HTMLElement, day: number): HTMLElement => {
  const grid = within(container).getByRole("grid");
  const cells = within(grid).getAllByRole("gridcell");
  for (const cell of cells) {
    if (cell.getAttribute("aria-hidden") === "true") continue;
    const btn = cell.querySelector("button");
    if (!btn) continue;
    if (btn.textContent?.trim() === String(day)) return btn as HTMLElement;
  }
  throw new Error(`day button ${day} not found`);
};

// ─── Smoke ────────────────────────────────────────────────────────────────────

describe("Calendar — smoke", () => {
  it("renders without crashing (default props)", () => {
    const { getByRole } = render(
      <Calendar value={VIEW_DATE}>
        <CalendarDays />
      </Calendar>,
    );
    expect(getByRole("grid")).toBeInTheDocument();
  });

  it("renders without value (uncontrolled)", () => {
    const { getByRole } = render(
      <Calendar defaultViewDate={VIEW_DATE}>
        <CalendarDays />
      </Calendar>,
    );
    expect(getByRole("grid")).toBeInTheDocument();
  });
});

// ─── Single mode click ────────────────────────────────────────────────────────

describe("Calendar — single mode click", () => {
  it("click day → onChange fires with correct Date", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={VIEW_DATE} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    const btn = findDayButton(container, 10);
    await userEvent.click(btn);

    expect(onChange).toHaveBeenCalledTimes(1);
    const arg = onChange.mock.calls[0][0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getFullYear()).toBe(2024);
    expect(arg.getMonth()).toBe(5);
    expect(arg.getDate()).toBe(10);
  });

  it("click selected day twice → deselects", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={VIEW_DATE} onChange={onChange}>
        <CalendarDays />
      </Calendar>,
    );
    const btn = findDayButton(container, 10);
    await userEvent.click(btn);
    await userEvent.click(btn);

    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0]).toBeNull();
  });

  it("lockDeselection prevents deselect of already-selected day", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={new Date(2024, 5, 10)} onChange={onChange}>
        <CalendarDays lockDeselection />
      </Calendar>,
    );
    const btn = findDayButton(container, 10);
    await userEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("lockDeselection still allows selecting different day", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={new Date(2024, 5, 10)} onChange={onChange}>
        <CalendarDays lockDeselection />
      </Calendar>,
    );
    const btn = findDayButton(container, 15);
    await userEvent.click(btn);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getDate()).toBe(15);
  });

  it("readOnly blocks selection", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={VIEW_DATE} onChange={onChange} readOnly>
        <CalendarDays />
      </Calendar>,
    );
    const btn = findDayButton(container, 10);
    await userEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });
});

// ─── Range mode ───────────────────────────────────────────────────────────────

describe("Calendar — range mode", () => {
  it("click start then end → onChange fires with both dates", async () => {
    const onChange = vi.fn();
    const { container } = renderRange({ onChange });

    const start = findDayButton(container, 5);
    await userEvent.click(start);

    const end = findDayButton(container, 12);
    await userEvent.click(end);

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as DateRange;
    expect(last.from).toBeInstanceOf(Date);
    expect(last.to).toBeInstanceOf(Date);
    expect(last.from!.getDate()).toBe(5);
    expect(last.to!.getDate()).toBe(12);
  });
});

// ─── Disabled days (min/max) ──────────────────────────────────────────────────

describe("Calendar — min/maxDate disable", () => {
  it("days after maxDate have aria-disabled=true on gridcell", () => {
    const { container } = render(
      <Calendar
        value={VIEW_DATE}
        defaultViewDate={VIEW_DATE}
        maxDate={new Date(2024, 5, 10)}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const cells = within(grid).getAllByRole("gridcell");
    const disabled = cells.filter(
      (c) => c.getAttribute("aria-disabled") === "true",
    );
    expect(disabled.length).toBeGreaterThan(0);
  });

  it("clicking disabled day does not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        value={null}
        defaultViewDate={VIEW_DATE}
        onChange={onChange}
        maxDate={new Date(2024, 5, 10)}
      >
        <CalendarDays />
      </Calendar>,
    );
    const btn = findDayButton(container, 20);
    await userEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("days before minDate disabled", () => {
    const { container } = render(
      <Calendar
        value={VIEW_DATE}
        defaultViewDate={VIEW_DATE}
        minDate={new Date(2024, 5, 10)}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const cells = within(grid).getAllByRole("gridcell");
    const disabled = cells.filter(
      (c) => c.getAttribute("aria-disabled") === "true",
    );
    expect(disabled.length).toBeGreaterThan(0);
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe("Calendar — keyboard", () => {
  it("ArrowRight then Enter → selects next day", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 10)}
        defaultViewDate={VIEW_DATE}
        onChange={onChange}
      >
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const focusable = within(grid)
      .getAllByRole("gridcell")
      .map((c) => c.querySelector("button"))
      .find((b) => b?.getAttribute("tabindex") === "0");

    expect(focusable).toBeTruthy();
    focusable!.focus();

    fireEvent.keyDown(focusable!, { key: "ArrowRight" });
    fireEvent.keyDown(document.activeElement || focusable!, { key: "Enter" });

    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls.at(-1)![0] as Date;
    expect(arg).toBeInstanceOf(Date);
    expect(arg.getDate()).toBe(11);
  });
});

// ─── ARIA selection state ─────────────────────────────────────────────────────

describe("Calendar — selection ARIA", () => {
  it("selected day has aria-selected=true on gridcell", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 10)} defaultViewDate={VIEW_DATE}>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const selected = within(grid)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("aria-selected") === "true");
    expect(selected).toHaveLength(1);
  });
});
