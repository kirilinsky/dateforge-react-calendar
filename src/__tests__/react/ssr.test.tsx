/**
 * @vitest-environment node
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { calendarDate } from "@/core/calendar-date";
import { MIDNIGHT } from "@/core/calendar-time";
import { compileDateRules } from "@/core/date-rule-engine";
import type { CalendarConfig } from "@/core/state";
import { CalendarDays } from "@/modules/days/CalendarDays";
import {
  CalendarToolbar,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearTrigger,
} from "@/modules/toolbar/CalendarToolbar";
import { Calendar } from "@/react/calendar";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(over: Partial<CalendarConfig> = {}): CalendarConfig {
  return {
    unit: "day",
    mode: "single",
    firstDayOfWeek: 1,
    locale: "en-US",
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

// Node environment: no DOM, no window. This exercises the deterministic
// getServerSnapshot path of useSyncExternalStore — a missing/throwing server
// snapshot would crash renderToString here.
describe("v3 SSR — renderToString", () => {
  it("renders Days without crashing and emits the grid markup", () => {
    const html = renderToString(
      <Calendar config={config()} initialView={D(2026, 6, 1)}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain('data-dateforge-root=""');
  });

  it("renders the toolbar + triggers on the server (popups stay closed)", () => {
    const html = renderToString(
      <Calendar config={config()} initialView={D(2026, 6, 1)}>
        <CalendarToolbar>
          <CalendarToolbarPrev />
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
          <CalendarToolbarNext />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(html).toContain('role="toolbar"');
    // Trigger shows the view month/year; popup dialog must NOT render on server
    // (CalendarPopup mounts client-only).
    expect(html).toContain("June");
    expect(html).toContain("2026");
    expect(html).not.toContain('role="dialog"');
  });

  it("is deterministic — same markup across two server renders", () => {
    const tree = (
      <Calendar config={config()} initialView={D(2026, 6, 1)}>
        <CalendarDays />
      </Calendar>
    );
    expect(renderToString(tree)).toBe(renderToString(tree));
  });

  it("reflects a seeded selection in server markup", () => {
    const html = renderToString(
      <Calendar
        config={config()}
        initialView={D(2026, 6, 1)}
        defaultSelection={{
          shape: "point",
          dates: [{ date: D(2026, 6, 5), time: MIDNIGHT }],
        }}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('aria-selected="true"');
  });
});
