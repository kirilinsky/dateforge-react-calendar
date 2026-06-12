import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarYearsWheel } from "@/modules-v3/years-wheel/CalendarYearsWheel";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarYearsWheel>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
  onViewChange?: (v: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single", ...overrides })}
      initialView={D(2026, 6, 1)}
      onViewChange={onViewChange}
    >
      <CalendarYearsWheel {...props} />
    </Calendar>,
  );
}

describe("CalendarYearsWheel", () => {
  it("renders a single years drum", () => {
    const { container } = setup();
    const drums = container.querySelectorAll(
      "[data-dateforge-years-wheel] [role=spinbutton]",
    );
    expect(drums).toHaveLength(1);
  });

  it("drum value text reflects the view year", () => {
    const { container } = setup();
    const drum = container.querySelector("[role=spinbutton]");
    expect(drum?.getAttribute("aria-valuetext")).toBe("2026");
  });

  it("ArrowDown navigates to the next year", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({}, {}, onViewChange);
    const drum = container.querySelector("[role=spinbutton]") as HTMLElement;
    drum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onViewChange).toHaveBeenCalled();
    const [view] = onViewChange.mock.calls.at(-1) ?? [];
    expect((view as { year: number }).year).toBe(2027);
  });

  it("config min/max bound the year window", () => {
    const { container } = setup(
      {},
      { min: D(2020, 1, 1), max: D(2030, 12, 31) },
    );
    const drum = container.querySelector("[role=spinbutton]");
    // Offset values: minYear 2020 → 0, maxYear 2030 → 10.
    expect(drum?.getAttribute("aria-valuemin")).toBe("0");
    expect(drum?.getAttribute("aria-valuemax")).toBe("10");
  });

  it("root labels prop overrides the picker aria-label", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
        labels={{ yearPicker: "Год" }}
      >
        <CalendarYearsWheel />
      </Calendar>,
    );
    const group = container.querySelector("[role=group]");
    expect(group?.getAttribute("aria-label")).toBe("Год");
  });

  it("showReset navigates back to the current year", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2020, 6, 1)}
        onViewChange={onViewChange}
      >
        <CalendarYearsWheel showReset />
      </Calendar>,
    );
    const reset = container.querySelector(
      "[data-dateforge-years-wheel] button[aria-label]",
    ) as HTMLElement;
    expect(reset).toBeTruthy();
    await user.click(reset);
    const [view] = onViewChange.mock.calls.at(-1) ?? [];
    // Resets year to the machine's current year, keeps the viewed month.
    expect((view as { year: number }).year).toBe(new Date().getFullYear());
    expect((view as { month: number }).month).toBe(6);
  });

  it("per-module theme renders data-theme on the container", () => {
    const { container } = setup({ theme: "velvet", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-years-wheel]");
    expect(root?.getAttribute("data-theme")).toBe("velvet");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });
});
