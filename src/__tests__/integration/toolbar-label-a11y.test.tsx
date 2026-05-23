import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { TestToolbar } from "../helpers/test-toolbar";

const getToolbar = (container: HTMLElement) =>
  container.querySelector('[role="toolbar"]') as HTMLElement;

describe("Toolbar — label a11y", () => {
  it("toolbar uses default aria-label when no label prop is set", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showMonthPicker />
      </Calendar>,
    );
    const toolbar = getToolbar(container);
    expect(toolbar.getAttribute("aria-label")).toBe("Calendar navigation");
    expect(toolbar.getAttribute("aria-labelledby")).toBeNull();
  });

  it("calendarNavigationLabel overrides the toolbar aria-label", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar
          calendarNavigationLabel="Booking controls"
          showMonthPicker
        />
      </Calendar>,
    );
    const toolbar = getToolbar(container);
    expect(toolbar.getAttribute("aria-label")).toBe("Booking controls");
  });

  it("label prop renders a visible heading without replacing toolbar aria-label", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showMonthPicker label="Booking date" />
      </Calendar>,
    );
    const toolbar = getToolbar(container);
    expect(toolbar.getAttribute("aria-label")).toBe("Calendar navigation");
    const heading = container.querySelector('[role="heading"]');
    expect(heading?.getAttribute("aria-level")).toBe("2");
    expect(heading?.textContent).toBe("Booking date");
  });
});
