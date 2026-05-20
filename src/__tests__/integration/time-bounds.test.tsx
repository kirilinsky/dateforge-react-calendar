import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeWheel } from "@/modules/time";
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

  it("range mode: valid time change on endpoint commits", () => {
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
    expect(onChange).toHaveBeenCalled();
  });
});
