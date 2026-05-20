/**
 * @vitest-environment node
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarNav } from "@/modules/nav";
import { CalendarPresets } from "@/modules/presets";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeWheel } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";

const D = new Date(2024, 5, 15);

describe("SSR — renderToString", () => {
  it("renders Days without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain("aria-label");
  });

  it("renders Nav with showTime / clear / themeToggle without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarNav showTime clear themeToggle />
      </Calendar>,
    );
    expect(html).toContain("toolbar");
  });

  it("renders Nav with showNowTime without throwing (live clock is empty pre-hydration)", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarNav showNowTime />
      </Calendar>,
    );
    // The live time slot exists but its inner text is empty until client mounts.
    expect(html).toContain("aria-hidden");
  });

  it("renders TimeWheel without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarTimeWheel />
      </Calendar>,
    );
    expect(html).toContain('role="group"');
  });

  it('data-theme="auto" on SSR — CSS @media (prefers-color-scheme) handles initial paint without flash', () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('data-theme="auto"');
  });

  it("readOnly survives SSR with data-readonly", () => {
    const html = renderToString(
      <Calendar value={D} readOnly>
        <CalendarDays />
      </Calendar>,
    );
    // Plain <div> does not support aria-readonly per ARIA spec — axe flags it.
    // CSS / styling reads data-readonly; per-cell aria-disabled covers the
    // accessibility surface. aria-readonly removed from the wrapper.
    expect(html).toContain('data-readonly="true"');
    expect(html).not.toContain("aria-readonly");
  });

  it("does not contain any 'undefined' or 'NaN' literal text in Days", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).not.toMatch(/>NaN</);
    expect(html).not.toMatch(/>undefined</);
  });

  it("renders MonthsGrid without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarMonthsGrid />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders MonthsTrack without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarMonthsTrack />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders YearsGrid without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarYearsGrid />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders YearsTrack without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarYearsTrack />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders DaysTrack without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDaysTrack />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders SelectedDates without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarSelectedDates />
      </Calendar>,
    );
    expect(typeof html).toBe("string");
  });

  it("renders ManualInput without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarManualInput />
      </Calendar>,
    );
    expect(html).toContain("data-area");
  });

  it("renders Presets without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarPresets presets={[]} />
      </Calendar>,
    );
    expect(typeof html).toBe("string");
  });
});
