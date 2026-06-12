import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarSelectedDates } from "@/modules-v3/selected-dates/CalendarSelectedDates";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  mode: "single" | "multiple" | "range" = "single",
  props: Parameters<typeof CalendarSelectedDates>[0] = {},
  onChange?: (v: unknown, d: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarSelectedDates {...props} />
    </Calendar>,
  );
}

describe("CalendarSelectedDates", () => {
  it("renders nothing when no dates selected", () => {
    const { container } = setup();
    expect(
      container.querySelector("[data-dateforge-selected-dates]"),
    ).toBeNull();
  });

  it("shows a chip after selecting a day (single mode)", async () => {
    const user = userEvent.setup();
    setup("single");
    await user.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    // At least one chip rendered — Jun 15 date
    const chip = document
      .querySelector("[data-dateforge-selected-dates]")
      ?.querySelector("button");
    expect(chip).toBeTruthy();
  });

  it("shows allowClear button that clears selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup("single", { allowClear: true }, onChange);
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    const clearBtn = screen.getByLabelText("Clear");
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0]).toBeNull();
  });

  it("allowClearPerChip shows × remove button per chip", async () => {
    const user = userEvent.setup();
    setup("single", { allowClearPerChip: true });
    await user.click(
      document.querySelector('[data-date="20260605"]') as HTMLElement,
    );
    expect(screen.getByLabelText("Remove selected date")).toBeTruthy();
  });

  it("renders start–end chips for range mode", async () => {
    const user = userEvent.setup();
    setup("range");
    await user.click(
      document.querySelector('[data-date="20260605"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    const container = document.querySelector("[data-dateforge-selected-dates]");
    // sep element present
    const sep = container?.querySelector("[aria-hidden]");
    expect(sep?.textContent).toBe("–");
  });

  it("multiple chips for multiple mode", async () => {
    const user = userEvent.setup();
    setup("multiple");
    await user.click(
      document.querySelector('[data-date="20260601"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260602"]') as HTMLElement,
    );
    const container = document.querySelector("[data-dateforge-selected-dates]");
    const buttons = container?.querySelectorAll("button");
    expect(buttons?.length).toBeGreaterThanOrEqual(2);
  });
});
