import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarTimeWheel } from "@/modules-v3/time/CalendarTimeWheel";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D, span } from "../fixtures/builders";

function setup(
  props: Parameters<typeof CalendarTimeWheel>[0] = {},
  overrides: Parameters<typeof buildConfig>[0] = {},
  onChange?: (v: unknown, d: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single", withTime: true, ...overrides })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarTimeWheel {...props} />
    </Calendar>,
  );
}

describe("CalendarTimeWheel", () => {
  it("renders hours + minutes drums by default", () => {
    const { container } = setup();
    const drums = container.querySelectorAll(
      "[data-dateforge-time] [role=spinbutton]",
    );
    expect(drums).toHaveLength(2);
  });

  it("seconds adds a third drum", () => {
    const { container } = setup({ seconds: true });
    const drums = container.querySelectorAll(
      "[data-dateforge-time] [role=spinbutton]",
    );
    expect(drums).toHaveLength(3);
  });

  it("hour12 renders an AM/PM switch", () => {
    const { container } = setup({ hour12: true });
    const sw = container.querySelector("[role=switch]");
    expect(sw).toBeTruthy();
  });

  it("hours drum reflects the selected date's time", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    );
    // Default time is midnight → hour 0.
    expect(hourDrum?.getAttribute("aria-valuenow")).toBe("0");
  });

  it("ArrowDown on the hour drum commits a new time (reason=time)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({}, {}, onChange);
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    onChange.mockClear();
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    ) as HTMLElement;
    hourDrum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenCalled();
    const [, details] = onChange.mock.calls.at(-1) ?? [];
    expect((details as { reason: string }).reason).toBe("time");
  });

  it("readOnly marks drums aria-disabled", () => {
    const { container } = setup({}, { readOnly: true });
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    );
    expect(hourDrum?.getAttribute("aria-disabled")).toBe("true");
  });

  it("is inert (data-readonly) until a date is selected", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    const root = container.querySelector("[data-dateforge-time]");
    expect(root?.getAttribute("data-readonly")).toBe("true");
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    expect(root?.getAttribute("data-readonly")).toBeNull();
  });

  it("root labels prop overrides the picker aria-label (registry chain)", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single", withTime: true })}
        initialView={D(2026, 6, 1)}
        labels={{ timePicker: "Часы" }}
      >
        <CalendarTimeWheel />
      </Calendar>,
    );
    const group = container.querySelector("[data-dateforge-time] [role=group]");
    expect(group?.getAttribute("aria-label")).toBe("Часы");
  });

  it("onTimeSelect fires only on a committed change", async () => {
    const onTimeSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({ onTimeSelect });
    // No selection yet → wheel is inert, keyboard does nothing.
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    ) as HTMLElement;
    hourDrum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onTimeSelect).not.toHaveBeenCalled();
    // Select a day → commit lands → callback fires.
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    hourDrum.focus();
    await user.keyboard("{ArrowDown}");
    expect(onTimeSelect).toHaveBeenCalledTimes(1);
    expect(onTimeSelect.mock.calls[0][0].hour).toBe(1);
  });

  it("showReset renders a now button that commits the current time", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = setup({ showReset: true }, {}, onChange);
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    onChange.mockClear();
    const reset = container.querySelector(
      "[data-dateforge-time] button[aria-label]",
    ) as HTMLElement;
    expect(reset).toBeTruthy();
    await user.click(reset);
    expect(onChange).toHaveBeenCalled();
    const [, details] = onChange.mock.calls.at(-1) ?? [];
    expect((details as { reason: string }).reason).toBe("time");
  });

  it("same-day range walls the from-wheel at the to-time", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "range", withTime: true })}
        initialView={D(2026, 6, 1)}
        defaultSelection={span([[D(2026, 6, 10), D(2026, 6, 10)]], {
          from: MIDNIGHT,
          to: { ...MIDNIGHT, hour: 9 },
        })}
      >
        <CalendarTimeWheel bound="from" />
      </Calendar>,
    );
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    );
    expect(hourDrum?.getAttribute("aria-valuemax")).toBe("9");
  });

  it("12h walls: a period flip out of the window clamps to the boundary", async () => {
    const onTimeSelect = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <Calendar
        config={buildConfig({
          mode: "single",
          withTime: true,
          minTime: { hour: 9, minute: 0, second: 0, ms: 0 },
          maxTime: { hour: 17, minute: 0, second: 0, ms: 0 },
        })}
        initialView={D(2026, 6, 1)}
        defaultSelection={{
          shape: "point",
          dates: [
            {
              date: D(2026, 6, 10),
              time: { hour: 14, minute: 0, second: 0, ms: 0 },
            },
          ],
        }}
      >
        <CalendarTimeWheel hour12 onTimeSelect={onTimeSelect} />
      </Calendar>,
    );
    // 14:00 is PM. Flipping to AM would be 02:00 — below the 09:00 floor — so
    // the commit clamps to 09:00 (the 12h wall, since per-drum walls can't span
    // the AM/PM split).
    const sw = container.querySelector("[role=switch]") as HTMLElement;
    await user.click(sw);
    expect(onTimeSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 9, minute: 0 }),
    );
  });

  it("12h hour drum stays circular under a window (no finite valuemax wall)", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({
          mode: "single",
          withTime: true,
          maxTime: { hour: 17, minute: 0, second: 0, ms: 0 },
        })}
        initialView={D(2026, 6, 1)}
        defaultSelection={{
          shape: "point",
          dates: [
            {
              date: D(2026, 6, 10),
              time: { hour: 14, minute: 0, second: 0, ms: 0 },
            },
          ],
        }}
      >
        <CalendarTimeWheel hour12 />
      </Calendar>,
    );
    // Circular (clamp-gated) → the drum spans the full 12 hours, not a finite
    // window track. aria-valuemax is the last drum value (11), not the 17:00 cap.
    const hourDrum = container.querySelector(
      "[data-dateforge-time] [role=spinbutton]",
    );
    expect(hourDrum?.getAttribute("aria-valuemax")).toBe("11");
  });

  it("bound wheel renders the bound date header", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "range", withTime: true })}
        initialView={D(2026, 6, 1)}
        defaultSelection={span([[D(2026, 6, 8), D(2026, 6, 14)]])}
      >
        <CalendarTimeWheel bound="to" />
      </Calendar>,
    );
    const header = container.querySelector("[data-bound=to]");
    expect(header?.textContent).toMatch(/14/);
  });

  it("per-module theme renders data-theme on the container", () => {
    const { container } = setup({ theme: "velvet", scheme: "dark" });
    const root = container.querySelector("[data-dateforge-time]");
    expect(root?.getAttribute("data-theme")).toBe("velvet");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });
});
