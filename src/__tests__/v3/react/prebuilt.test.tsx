import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  DatePicker,
  MonthPicker,
  MultiMonthCalendar,
  SimpleCalendar,
} from "@/react-v3/prebuilt";

describe("prebuilt: SimpleCalendar", () => {
  it("renders a full calendar (toolbar + day grid) from one import", () => {
    const { getByTestId, getAllByRole } = render(<SimpleCalendar />);
    const root = getByTestId("dateforge-simple-calendar");
    expect(root.querySelector("[role=toolbar]")).toBeTruthy();
    expect(root.querySelector("[role=grid]")).toBeTruthy();
    expect(getAllByRole("gridcell").length).toBeGreaterThanOrEqual(28);
  });

  it("clicking a day reports a JS Date through onChange", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(<SimpleCalendar onChange={onChange} />);
    const cell = getByTestId("dateforge-simple-calendar").querySelector(
      "[role=gridcell][data-date]:not([data-outside])",
    ) as HTMLElement;
    fireEvent.click(cell);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Date);
  });

  it("honors min/max and disabled rules", () => {
    const { getByTestId } = render(
      <SimpleCalendar disabled={{ weekends: true }} />,
    );
    const weekend = getByTestId("dateforge-simple-calendar").querySelector(
      "[role=gridcell][data-weekend]",
    ) as HTMLElement;
    expect(weekend.getAttribute("data-disabled")).not.toBeNull();
  });

  it("locale drives the month names", () => {
    const { getByTestId } = render(<SimpleCalendar locale="de-DE" />);
    // German month names in the toolbar trigger (any of the 12).
    const text = getByTestId("dateforge-simple-calendar").textContent ?? "";
    expect(text).toMatch(
      /Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember/,
    );
  });
});

describe("prebuilt: DatePicker", () => {
  it("renders the manual input alongside the calendar", () => {
    const { getByTestId } = render(<DatePicker />);
    const root = getByTestId("dateforge-date-picker");
    expect(root.querySelector("input")).toBeTruthy();
    expect(root.querySelector("[role=grid]")).toBeTruthy();
  });
});

describe("prebuilt: MonthPicker", () => {
  it("picking a month reports its first day", () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <MonthPicker onChange={onChange} locale="en-US" />,
    );
    fireEvent.click(getByText("Mar"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked: Date = onChange.mock.calls[0][0];
    expect(picked).toBeInstanceOf(Date);
    expect(picked.getMonth()).toBe(2); // March
    expect(picked.getDate()).toBe(1); // first of the month
  });

  it("controlled value marks the month as selected", () => {
    const { getByText } = render(
      <MonthPicker value={new Date(2026, 4, 15)} locale="en-US" />,
    );
    // The May tile carries the selected state.
    expect(getByText("May").closest("[data-selected]")).toBeTruthy();
  });
});

describe("prebuilt: MultiMonthCalendar", () => {
  it("renders N consecutive month grids with matching headers", () => {
    const { getByTestId } = render(
      <MultiMonthCalendar
        months={6}
        cols={3}
        startMonth={new Date(2026, 4, 1)} // May 2026
        locale="en-US"
      />,
    );
    const root = getByTestId("dateforge-multi-month");
    expect(root.querySelectorAll("[role=grid]")).toHaveLength(6);
    expect(root.querySelectorAll("[role=toolbar]")).toHaveLength(6);
    // Consecutive months May..October, each header offset by one.
    const text = root.textContent ?? "";
    for (const m of ["May", "June", "July", "August", "September", "October"]) {
      expect(text).toContain(m);
    }
  });

  it("one shared selection: a range drags across months", () => {
    const onChange = vi.fn();
    const { getByTestId } = render(
      <MultiMonthCalendar
        months={2}
        cols={2}
        mode="range"
        startMonth={new Date(2026, 4, 1)}
        onChange={onChange}
      />,
    );
    const root = getByTestId("dateforge-multi-month");
    const grids = root.querySelectorAll("[role=grid]");
    const mayCell = grids[0].querySelector(
      "[data-date='20260510']",
    ) as HTMLElement;
    const juneCell = grids[1].querySelector(
      "[data-date='20260620']",
    ) as HTMLElement;
    fireEvent.click(mayCell);
    fireEvent.click(juneCell);
    expect(onChange).toHaveBeenCalled();
    const range = onChange.mock.calls.at(-1)?.[0];
    expect(range.start.getMonth()).toBe(4); // May
    expect(range.end.getMonth()).toBe(5); // June
  });
});
