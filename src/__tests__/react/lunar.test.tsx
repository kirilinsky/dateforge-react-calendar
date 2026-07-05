import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CalendarDays } from "@/modules/days/CalendarDays";
import { CalendarLunar } from "@/modules/lunar/CalendarLunar";
import { Calendar } from "@/react/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(props: Parameters<typeof CalendarLunar>[0] = {}) {
  return render(
    <Calendar config={buildConfig()} initialView={D(2026, 6, 1)}>
      <CalendarDays />
      <CalendarLunar {...props} />
    </Calendar>,
  );
}

describe("CalendarLunar", () => {
  it("renders 21 lunar cells", () => {
    const { container } = setup();
    const cells = container.querySelectorAll("[role=listitem]");
    expect(cells).toHaveLength(21);
  });

  it("strip has role=list and aria-label", () => {
    const { container } = setup({ lunarLabel: "Moon phases" });
    const list = container.querySelector("[role=list]");
    expect(list?.getAttribute("aria-label")).toBe("Moon phases");
  });

  it("exactly one cell has aria-current=date (anchor)", () => {
    const { container } = setup();
    const lunar = container.querySelector("[data-dateforge-lunar]");
    const anchors = lunar?.querySelectorAll("[aria-current=date]") ?? [];
    expect(anchors).toHaveLength(1);
  });

  it("each cell has data-phase attribute", () => {
    const { container } = setup();
    const cells = container.querySelectorAll("[role=listitem]");
    for (const cell of cells) {
      expect(cell.getAttribute("data-phase")).toBeTruthy();
    }
  });

  it("anchor shifts when a day is selected", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    await user.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    const anchor = container.querySelector("[data-anchor]");
    expect(anchor).toBeTruthy();
  });

  it("phaseLabels=false hides phase text labels", () => {
    const { container } = setup({ phaseLabels: false });
    // No .label spans should be rendered
    const labels = container.querySelectorAll("[aria-hidden][class*=label]");
    expect(labels).toHaveLength(0);
  });

  it("each cell carries a date+phase aria-label (no visible helper text)", () => {
    const { container } = setup();
    const cell = container.querySelector("[role=listitem]");
    expect(cell?.getAttribute("aria-label")).toMatch(/2026/);
    // The old sr-only span is gone — day number is the only text besides the
    // phase abbreviation.
    expect(cell?.textContent).not.toMatch(/2026/);
  });

  it("root labels prop overrides the strip aria-label (registry chain)", () => {
    const { container } = render(
      <Calendar
        config={buildConfig()}
        initialView={D(2026, 6, 1)}
        labels={{ lunar: "Луна" }}
      >
        <CalendarLunar />
      </Calendar>,
    );
    const list = container.querySelector("[role=list]");
    expect(list?.getAttribute("aria-label")).toBe("Луна");
  });

  it("applies the container class (container queries alive)", () => {
    const { container } = setup();
    const root = container.querySelector("[data-dateforge-lunar]");
    expect(root?.className).toMatch(/container/);
  });

  it("per-module theme renders data-theme on the container", () => {
    const { container } = setup({ theme: "velvet", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-lunar]");
    expect(root?.getAttribute("data-theme")).toBe("velvet");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });

  it("fallback anchor is the viewed day (not the 1st of month)", () => {
    const { container } = render(
      <Calendar config={buildConfig()} initialView={D(2026, 6, 15)}>
        <CalendarLunar />
      </Calendar>,
    );
    const anchor = container.querySelector("[data-anchor]");
    expect(anchor?.textContent).toMatch(/15/);
  });
});
