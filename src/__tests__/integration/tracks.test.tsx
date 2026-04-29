import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarYearsTrack } from "@/modules/years-track";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

const findTrack = (container: HTMLElement, area: string) =>
  container.querySelector(`[data-area="${area}"]`) as HTMLElement;

describe("CalendarMonthsTrack — keyboard nav", () => {
  it("renders with role=spinbutton + aria-valuenow", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    expect(track).toBeTruthy();
    expect(track.getAttribute("role")).toBe("spinbutton");
    expect(track.getAttribute("aria-valuemin")).toBe("1");
    expect(track.getAttribute("aria-valuemax")).toBe("12");
  });

  it("ArrowRight scrolls forward", () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)} onChange={onChange}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(track).toBeTruthy();
  });

  it("ArrowDown also scrolls forward", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "ArrowDown" });
    expect(track).toBeTruthy();
  });

  it("ArrowLeft scrolls back", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "ArrowLeft" });
    expect(track).toBeTruthy();
  });

  it("ArrowUp scrolls back", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "ArrowUp" });
    expect(track).toBeTruthy();
  });

  it("Home jumps to first", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "Home" });
    expect(track).toBeTruthy();
  });

  it("End jumps to last", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "End" });
    expect(track).toBeTruthy();
  });

  it("ignores irrelevant keys", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    fireEvent.keyDown(track, { key: "Escape" });
    expect(track).toBeTruthy();
  });

  it("respects minDate as month boundary in same year", () => {
    const { container } = render(
      <Calendar
        mode="single"
        defaultValue={D(2024, 5, 15)}
        minDate={D(2024, 2, 1)}
      >
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    expect(track.getAttribute("aria-valuemin")).toBe("3");
  });

  it("respects maxDate as month boundary in same year", () => {
    const { container } = render(
      <Calendar
        mode="single"
        defaultValue={D(2024, 5, 15)}
        maxDate={D(2024, 9, 28)}
      >
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    expect(track.getAttribute("aria-valuemax")).toBe("10");
  });

  it("renders short month names by default", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)} locale="en-US">
        <CalendarMonthsTrack />
      </Calendar>,
    );
    const items = container.querySelectorAll("[data-item]");
    expect(items.length).toBeGreaterThan(0);
  });

  it("renders full month names with short=false", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)} locale="en-US">
        <CalendarMonthsTrack short={false} />
      </Calendar>,
    );
    const items = container.querySelectorAll("[data-item]");
    expect(items.length).toBeGreaterThan(0);
  });
});

describe("CalendarYearsTrack — keyboard nav", () => {
  it("renders with role=spinbutton", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarYearsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    expect(track).toBeTruthy();
    expect(track.getAttribute("role")).toBe("spinbutton");
  });

  it("ArrowRight scrolls forward", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarYearsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    fireEvent.keyDown(track, { key: "ArrowRight" });
    expect(track).toBeTruthy();
  });

  it("ArrowLeft scrolls back", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarYearsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    fireEvent.keyDown(track, { key: "ArrowLeft" });
    expect(track).toBeTruthy();
  });

  it("Home + End respected", () => {
    const { container } = render(
      <Calendar
        mode="single"
        defaultValue={D(2024, 5, 15)}
        minDate={D(2020, 0, 1)}
        maxDate={D(2030, 11, 31)}
      >
        <CalendarYearsTrack />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    fireEvent.keyDown(track, { key: "Home" });
    fireEvent.keyDown(track, { key: "End" });
    expect(track).toBeTruthy();
  });
});

describe("CalendarDaysTrack — keyboard nav", () => {
  it("renders with role=spinbutton", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarDaysTrack />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    expect(track).toBeTruthy();
    expect(track.getAttribute("role")).toBe("spinbutton");
  });

  it("Arrow keys navigate days", () => {
    const { container } = render(
      <Calendar mode="single" defaultValue={D(2024, 5, 15)}>
        <CalendarDaysTrack />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    fireEvent.keyDown(track, { key: "ArrowRight" });
    fireEvent.keyDown(track, { key: "ArrowLeft" });
    fireEvent.keyDown(track, { key: "Home" });
    fireEvent.keyDown(track, { key: "End" });
    expect(track).toBeTruthy();
  });
});

describe("Range bound — track field limits via aria", () => {
  it("days-track bound=to clamps min day to rangeStart day in same month", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: null }}
        defaultViewDate={D(2024, 5, 15)}
      >
        <CalendarDaysTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    expect(track.getAttribute("aria-valuemin")).toBe("15");
  });

  it("days-track bound=to no constraint when month is after rangeStart month", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 7, 10) }}
        defaultViewDate={D(2024, 7, 10)}
      >
        <CalendarDaysTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    expect(track.getAttribute("aria-valuemin")).toBe("1");
  });

  it("days-track bound=from clamps max day to rangeEnd day in same month", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: null, to: D(2024, 5, 15) }}
        defaultViewDate={D(2024, 5, 15)}
      >
        <CalendarDaysTrack bound="from" />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    expect(track.getAttribute("aria-valuemax")).toBe("15");
  });

  it("months-track bound=to: same year, refDay >= fd → min month = fm", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 20) }}
        defaultViewDate={D(2024, 5, 20)}
      >
        <CalendarMonthsTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    expect(track.getAttribute("aria-valuemin")).toBe("6");
  });

  it("months-track bound=to: same year, refDay < fd → min month = fm+1", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 10) }}
        defaultViewDate={D(2024, 5, 10)}
      >
        <CalendarMonthsTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "months-track");
    expect(track.getAttribute("aria-valuemin")).toBe("7");
  });

  it("years-track bound=to: refDate before rangeStart → year min = fy+1", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2023, 0, 1) }}
        defaultViewDate={D(2023, 0, 1)}
      >
        <CalendarYearsTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    expect(track.getAttribute("aria-valuemin")).toBe("2025");
  });

  it("years-track bound=from: refDate after rangeEnd → year max = ty-1", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2025, 7, 1), to: D(2024, 5, 15) }}
        defaultViewDate={D(2025, 7, 1)}
      >
        <CalendarYearsTrack bound="from" />
      </Calendar>,
    );
    const track = findTrack(container, "years-track");
    expect(track.getAttribute("aria-valuemax")).toBe("2023");
  });

  it("absolute minDate combines with bound limit (max wins)", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: null }}
        minDate={D(2024, 5, 10)}
        defaultViewDate={D(2024, 5, 15)}
      >
        <CalendarDaysTrack bound="to" />
      </Calendar>,
    );
    const track = findTrack(container, "days-track");
    // bound min = 15, abs min = 10 → effective 15
    expect(track.getAttribute("aria-valuemin")).toBe("15");
  });
});
