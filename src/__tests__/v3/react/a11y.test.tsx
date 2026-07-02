import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarMonthsGrid } from "@/modules-v3/months-grid/CalendarMonthsGrid";
import { CalendarPresets } from "@/modules-v3/presets/CalendarPresets";
import { CalendarTimeWheel } from "@/modules-v3/time/CalendarTimeWheel";
import {
  CalendarToolbar,
  CalendarToolbarLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "@/modules-v3/toolbar/CalendarToolbar";
import { Calendar } from "@/react-v3/calendar";
import { commonPresets } from "@/react-v3/index";
import { DatePicker, MonthPicker, SimpleCalendar } from "@/react-v3/prebuilt";
import { buildConfig, D } from "../fixtures/builders";

expect.extend(toHaveNoViolations);

/**
 * WCAG smoke via axe — the v3 counterpart of the v2 a11y suite. Every composed
 * surface must produce zero violations; failures here are release blockers.
 */
describe("v3 a11y — axe", () => {
  it("Calendar + Days: no violations", async () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Calendar + toolbar nav + Days (range mode): no violations", async () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar>
          <CalendarToolbarPrev />
          <CalendarToolbarLabel />
          <CalendarToolbarNext />
        </CalendarToolbar>
        <CalendarDays />
      </Calendar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("month/year triggers + months grid + presets: no violations", async () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbar>
        <CalendarMonthsGrid />
        <CalendarPresets presets={commonPresets} />
      </Calendar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("time wheel (withTime): no violations", async () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single", withTime: true })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
        <CalendarTimeWheel seconds />
      </Calendar>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("prebuilt SimpleCalendar: no violations", async () => {
    const { container } = render(<SimpleCalendar />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("prebuilt DatePicker: no violations", async () => {
    const { container } = render(<DatePicker />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("prebuilt MonthPicker: no violations", async () => {
    const { container } = render(<MonthPicker />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
