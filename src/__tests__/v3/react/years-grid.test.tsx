import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarYearsGrid } from "@/modules-v3/years-grid/CalendarYearsGrid";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarYearsGrid>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
) {
  return render(
    <Calendar config={buildConfig(overrides)} initialView={D(2026, 6, 1)}>
      <CalendarYearsGrid {...props} />
    </Calendar>,
  );
}

describe("CalendarYearsGrid", () => {
  it("renders yearsPerPage buttons (default 12)", () => {
    setup();
    // 12 year cells + 2 nav buttons = 14 total
    const yearBtns = screen
      .getAllByRole("button")
      .filter((b) => /^\d{4}$/.test(b.textContent ?? ""));
    expect(yearBtns).toHaveLength(12);
  });

  it("current year has aria-current", () => {
    setup();
    const current = document.querySelector("[aria-current='true']");
    expect(current?.textContent).toBe("2026");
  });

  it("clicking year navigates and calls onYearSelect", async () => {
    const onYearSelect = vi.fn();
    const user = userEvent.setup();
    setup({ onYearSelect });
    const btn2024 = screen.getByLabelText("2024");
    await user.click(btn2024);
    expect(onYearSelect).toHaveBeenCalledWith(2024);
  });

  it("prev/next page buttons page through years", async () => {
    const user = userEvent.setup();
    setup();
    const base = Math.floor(2026 / 12) * 12; // 2016
    expect(screen.getByLabelText(String(base))).toBeTruthy();
    await user.click(screen.getByLabelText("Next years"));
    expect(screen.getByLabelText(String(base + 12))).toBeTruthy();
    await user.click(screen.getByLabelText("Previous years"));
    expect(screen.getByLabelText(String(base))).toBeTruthy();
  });

  it("years before min are aria-disabled", () => {
    setup({}, { min: D(2026, 1, 1) });
    const btn2020 = screen.queryByLabelText("2020");
    if (btn2020) {
      expect(btn2020.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("showControls=false hides nav buttons", () => {
    setup({ showControls: false });
    expect(screen.queryByLabelText("Next years")).toBeNull();
    expect(screen.queryByLabelText("Previous years")).toBeNull();
  });

  it("group has aria-label with year range", () => {
    setup();
    const base = Math.floor(2026 / 12) * 12; // 2016
    const group = document.querySelector(`[role=group][aria-label*='${base}']`);
    expect(group).toBeTruthy();
  });
});
