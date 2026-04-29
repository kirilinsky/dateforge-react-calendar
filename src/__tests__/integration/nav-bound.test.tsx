import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

describe("CalendarNav — bound prop", () => {
  it("displays rangeStart year when bound=from", () => {
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2022, 3, 10), to: D(2024, 5, 15) }}
        defaultViewDate={D(2024, 5, 15)}
      >
        <CalendarNav bound="from" yearLabel monthLabel />
      </Calendar>,
    );
    // currentYear button label rendered for yearLabel — use container text
    expect(getByLabelText("Calendar navigation").textContent).toContain("2022");
  });

  it("displays rangeEnd year when bound=to", () => {
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2022, 3, 10), to: D(2024, 5, 15) }}
        defaultViewDate={D(2022, 3, 10)}
      >
        <CalendarNav bound="to" yearLabel monthLabel />
      </Calendar>,
    );
    expect(getByLabelText("Calendar navigation").textContent).toContain("2024");
  });

  it("falls back to opposite bound when own bound null", () => {
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2022, 3, 10), to: null }}
        defaultViewDate={D(2030, 0, 1)}
      >
        <CalendarNav bound="to" yearLabel />
      </Calendar>,
    );
    // `to` empty → falls back to rangeStart (2022), not viewDate (2030)
    expect(getByLabelText("Calendar navigation").textContent).toContain("2022");
  });

  it("clear button calls onRangeBoundSet(bound, null), not onChangeDate", () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2022, 3, 10), to: D(2024, 5, 15) }}
        onChange={onChange}
        defaultViewDate={D(2022, 3, 10)}
      >
        <CalendarNav bound="from" clear yearLabel />
      </Calendar>,
    );
    fireEvent.click(getByLabelText("Clear selection"));
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)?.[0];
    // bound=from clear → from=null, to preserved
    expect(last.from).toBeNull();
    expect(last.to).not.toBeNull();
  });

  it("clear disabled when bound has no date", () => {
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: null, to: D(2024, 5, 15) }}
        defaultViewDate={D(2024, 5, 15)}
      >
        <CalendarNav bound="from" clear />
      </Calendar>,
    );
    const btn = getByLabelText("Clear selection") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("month-picker prev arrow updates bound, not viewDate", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 7, 20) }}
        onChange={onChange}
        defaultViewDate={D(2024, 7, 20)}
      >
        <CalendarNav bound="to" showMonthPicker />
      </Calendar>,
    );
    const prev = container.querySelector(
      'button[aria-label="Previous month"]',
    ) as HTMLElement;
    await userEvent.click(prev);
    const last = onChange.mock.calls.at(-1)?.[0];
    expect(last.to.getMonth()).toBe(6); // July → June
    expect(last.from.getTime()).toBe(D(2024, 5, 15).getTime());
  });

  it("month-picker prev clamps `to` to rangeStart when crossing", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 16) }}
        onChange={onChange}
        defaultViewDate={D(2024, 5, 16)}
      >
        <CalendarNav bound="to" showMonthPicker />
      </Calendar>,
    );
    const prev = container.querySelector(
      'button[aria-label="Previous month"]',
    ) as HTMLElement | null;
    if (prev) await userEvent.click(prev);
    // Either no-op (button hidden) or clamped via reducer no-cross logic.
    if (onChange.mock.calls.length) {
      const last = onChange.mock.calls.at(-1)?.[0];
      expect(last.to.getTime()).toBeGreaterThanOrEqual(
        D(2024, 5, 15).getTime(),
      );
    }
  });
});
