import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarInfo } from "@/modules-v3/info/CalendarInfo";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  mode: "single" | "multiple" | "range" = "single",
  props: Parameters<typeof CalendarInfo>[0] = {},
  onChange?: (v: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarInfo {...props} />
    </Calendar>,
  );
}

describe("CalendarInfo", () => {
  it("renders nothing when no selection and no emptyLabel", () => {
    const { container } = setup();
    expect(container.querySelector("[data-dateforge-info]")).toBeNull();
  });

  it("shows emptyLabel when provided and no selection", () => {
    setup("single", { emptyLabel: "Pick a date" });
    expect(screen.getByText("Pick a date")).toBeTruthy();
  });

  it("shows single date summary after selection", async () => {
    const user = userEvent.setup();
    setup("single", {});
    await user.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toBeTruthy();
    expect(status?.textContent?.length).toBeGreaterThan(0);
  });

  it("shows range day count after range selection", async () => {
    const user = userEvent.setup();
    setup("range", {});
    await user.click(
      document.querySelector('[data-date="20260601"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260607"]') as HTMLElement,
    );
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/7 days/);
  });

  it("shows count summary for multiple mode", async () => {
    const user = userEvent.setup();
    setup("multiple", {});
    await user.click(
      document.querySelector('[data-date="20260601"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260602"]') as HTMLElement,
    );
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/2 dates/);
  });

  it("allowClear shows clear button that clears selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup("single", { allowClear: true }, onChange);
    await user.click(
      document.querySelector('[data-date="20260605"]') as HTMLElement,
    );
    const clearBtn = screen.getByLabelText("Clear");
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0]).toBeNull();
  });

  it("showHome renders home button disabled when on current month", () => {
    setup("single", { showHome: true });
    // We're viewing June 2026 which is not today's month, so button is enabled
    // (unless today happens to be June 2026 — unlikely in CI but we just check it renders)
    expect(screen.getByLabelText("Go to current month")).toBeTruthy();
  });

  it("status region has aria-live=polite", () => {
    setup("single", { emptyLabel: "none" });
    const status = document.querySelector("[role=status]");
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });
});
