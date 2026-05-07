import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeGrid } from "@/modules/time";

const getDrum = (container: HTMLElement, label: string) =>
  container.querySelector(`[aria-label="${label}"]`) as HTMLElement;

describe("timeStep config", () => {
  it("minute step=5 renders aria-valuemax=55 and steps minutes by 5", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 0, 1, 10, 0, 0);
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        timeStep={{ minute: 5 }}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = getDrum(container, "Minutes");
    expect(minute.getAttribute("aria-valuemax")).toBe("55");
    expect(minute.getAttribute("aria-valuenow")).toBe("0");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getMinutes()).toBe(5);
  });

  it("minute step=30 produces only 0 and 30", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 0, 1, 10, 0, 0);
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        timeStep={{ minute: 30 }}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = getDrum(container, "Minutes");
    expect(minute.getAttribute("aria-valuemax")).toBe("30");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(30);
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(0);
  });

  it("hour step=2 steps hours by 2", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 0, 1, 0, 0, 0);
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        timeStep={{ hour: 2 }}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const hour = getDrum(container, "Hours");
    expect(hour.getAttribute("aria-valuemax")).toBe("22");
    hour.focus();
    fireEvent.keyDown(hour, { key: "ArrowDown" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getHours()).toBe(2);
  });

  it("default step=1 unaffected", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 0, 1, 0, 5, 0);
    const { container } = render(
      <Calendar mode="single" value={value} onChange={onChange}>
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = getDrum(container, "Minutes");
    expect(minute.getAttribute("aria-valuemax")).toBe("59");
    expect(minute.getAttribute("aria-valuenow")).toBe("5");
  });

  it("End key jumps to last step", () => {
    const onChange = vi.fn();
    const value = new Date(2024, 0, 1, 10, 0, 0);
    const { container } = render(
      <Calendar
        mode="single"
        value={value}
        onChange={onChange}
        timeStep={{ minute: 15 }}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = getDrum(container, "Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "End" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(45);
  });
});
