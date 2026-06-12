import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonthsGrid } from "@/modules-v3/months-grid/CalendarMonthsGrid";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarMonthsGrid>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
) {
  return render(
    <Calendar config={buildConfig(overrides)} initialView={D(2026, 6, 1)}>
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
});
