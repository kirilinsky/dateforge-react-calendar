import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { compileDateRules } from "@/core/date-rule-engine";
import type { SelectionState } from "@/core/state";
import { CalendarMonthsGrid } from "@/modules/months-grid/CalendarMonthsGrid";
import { Calendar } from "@/react/calendar";
import { buildConfig, D, point } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarMonthsGrid>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
  defaultSelection?: SelectionState,
) {
  return render(
    <Calendar
      config={buildConfig(overrides)}
      initialView={D(2026, 6, 1)}
      defaultSelection={defaultSelection}
    >
      <CalendarMonthsGrid {...props} />
    </Calendar>,
  );
}

describe("CalendarMonthsGrid", () => {
  it("renders 12 month buttons", () => {
    setup();
    expect(screen.getAllByRole("button")).toHaveLength(12);
  });

  it("marks current month with aria-current", () => {
    setup();
    const current = document.querySelector("[aria-current='true']");
    expect(current).toBeTruthy();
    // June is month 6 (index 5 = "Jun")
    expect(current?.getAttribute("aria-label")).toMatch(/june/i);
  });

  it("clicking a month navigates view and calls onMonthSelect", async () => {
    const onMonthSelect = vi.fn();
    const user = userEvent.setup();
    setup({ onMonthSelect });
    // Click March (3rd button, label aria = "March")
    const marchBtn = screen.getByLabelText(/march/i);
    await user.click(marchBtn);
    expect(onMonthSelect).toHaveBeenCalledWith(2026, 3);
  });

  it("disabled months have aria-disabled", () => {
    // min = July 2026 → months Jan-Jun of 2026 out of range
    setup({}, { min: D(2026, 7, 1) });
    const janBtn = screen.getByLabelText(/january/i);
    expect(janBtn.getAttribute("aria-disabled")).toBe("true");
  });

  it("group has aria-label with year", () => {
    setup();
    const group = screen.getByRole("group");
    expect(group.getAttribute("aria-label")).toMatch(/2026/);
  });

  it("readOnly makes all months aria-disabled", () => {
    setup({}, { readOnly: true });
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn.getAttribute("aria-disabled")).toBe("true");
    }
  });

  it("disables a month fully blocked by disabled rules", () => {
    // Disable every day in March 2026 → March tile is aria-disabled.
    setup(
      {},
      {
        disabled: compileDateRules({
          ranges: [{ start: D(2026, 3, 1), end: D(2026, 3, 31) }],
        }),
      },
    );
    const march = screen.getByLabelText(/march/i);
    expect(march.getAttribute("aria-disabled")).toBe("true");
    // A non-disabled month stays enabled.
    const april = screen.getByLabelText(/april/i);
    expect(april.getAttribute("aria-disabled")).toBeNull();
  });

  it("outOfRangeBehavior='hide' hides out-of-range months from a11y tree", () => {
    setup({ outOfRangeBehavior: "hide" }, { min: D(2026, 7, 1) });
    const jan = screen.getByLabelText(/january/i);
    expect(jan.getAttribute("aria-hidden")).toBe("true");
    expect(jan).toHaveStyle({ visibility: "hidden" });
  });

  it("outOfRangeBehavior='show' keeps out-of-range months interactive", async () => {
    const onMonthSelect = vi.fn();
    const user = userEvent.setup();
    setup(
      { outOfRangeBehavior: "show", onMonthSelect },
      { min: D(2026, 7, 1) },
    );
    const jan = screen.getByLabelText(/january/i);
    expect(jan.getAttribute("aria-disabled")).toBeNull();
    await user.click(jan);
    expect(onMonthSelect).toHaveBeenCalledWith(2026, 1);
  });

  it("announces a month holding a selected date", () => {
    setup({}, {}, point({ d: D(2026, 3, 15) }));
    expect(screen.getByLabelText(/march, selected/i)).toBeTruthy();
  });

  it("applies a per-module theme override on the container", () => {
    const { container } = setup({ theme: "espresso", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-months-grid]");
    expect(root?.getAttribute("data-theme")).toBe("espresso");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });
});
