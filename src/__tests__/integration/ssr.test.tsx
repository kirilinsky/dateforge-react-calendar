/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { CalendarTimeGrid } from "@/modules/time";

const D = new Date(2024, 5, 15);

describe("SSR — renderToString", () => {
  it("renders Days without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('role="grid"');
    expect(html).toContain('aria-label');
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

  it("renders TimeGrid without crashing", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarTimeGrid />
      </Calendar>,
    );
    expect(html).toContain('role="group"');
  });

  it("data-theme is stable on initial server render (defaults to light)", () => {
    const html = renderToString(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('data-theme="light"');
  });

  it("readOnly survives SSR with aria-readonly", () => {
    const html = renderToString(
      <Calendar value={D} readOnly>
        <CalendarDays />
      </Calendar>,
    );
    expect(html).toContain('aria-readonly="true"');
    expect(html).toContain('data-readonly="true"');
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
});
