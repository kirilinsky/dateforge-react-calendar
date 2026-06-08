import { fireEvent, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
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

function setup(cfg: CalendarConfig) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CalendarProvider config={cfg} initialView={D(2026, 9, 1)}>
      {children}
    </CalendarProvider>
  );
  return render(<CalendarDays />, { wrapper });
}

function grid(container: HTMLElement) {
  return within(container).getByRole("grid");
}
function dayCell(container: HTMLElement, day: number) {
  return within(container)
    .getAllByRole("gridcell")
    .find(
      (c) =>
        c.textContent === String(day) &&
        c.getAttribute("data-outside") === null,
    ) as HTMLButtonElement;
}

describe("CalendarDays keyboard", () => {
  it("gives exactly one cell tabindex=0 (roving), defaulting to the 1st", () => {
    const { container } = setup(config("day", "single"));
    const focusable = within(container)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("tabindex") === "0");
    expect(focusable).toHaveLength(1);
    // No selection, today (2026-06) not in the Sept 2026 view -> 1st of month.
    expect(focusable[0].textContent).toBe("1");
  });

  it("ArrowRight moves the roving focus to the next day", () => {
    const { container } = setup(config("day", "single"));
    dayCell(container, 1).focus();
    fireEvent.keyDown(grid(container), { key: "ArrowRight" });
    expect(dayCell(container, 2).getAttribute("tabindex")).toBe("0");
    expect(dayCell(container, 1).getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves a whole week", () => {
    const { container } = setup(config("day", "single"));
    dayCell(container, 1).focus();
    fireEvent.keyDown(grid(container), { key: "ArrowDown" });
    expect(dayCell(container, 8).getAttribute("tabindex")).toBe("0");
  });

  it("Enter selects the focused day", () => {
    const { container } = setup(config("day", "single"));
    dayCell(container, 1).focus();
    fireEvent.keyDown(grid(container), { key: "ArrowRight" }); // focus 2
    fireEvent.keyDown(grid(container), { key: "Enter" });
    expect(dayCell(container, 2).getAttribute("data-selected")).toBe("");
  });

  it("PageDown navigates to the next month", () => {
    const { container } = setup(config("day", "single"));
    // Default focus is Sept 1; PageDown -> Oct 1.
    fireEvent.keyDown(grid(container), { key: "PageDown" });
    // Oct has 31 days, Sept only 30 -> an in-month "31" proves Oct is in view.
    const has31 = within(container)
      .getAllByRole("gridcell")
      .some(
        (c) =>
          c.textContent === "31" && c.getAttribute("data-outside") === null,
      );
    expect(has31).toBe(true);
    const target = within(container)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("tabindex") === "0");
    expect(target).toHaveLength(1);
    expect(target[0].textContent).toBe("1");
  });
});
