import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { SelectionState } from "@/core-v3/state";
import { CalendarYearsGrid } from "@/modules-v3/years-grid/CalendarYearsGrid";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D, point } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarYearsGrid>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
  defaultSelection?: SelectionState,
) {
  return render(
    <Calendar
      config={buildConfig(overrides)}
      initialView={D(2026, 6, 1)}
      defaultSelection={defaultSelection}
    >
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

  it("disables a year fully blocked by disabled rules", () => {
    // Disable all of 2024 → its tile is aria-disabled, neighbours stay enabled.
    setup(
      {},
      {
        disabled: compileDateRules({
          ranges: [{ start: D(2024, 1, 1), end: D(2024, 12, 31) }],
        }),
      },
    );
    expect(screen.getByLabelText("2024").getAttribute("aria-disabled")).toBe(
      "true",
    );
    expect(
      screen.getByLabelText("2023").getAttribute("aria-disabled"),
    ).toBeNull();
  });

  it("outOfRangeBehavior='hide' hides out-of-range years", () => {
    setup({ outOfRangeBehavior: "hide" }, { min: D(2026, 1, 1) });
    const y2020 = screen.getByLabelText("2020");
    expect(y2020.getAttribute("aria-hidden")).toBe("true");
    expect(y2020).toHaveStyle({ visibility: "hidden" });
  });

  it("outOfRangeBehavior='show' keeps out-of-range years interactive", async () => {
    const onYearSelect = vi.fn();
    const user = userEvent.setup();
    setup({ outOfRangeBehavior: "show", onYearSelect }, { min: D(2026, 1, 1) });
    const y2020 = screen.getByLabelText("2020");
    expect(y2020.getAttribute("aria-disabled")).toBeNull();
    await user.click(y2020);
    expect(onYearSelect).toHaveBeenCalledWith(2020);
  });

  it("announces a selected year", () => {
    setup({}, {}, point({ d: D(2024, 3, 15) }));
    expect(screen.getByLabelText(/2024, selected/i)).toBeTruthy();
  });

  it("applies a per-module theme override on the container", () => {
    const { container } = setup({ theme: "espresso", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-years-grid]");
    expect(root?.getAttribute("data-theme")).toBe("espresso");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });

  it("pager stops at max bound instead of paging forever", async () => {
    const user = userEvent.setup();
    setup({}, { max: D(2030, 12, 31) }); // maxBase = floor(2030/12)*12 = 2028
    await user.click(screen.getByLabelText("Next years")); // → base 2028
    expect(
      screen.getByLabelText("Next years").getAttribute("disabled"),
    ).not.toBeNull();
  });

  it("does not drift the page after navigating within it", async () => {
    const user = userEvent.setup();
    setup(); // base 2016 (2016–2027)
    await user.click(screen.getByLabelText("Next years")); // → 2028–2039
    expect(screen.getByLabelText("2028")).toBeTruthy();
    await user.click(screen.getByLabelText("2030")); // navigate within page
    // page stays pinned (2030 is on it), 2028 still shown — no jump back.
    expect(screen.getByLabelText("2028")).toBeTruthy();
  });
});
