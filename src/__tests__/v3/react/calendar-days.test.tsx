import { fireEvent, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { AnyCalendarValue } from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type { CalendarConfig } from "@/core-v3/state";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarProvider } from "@/react-v3/provider";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(
  unit: SelectionUnit,
  mode: SelectionMode,
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit,
    mode,
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

function setup(
  cfg: CalendarConfig,
  props: { onChange?: (v: AnyCalendarValue) => void } = {},
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CalendarProvider config={cfg} initialView={D(2026, 6, 1)} {...props}>
      {children}
    </CalendarProvider>
  );
  return render(<CalendarDays />, { wrapper });
}

/** Find the gridcell button for a day-of-month within the displayed month. */
function dayButton(container: HTMLElement, day: number) {
  const cells = within(container).getAllByRole("gridcell");
  return cells.find(
    (c) =>
      c.textContent === String(day) && c.getAttribute("data-outside") === null,
  ) as HTMLButtonElement;
}

describe("CalendarDays", () => {
  it("renders a fixed 6-week grid (42 cells) plus weekday headers", () => {
    const { container } = setup(config("day", "single"));
    expect(within(container).getAllByRole("gridcell")).toHaveLength(42);
    expect(within(container).getAllByRole("columnheader")).toHaveLength(7);
  });

  it("selects a day on click and emits the value", () => {
    const onChange = vi.fn();
    const { container } = setup(config("day", "single"), { onChange });
    fireEvent.click(dayButton(container, 5));
    expect(onChange).toHaveBeenCalledTimes(1);
    const v = onChange.mock.calls[0][0] as Date;
    expect(v.getTime()).toBe(new Date(2026, 5, 5).getTime());
  });

  it("marks the selected day with data-selected", () => {
    const { container } = setup(config("day", "single"));
    const cell = dayButton(container, 5);
    fireEvent.click(cell);
    expect(cell.getAttribute("data-selected")).toBe("");
  });

  it("flags disabled days and out-of-month cells", () => {
    const { container } = setup(
      config("day", "single", {
        disabled: compileDateRules({ dates: [D(2026, 6, 10)] }),
      }),
    );
    expect(dayButton(container, 10).getAttribute("data-disabled")).toBe("");
    // Leading cells belong to May -> at least one out-of-month cell exists.
    const outside = within(container)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("data-outside") === "");
    expect(outside.length).toBeGreaterThan(0);
  });

  it("draws a range across two clicks with start/end edges", () => {
    const { container } = setup(config("day", "range"));
    fireEvent.click(dayButton(container, 5));
    fireEvent.click(dayButton(container, 9));
    expect(dayButton(container, 5).getAttribute("data-range-start")).toBe("");
    expect(dayButton(container, 9).getAttribute("data-range-end")).toBe("");
    expect(dayButton(container, 7).getAttribute("data-in-range")).toBe("");
  });
});
