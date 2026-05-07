import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarYearsTrack } from "@/modules/years-track";

const drum = (container: HTMLElement, label: string) =>
  container.querySelector(`[aria-label="${label}"]`) as HTMLElement;

describe("Bound-mode tracks render with range values without crashing", () => {
  it("months-track bound='from' renders with valid range value", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: new Date(2024, 5, 10), to: new Date(2024, 7, 20) }}
      >
        <CalendarMonthsTrack bound="from" />
      </Calendar>,
    );
    const track = drum(container, "Month");
    expect(track).toBeTruthy();
    fireEvent.keyDown(track, { key: "ArrowRight" });
  });

  it("years-track bound='to' renders with valid range value", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: new Date(2024, 5, 10), to: new Date(2025, 7, 20) }}
      >
        <CalendarYearsTrack bound="to" />
      </Calendar>,
    );
    const track = drum(container, "Year");
    expect(track).toBeTruthy();
    fireEvent.keyDown(track, { key: "ArrowLeft" });
  });

  it("days-track bound='to' renders with valid range value", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: new Date(2024, 5, 5), to: new Date(2024, 5, 15) }}
      >
        <CalendarDaysTrack bound="to" />
      </Calendar>,
    );
    const track = drum(container, "Day");
    expect(track).toBeTruthy();
    fireEvent.keyDown(track, { key: "ArrowRight" });
  });
});

describe("days-track showMonthLabel renders activeLabel", () => {
  it("active item includes month-short label when showMonthLabel is set", () => {
    const { container } = render(
      <Calendar mode="single" value={new Date(2024, 5, 15)}>
        <CalendarDaysTrack showMonthLabel />
      </Calendar>,
    );
    const active = container.querySelector(
      '[data-area="days-track"] [data-item][aria-hidden="false"]',
    );
    expect(active?.textContent?.toLowerCase()).toMatch(/jun/);
  });
});

describe("StepDrum Home/End keys", () => {
  it("Home jumps minute drum to 0", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 0, 1, 10, 35, 0)}
        onChange={onChange}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = drum(container, "Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "Home" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(0);
  });

  it("End jumps minute drum to last step", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 0, 1, 10, 0, 0)}
        onChange={onChange}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = drum(container, "Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "End" });
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(59);
  });
});

describe("CHANGE_TIME multi-mode invalid path", () => {
  it("multi: time edit on disabled date is rejected (no-op)", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="multiple"
        value={[new Date(2024, 5, 15, 10, 0, 0)]}
        onChange={onChange}
        minDate={new Date(2024, 5, 16)}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = drum(container, "Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("multi: empty selection — invalid time produces no commit", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="multiple"
        value={[]}
        onChange={onChange}
        maxDate={new Date(1990, 0, 1)}
      >
        <CalendarTimeGrid />
      </Calendar>,
    );
    const minute = drum(container, "Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
  });
});
