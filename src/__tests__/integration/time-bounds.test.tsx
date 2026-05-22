import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsWheel } from "@/modules/months-wheel";
import { CalendarTimeWheel } from "@/modules/time";
import { CalendarYearsWheel } from "@/modules/years-wheel";
import { createDisabled } from "@/utils/create-disabled";

const drumByLabel = (container: HTMLElement, label: string) =>
  container.querySelector(`[aria-label="${label}"]`) as HTMLElement;

describe("CHANGE_TIME respects min/max/disabled", () => {
  it("blocks time change when result violates `disabled.before`", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 5, 15, 10, 0, 0);
    const disabled = createDisabled({ before: new Date(2024, 5, 15, 10, 0) });
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <CalendarTimeWheel />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not fire onTimeSelect when a time change is rejected", () => {
    const onChange = vi.fn();
    const onTimeSelect = vi.fn();
    const value = new Date(2024, 5, 15, 10, 0, 0);
    const disabled = createDisabled({ before: new Date(2024, 5, 15, 10, 0) });
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <CalendarTimeWheel onTimeSelect={onTimeSelect} />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
    expect(onTimeSelect).not.toHaveBeenCalled();
  });

  it("allows time change when result stays within `disabled.before`", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 5, 15, 10, 0, 0);
    const disabled = createDisabled({ before: new Date(2024, 5, 15, 10, 0) });
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <CalendarTimeWheel />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls.at(-1)![0] as Date).getHours()).toBe(11);
  });

  it("blocks time change when `disabled.after` is crossed", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 5, 15, 17, 0, 0);
    const disabled = createDisabled({ after: new Date(2024, 5, 15, 17, 0) });
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <CalendarTimeWheel />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("range mode: rangeStart time change past disabled.after is rejected", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 5, 15, 10, 0, 0),
      to: new Date(2024, 5, 16, 12, 0, 0),
    };
    const disabled = createDisabled({ after: new Date(2024, 5, 15, 11, 0) });
    const { container } = render(
      <Calendar
        mode="range"
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        <CalendarTimeWheel />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("range mode: valid time change on endpoint commits (explicit bound)", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 5, 15, 10, 0, 0),
      to: new Date(2024, 5, 15, 18, 0, 0),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarTimeWheel bound="from" />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalled();
  });

  it("range mode: same-day bounds + no explicit bound = no-op (A-2 fix)", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 5, 15, 10, 0, 0),
      to: new Date(2024, 5, 15, 18, 0, 0),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarTimeWheel />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    // Ambiguous: both bounds match viewDate's calendar day. Without
    // explicit `bound`, CHANGE_TIME used to silently edit rangeStart and
    // make rangeEnd unreachable. Now it's a no-op + dev warning.
    expect(onChange).not.toHaveBeenCalled();
  });

  it("range mode: bound time wheel clamps keyboard jumps to the opposite bound", () => {
    const onChange = vi.fn();
    const onTimeSelect = vi.fn();
    const value = {
      from: new Date(2024, 5, 15, 10, 30, 0),
      to: new Date(2024, 5, 15, 10, 45, 0),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarTimeWheel bound="to" onTimeSelect={onTimeSelect} />
      </Calendar>,
    );
    const minute = drumByLabel(container, "Minutes");

    minute.focus();
    fireEvent.keyDown(minute, { key: "Home" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as typeof value;
    expect(next.to.getHours()).toBe(10);
    expect(next.to.getMinutes()).toBe(30);
    expect(onTimeSelect).toHaveBeenCalledTimes(1);
    expect((onTimeSelect.mock.calls[0][0] as Date).getMinutes()).toBe(30);
  });

  it("range mode: bound month wheel clamps jumps before the opposite bound", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 7, 15),
      to: new Date(2024, 9, 10),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarMonthsWheel bound="to" />
      </Calendar>,
    );
    const month = drumByLabel(container, "Month");

    month.focus();
    fireEvent.keyDown(month, { key: "Home" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as typeof value;
    expect(next.to.getFullYear()).toBe(2024);
    expect(next.to.getMonth()).toBe(8);
    expect(next.to.getDate()).toBe(10);
  });

  it("range mode: bound month wheel does not wrap from January to December", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 0, 15),
      to: new Date(2024, 8, 20),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarMonthsWheel bound="from" />
      </Calendar>,
    );
    const month = drumByLabel(container, "Month");

    month.focus();
    fireEvent.keyDown(month, { key: "ArrowUp" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("range mode: bound time wheel does not wrap from 00 to 23", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 5, 15, 0, 30, 0),
      to: new Date(2024, 5, 20, 18, 45, 0),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarTimeWheel bound="from" />
      </Calendar>,
    );
    const hour = drumByLabel(container, "Hours");

    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowUp" });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("range mode: bound year wheel clamps jumps before the opposite bound", () => {
    const onChange = vi.fn();
    const value = {
      from: new Date(2024, 5, 15),
      to: new Date(2026, 5, 15),
    };
    const { container } = render(
      <Calendar mode="range" value={value} onChange={onChange}>
        <CalendarYearsWheel bound="to" />
      </Calendar>,
    );
    const year = drumByLabel(container, "Year");

    year.focus();
    fireEvent.keyDown(year, { key: "Home" });

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as typeof value;
    expect(next.to.getFullYear()).toBe(2024);
    expect(next.to.getMonth()).toBe(5);
    expect(next.to.getDate()).toBe(15);
  });
});
