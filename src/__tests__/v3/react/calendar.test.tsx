import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarConfig } from "@/core-v3/state";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { Calendar } from "@/react-v3/calendar";
import { createTheme } from "@/styles-v3/theme-tokens";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(over: Partial<CalendarConfig> = {}): CalendarConfig {
  return {
    unit: "day",
    mode: "single",
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

describe("Calendar root", () => {
  it("renders the shell with theme + testid and wraps the store", () => {
    const { getByTestId } = render(
      <Calendar config={config()} initialView={D(2026, 6, 1)} theme="noir">
        <CalendarDays />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.getAttribute("data-dateforge-root")).toBe("");
    expect(root.getAttribute("data-theme")).toBe("noir");
    expect(within(root).getAllByRole("gridcell")).toHaveLength(42);
  });

  it("defaults theme/scheme and omits data-readonly when writable", () => {
    const { getByTestId } = render(
      <Calendar config={config()} initialView={D(2026, 6, 1)}>
        <CalendarDays />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.getAttribute("data-theme")).toBe("noir");
    expect(root.getAttribute("data-scheme")).toBe("auto");
    expect(root.getAttribute("data-readonly")).toBeNull();
  });

  it("reflects an explicit theme and scheme", () => {
    const { getByTestId } = render(
      <Calendar
        config={config()}
        initialView={D(2026, 6, 1)}
        theme="meadow"
        scheme="dark"
      >
        <CalendarDays />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.getAttribute("data-theme")).toBe("meadow");
    expect(root.getAttribute("data-scheme")).toBe("dark");
  });

  it("applies a createTheme family as inline light-dark vars (no data-theme)", () => {
    const family = createTheme({
      accent: "#14b8a6",
      light: { backdrop: "#ffffff" },
      dark: { backdrop: "#111111" },
    });
    const { getByTestId } = render(
      <Calendar config={config()} initialView={D(2026, 6, 1)} theme={family}>
        <CalendarDays />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.getAttribute("data-theme")).toBeNull();
    expect(root.style.getPropertyValue("--c-accent")).toBe("#14b8a6");
    expect(root.style.getPropertyValue("--c-backdrop")).toBe(
      "light-dark(#ffffff, #111111)",
    );
  });

  it("cols: a number sets equal grid tracks; omitted leaves none", () => {
    const { getByTestId, rerender } = render(
      <Calendar config={config()} initialView={D(2026, 6, 1)} cols={3}>
        <CalendarDays />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.style.gridTemplateColumns).toBe("repeat(3, minmax(0, 1fr))");
    rerender(
      <Calendar config={config()} initialView={D(2026, 6, 1)}>
        <CalendarDays />
      </Calendar>,
    );
    expect(getByTestId("dateforge-calendar").style.gridTemplateColumns).toBe(
      "",
    );
  });

  it("cols: a string is used as a raw grid-template-columns", () => {
    const { getByTestId } = render(
      <Calendar config={config()} initialView={D(2026, 6, 1)} cols="1fr 2fr">
        <CalendarDays col="1 / 3" />
      </Calendar>,
    );
    const root = getByTestId("dateforge-calendar");
    expect(root.style.gridTemplateColumns).toBe("1fr 2fr");
    // The module places itself with `col` (raw string → verbatim grid-column).
    const placed = root.querySelector(
      "[data-dateforge-days]",
    ) as HTMLElement | null;
    expect(placed?.style.gridColumn).toBe("1 / 3");
  });

  it("marks data-readonly for a read-only config", () => {
    const { getByTestId } = render(
      <Calendar
        config={config({ readOnly: true })}
        initialView={D(2026, 6, 1)}
        data-testid="cal"
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(getByTestId("cal").getAttribute("data-readonly")).toBe("");
  });
});
