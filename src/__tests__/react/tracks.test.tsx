import { fireEvent, render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { CalendarDaysTrack } from "@/modules/days-track/CalendarDaysTrack";
import { CalendarMonthsTrack } from "@/modules/months-track/CalendarMonthsTrack";
import { CalendarYearsTrack } from "@/modules/years-track/CalendarYearsTrack";
import { Calendar } from "@/react/calendar";
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

  it("single mode: days track has no confirm overlay", () => {
    const { container } = setup(<CalendarDaysTrack />);
    expect(container.querySelector("[data-track-confirm]")).toBeNull();
  });

  it("multiselect: confirm overlay toggles the centred day in/out", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "multiple" })}
        initialView={D(2026, 6, 15)}
      >
        <CalendarDaysTrack />
      </Calendar>,
    );
    const btn = () =>
      container.querySelector("[data-track-confirm]") as HTMLElement;
    // Centred day (June 15) not yet selected → "save" affordance.
    expect(btn()).toBeTruthy();
    expect(btn().getAttribute("aria-label")).toMatch(/save/i);
    expect(btn().getAttribute("data-selected")).toBeNull();
    // Confirm adds it → flips to the "remove" affordance.
    fireEvent.click(btn());
    expect(btn().getAttribute("aria-label")).toMatch(/remove/i);
    expect(btn().getAttribute("data-selected")).toBe("");
    // Confirm again removes it.
    fireEvent.click(btn());
    expect(btn().getAttribute("aria-label")).toMatch(/save/i);
  });

  it("bound drum-wall: the from-track stops at the to-day in the same month", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
        defaultSelection={{
          shape: "span",
          ranges: [{ start: D(2026, 6, 10), end: D(2026, 6, 20) }],
        }}
      >
        <CalendarDaysTrack bound="from" />
      </Calendar>,
    );
    const sb = trackEl(container, "days-track");
    // From-day can't pass the to-day (20) within June → walled at 20.
    expect(sb?.getAttribute("aria-valuemax")).toBe("20");
  });

  it("RTL marks the strip (native direction mirrors it; no transform)", () => {
    document.documentElement.setAttribute("dir", "rtl");
    try {
      const { container } = setup(<CalendarMonthsTrack />);
      const sb = trackEl(container, "months-track") as HTMLElement;
      // The months run right-to-left via the inherited `direction: rtl` on the
      // flex strip (a browser concern — not visible to happy-dom). `data-rtl`
      // just marks that the track detected RTL (drives the JS drag-centring /
      // tilt sign); there is NO mirror transform on the track itself.
      expect(sb.querySelector("[data-rtl]")).toBeTruthy();
      expect(sb.style.transform).toBe("");
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  it("LTR leaves the strip in normal order", () => {
    const { container } = setup(<CalendarMonthsTrack />);
    const sb = trackEl(container, "months-track") as HTMLElement;
    expect(sb.querySelector("[data-rtl]")).toBeNull();
  });

  it("picks up dir flipped AFTER mount (Storybook sets html[dir] late)", async () => {
    const { container } = setup(<CalendarMonthsTrack />);
    const sb = trackEl(container, "months-track") as HTMLElement;
    expect(sb.querySelector("[data-rtl]")).toBeNull(); // LTR at mount
    // The toolbar sets html[dir] in an effect that runs after the track's — the
    // MutationObserver must catch it and reverse without a remount.
    document.documentElement.setAttribute("dir", "rtl");
    try {
      await waitFor(() => expect(sb.querySelector("[data-rtl]")).toBeTruthy());
    } finally {
      document.documentElement.removeAttribute("dir");
    }
  });

  it("RTL swipe LEFT advances the month (+), RIGHT goes back (−)", async () => {
    // The swipe physics are unchanged by the reversal, so the gesture→month
    // mapping is the SAME as LTR: drag left = next month (+), drag right = (−).
    const dragMonth = async (dir: "left" | "right") => {
      document.documentElement.setAttribute("dir", "rtl");
      const { container } = setup(<CalendarMonthsTrack />);
      const sb = trackEl(container, "months-track") as HTMLElement;
      await waitFor(() => expect(sb.querySelector("[data-rtl]")).toBeTruthy());
      const start = Number(sb.getAttribute("aria-valuenow"));
      const step = dir === "left" ? -20 : 20;
      fireEvent.pointerDown(sb, { clientX: 400, clientY: 20, pointerId: 1 });
      for (let i = 1; i <= 12; i++) {
        fireEvent.pointerMove(window, {
          clientX: 400 + step * i,
          clientY: 20,
          pointerId: 1,
        });
      }
      fireEvent.pointerUp(window, { clientX: 400 + step * 12, pointerId: 1 });
      let end = start;
      await waitFor(() => {
        end = Number(sb.getAttribute("aria-valuenow"));
        expect(end).not.toBe(start);
      });
      document.documentElement.removeAttribute("dir");
      return end - start;
    };
    expect(await dragMonth("left")).toBeGreaterThan(0); // ← = +month
    expect(await dragMonth("right")).toBeLessThan(0); // → = −month
  });
});
