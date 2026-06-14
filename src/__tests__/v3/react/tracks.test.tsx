import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CalendarDaysTrack } from "@/modules-v3/days-track/CalendarDaysTrack";
import { CalendarMonthsTrack } from "@/modules-v3/months-track/CalendarMonthsTrack";
import { CalendarYearsTrack } from "@/modules-v3/years-track/CalendarYearsTrack";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  ui: ReactNode,
  over: Parameters<typeof buildConfig>[0] = {},
  initialView = D(2026, 6, 15),
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single", ...over })}
      initialView={initialView}
    >
      {ui}
    </Calendar>,
  );
}

const trackEl = (c: HTMLElement, area: string) =>
  c.querySelector(`[data-area='${area}']`);

describe("Calendar tracks", () => {
  it("months track is a spinbutton on the view month", () => {
    const { container } = setup(<CalendarMonthsTrack />);
    const sb = trackEl(container, "months-track");
    expect(sb?.getAttribute("role")).toBe("spinbutton");
    expect(sb?.getAttribute("aria-valuenow")).toBe("6"); // June
    expect(sb?.getAttribute("aria-valuetext")).toMatch(/June/);
    expect(sb?.getAttribute("aria-label")).toBeTruthy();
  });

  it("years track spans the configured window", () => {
    const { container } = setup(
      <CalendarYearsTrack minYear={2020} maxYear={2030} />,
    );
    const sb = trackEl(container, "years-track");
    expect(sb?.getAttribute("aria-valuemin")).toBe("2020");
    expect(sb?.getAttribute("aria-valuemax")).toBe("2030");
    expect(sb?.getAttribute("aria-valuenow")).toBe("2026");
  });

  it("days track: valuenow = view day, valuemax = days in month", () => {
    const { container } = setup(<CalendarDaysTrack />);
    const sb = trackEl(container, "days-track");
    expect(sb?.getAttribute("aria-valuenow")).toBe("15");
    expect(sb?.getAttribute("aria-valuemax")).toBe("30"); // June = 30 days
  });

  it("virtualizes a half-window of items with one active", () => {
    const { container } = setup(<CalendarMonthsTrack />);
    const items = container.querySelectorAll(
      "[data-area='months-track'] [data-item]",
    );
    expect(items).toHaveLength(4 * 2 + 1); // half=4
    expect(
      container.querySelector("[data-item][aria-hidden='false']"),
    ).toBeTruthy();
  });

  it("clamps the months track to min/max within the year", () => {
    const { container } = setup(<CalendarMonthsTrack />, {
      min: D(2026, 3, 1),
      max: D(2026, 9, 30),
    });
    const sb = trackEl(container, "months-track");
    expect(sb?.getAttribute("aria-valuemin")).toBe("3"); // March
    expect(sb?.getAttribute("aria-valuemax")).toBe("9"); // September
  });

  it("applies per-module theme/scheme on the track", () => {
    const { container } = setup(
      <CalendarYearsTrack theme="espresso" scheme="dark" />,
    );
    const sb = trackEl(container, "years-track");
    expect(sb?.getAttribute("data-theme")).toBe("espresso");
    expect(sb?.getAttribute("data-scheme")).toBe("dark");
  });
});
