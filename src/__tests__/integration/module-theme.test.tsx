import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarInfo } from "@/modules/info";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarNav } from "@/modules/nav";
import { CalendarPresets } from "@/modules/presets";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";
import { createTheme } from "@/utils/create-theme";

const D = new Date(2024, 5, 15);

describe("module-local themes", () => {
  it("lets a module theme override the root calendar theme", () => {
    const rootTheme = createTheme({
      light: { highlight: "#111111" },
      dark: { highlight: "#eeeeee" },
    });
    const infoTheme = createTheme({
      light: { highlight: "#c026d3" },
      dark: { highlight: "#f0abfc" },
    });

    const { container } = render(
      <Calendar value={D} theme={rootTheme}>
        <CalendarInfo theme={infoTheme} />
        <CalendarDays />
      </Calendar>,
    );

    const root = container.firstElementChild as HTMLElement;
    const info = container.querySelector(
      '[data-area="calendar-info"]',
    ) as HTMLElement;
    const days = container.querySelector('[data-area="days"]') as HTMLElement;

    expect(root.style.getPropertyValue("--c-h")).toBe("#111111");
    expect(info.style.getPropertyValue("--c-h")).toBe("#c026d3");
    expect(days.style.getPropertyValue("--c-h")).toBe("");
  });

  it("resolves a module theme family with the active root mode", () => {
    const rootTheme = createTheme({
      light: { highlight: "#111111" },
      dark: { highlight: "#eeeeee" },
    });
    const infoTheme = createTheme({
      light: { highlight: "#c026d3" },
      dark: { highlight: "#f0abfc" },
    });

    const { container } = render(
      <Calendar value={D} theme={rootTheme}>
        <CalendarNav themeToggle />
        <CalendarInfo theme={infoTheme} />
      </Calendar>,
    );

    const info = container.querySelector(
      '[data-area="calendar-info"]',
    ) as HTMLElement;
    expect(info.style.getPropertyValue("--c-h")).toBe("#c026d3");

    fireEvent.click(screen.getByLabelText("Switch to dark mode"));

    expect(info.style.getPropertyValue("--c-h")).toBe("#f0abfc");
  });

  it("resolves a module theme family from an explicit root mode flag", () => {
    const rootTheme = createTheme({
      light: { highlight: "#111111" },
      dark: { highlight: "#eeeeee" },
    });
    const infoTheme = createTheme({
      light: { highlight: "#c026d3" },
      dark: { highlight: "#f0abfc" },
    });

    const { container } = render(
      <Calendar value={D} theme={rootTheme} dark>
        <CalendarInfo theme={infoTheme} />
      </Calendar>,
    );

    const info = container.querySelector(
      '[data-area="calendar-info"]',
    ) as HTMLElement;
    expect(info.style.getPropertyValue("--c-h")).toBe("#f0abfc");
  });

  it("supports built-in string themes on module roots", () => {
    const { container } = render(
      <Calendar value={[D]} mode="multiple">
        <CalendarNav label="Calendar controls" theme="dark" />
        <CalendarDays theme="dark" />
        <CalendarDaysTrack theme="dark" />
        <CalendarManualInput theme="light" />
        <CalendarMonthsGrid theme="dark" />
        <CalendarMonthsTrack theme="dark" />
        <CalendarPresets
          presets={[{ label: "June 15", value: D }]}
          theme="dark"
        />
        <CalendarSelectedDates animated={false} theme="dark" />
        <CalendarTimeGrid theme="dark" />
        <CalendarYearsGrid theme="dark" />
        <CalendarYearsTrack theme="dark" />
      </Calendar>,
    );

    for (const area of [
      "header",
      "days",
      "days-track",
      "months",
      "months-track",
      "presets",
      "selected-dates",
      "time",
      "years-grid",
      "years-track",
    ]) {
      expect(container.querySelector(`[data-area="${area}"]`)).toHaveAttribute(
        "data-theme",
        "dark",
      );
    }
    expect(
      container.querySelector('[data-area="manual-input"]'),
    ).toHaveAttribute("data-theme", "light");
  });
});
