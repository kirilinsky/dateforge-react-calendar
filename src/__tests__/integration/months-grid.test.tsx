import { fireEvent, render } from "@testing-library/react";
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
    const current = getByLabelText("June 2024");
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
    const current = getByLabelText("June 2024");
    const first = getByLabelText("January 2024");
    const last = getByLabelText("December 2024");
    current.focus();
    fireEvent.keyDown(current, { key: "Home" });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: "End" });
    expect(document.activeElement).toBe(last);
  });
});
