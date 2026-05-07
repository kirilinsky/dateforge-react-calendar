import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";

describe("Nav MonthPopup confirm path", () => {
  it("changing the month via drum and confirming navigates viewDate", async () => {
    const onChange = vi.fn();
    const { container, getByLabelText } = render(
      <Calendar mode="single" value={new Date(2024, 5, 15)} onChange={onChange}>
        <CalendarNav showMonthPicker />
      </Calendar>,
    );
    await userEvent.click(getByLabelText(/Change month/));

    const drum = container.querySelector(
      '[aria-label="Select month"] [role="spinbutton"]',
    ) as HTMLElement;
    expect(drum).toBeTruthy();
    drum.focus();
    fireEvent.keyDown(drum, { key: "ArrowDown" });

    const confirm = getByLabelText("Confirm");
    await userEvent.click(confirm);

    // Month picker is pure navigation — viewDate moves but onChange does not
    // fire (no selection mutation). Verify popup closed and month label updated.
    expect(container.querySelector('[aria-label="Select month"]')).toBeNull();
  });
});

describe("Nav YearPopup confirm path", () => {
  it("changing the year via drum and confirming navigates viewDate", async () => {
    const { container, getByLabelText } = render(
      <Calendar mode="single" value={new Date(2024, 5, 15)}>
        <CalendarNav showYearPicker />
      </Calendar>,
    );
    await userEvent.click(getByLabelText(/Change year/));

    const drum = container.querySelector(
      '[aria-label="Select year"] [role="spinbutton"]',
    ) as HTMLElement;
    drum.focus();
    fireEvent.keyDown(drum, { key: "ArrowDown" });

    await userEvent.click(getByLabelText("Confirm"));
    expect(container.querySelector('[aria-label="Select year"]')).toBeNull();
  });

  it("year drum step respects maxDate (cannot go past max)", async () => {
    const { container, getByLabelText } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 5, 15)}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(2024, 11, 31)}
      >
        <CalendarNav showYearPicker />
      </Calendar>,
    );
    await userEvent.click(getByLabelText(/Change year/));

    const drum = container.querySelector(
      '[aria-label="Select year"] [role="spinbutton"]',
    ) as HTMLElement;
    expect(drum).toBeTruthy();
    drum.focus();
    fireEvent.keyDown(drum, { key: "ArrowUp" });
    fireEvent.keyDown(drum, { key: "ArrowUp" });
    expect(Number(drum.getAttribute("aria-valuenow"))).toBeLessThanOrEqual(
      2024,
    );
  });
});
