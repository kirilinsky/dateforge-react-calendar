import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarMonthsGrid } from "@/modules/months-grid";

describe("CalendarMonthsGrid", () => {
  it("arrow keys move focus between month tiles", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    const current = getByLabelText("June 2024, selected");
    const next = getByLabelText("July 2024");
    expect(current.tabIndex).toBe(0);
    current.focus();
    fireEvent.keyDown(current, { key: "ArrowRight" });
    expect(document.activeElement).toBe(next);
  });

  it("Home and End move focus to the first and last month tiles", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    const current = getByLabelText("June 2024, selected");
    const first = getByLabelText("January 2024");
    const last = getByLabelText("December 2024");
    current.focus();
    fireEvent.keyDown(current, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toBe(last);
  });

  it("arrow keys can focus disabled out-of-range month tiles for announcement", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 4, 15)} maxDate={new Date(2024, 4, 31)}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    const current = getByLabelText("May 2024, selected");
    const disabledNext = getByLabelText("June 2024, limited");
    expect(current.tabIndex).toBe(0);
    expect(disabledNext.getAttribute("aria-disabled")).toBe("true");
    current.focus();
    fireEvent.keyDown(current, { key: "ArrowRight" });
    expect(document.activeElement).toBe(disabledNext);
  });

  it("clicking a disabled out-of-range month is a no-op", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 4, 15)} maxDate={new Date(2024, 4, 31)}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    await userEvent.click(getByLabelText("June 2024, limited"));
    const current = container.querySelector('[aria-current="true"]');
    expect(current?.getAttribute("aria-label")).toBe("May 2024, selected");
  });

  it("marks selected months without changing the navigation-only click contract", async () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 2, 10)}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    await userEvent.click(getByLabelText("June 2024"));
    const selected = getByLabelText("March 2024, selected");
    const current = getByLabelText("June 2024");
    expect(selected.getAttribute("data-selected")).toBe("true");
    expect(selected.getAttribute("aria-current")).toBeNull();
    expect(current.getAttribute("aria-current")).toBe("true");
    expect(current.getAttribute("data-selected")).toBeNull();
  });
});
