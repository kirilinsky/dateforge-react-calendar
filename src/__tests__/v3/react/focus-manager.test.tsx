import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calendarDate, dateKey } from "@/core-v3/calendar-date";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { Calendar } from "@/react-v3/calendar";
import {
  type InitialFocus,
  resolveInitialFocus,
} from "@/react-v3/focus-manager";
import { buildConfig, D } from "../fixtures/builders";

// First DOM focus is owned by the Calendar root (Focus Manager), not the bare
// provider — so these render the real root.
function setup(initialFocus?: InitialFocus) {
  return render(
    <Calendar
      config={buildConfig()}
      initialView={D(2026, 6, 1)}
      initialFocus={initialFocus}
    >
      <CalendarDays />
    </Calendar>,
  );
}

const cell = (container: HTMLElement, d: ReturnType<typeof D>) =>
  container.querySelector<HTMLElement>(`[data-date="${dateKey(d)}"]`);

describe("resolveInitialFocus", () => {
  const view = calendarDate(2026, 6, 1);

  it("returns undefined for false / omitted", () => {
    expect(resolveInitialFocus(false, view)).toBeUndefined();
    expect(resolveInitialFocus(undefined, view)).toBeUndefined();
  });

  it('"view" resolves to the view anchor', () => {
    expect(resolveInitialFocus("view", view)).toEqual(view);
  });

  it("a specific date passes through", () => {
    const d = calendarDate(2026, 6, 15);
    expect(resolveInitialFocus(d, view)).toEqual(d);
  });
});

describe("Focus Manager · first focus", () => {
  it("does NOT steal focus on mount by default", () => {
    const { container } = setup();
    // No day cell holds focus; the default must not grab focus or scroll.
    expect(cell(container, D(2026, 6, 1))).not.toBe(document.activeElement);
    expect(document.activeElement?.getAttribute("role")).not.toBe("gridcell");
  });

  it('initialFocus="view" focuses the view-anchor day on mount', () => {
    const { container } = setup("view");
    expect(document.activeElement).toBe(cell(container, D(2026, 6, 1)));
  });

  it("initialFocus={date} focuses that specific day on mount", () => {
    const { container } = setup(D(2026, 6, 15));
    expect(document.activeElement).toBe(cell(container, D(2026, 6, 15)));
  });
});
