import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarMonthsWheel } from "@/modules-v3/months-wheel/CalendarMonthsWheel";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarMonthsWheel>[0] = {},
  onViewChange?: (v: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
      onViewChange={onViewChange}
    >
      <CalendarMonthsWheel {...props} />
    </Calendar>,
  );
}

describe("CalendarMonthsWheel", () => {
  it("renders a single months drum", () => {
    const { container } = setup();
    const drums = container.querySelectorAll(
      "[data-dateforge-months-wheel] [role=spinbutton]",
    );
    expect(drums).toHaveLength(1);
  });

  it("drum reflects the view month (0-based)", () => {
    const { container } = setup();
    const drum = container.querySelector("[role=spinbutton]");
    // June → month index 5.
    expect(drum?.getAttribute("aria-valuenow")).toBe("5");
  });

  it("group has the picker aria-label", () => {
    const { container } = setup({ monthPickerLabel: "Pick month" });
    const group = container.querySelector("[role=group]");
    expect(group?.getAttribute("aria-label")).toBe("Pick month");
  });

  it("ArrowDown navigates to the next month", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({}, onViewChange);
    const drum = container.querySelector("[role=spinbutton]") as HTMLElement;
    drum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onViewChange).toHaveBeenCalled();
    const [view] = onViewChange.mock.calls.at(-1) ?? [];
    expect((view as { month: number }).month).toBe(7);
  });

  it("root labels prop overrides the picker aria-label", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
        labels={{ monthPicker: "Месяц" }}
      >
        <CalendarMonthsWheel />
      </Calendar>,
    );
    const group = container.querySelector("[role=group]");
    expect(group?.getAttribute("aria-label")).toBe("Месяц");
  });

  it("showReset navigates back to the current month", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 2, 1)}
        onViewChange={onViewChange}
      >
        <CalendarMonthsWheel showReset />
      </Calendar>,
    );
    const reset = container.querySelector(
      "[data-dateforge-months-wheel] button[aria-label]",
    ) as HTMLElement;
    expect(reset).toBeTruthy();
    await user.click(reset);
    const [view] = onViewChange.mock.calls.at(-1) ?? [];
    // Resets month to the machine's current month, keeps the viewed year.
    expect((view as { month: number }).month).toBe(new Date().getMonth() + 1);
    expect((view as { year: number }).year).toBe(2026);
  });

  it("per-module theme renders data-theme on the container", () => {
    const { container } = setup({ theme: "velvet", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-months-wheel]");
    expect(root?.getAttribute("data-theme")).toBe("velvet");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });

  it("onMonthSelect fires with year and 1-based month", async () => {
    const onMonthSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({ onMonthSelect });
    const drum = container.querySelector("[role=spinbutton]") as HTMLElement;
    drum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onMonthSelect).toHaveBeenCalledWith(2026, 7);
  });
});
