import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { boundDateOf } from "@/core-v3/bound";
import { CalendarMonthsTrack } from "@/modules-v3/months-track/CalendarMonthsTrack";
import { CalendarMonthsWheel } from "@/modules-v3/months-wheel/CalendarMonthsWheel";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D, point, span } from "../fixtures/builders";

describe("boundDateOf", () => {
  it("returns the right span endpoint, undefined otherwise", () => {
    const sp = span([[D(2026, 3, 10), D(2026, 6, 20)]]);
    expect(boundDateOf(sp, "from")).toEqual(D(2026, 3, 10));
    expect(boundDateOf(sp, "to")).toEqual(D(2026, 6, 20));
    expect(boundDateOf(sp, undefined)).toBeUndefined();
    expect(boundDateOf(point({ d: D(2026, 6, 15) }), "to")).toBeUndefined();
    expect(boundDateOf(span([]), "from")).toBeUndefined(); // empty span
  });
});

describe("bound mode (range from/to editing)", () => {
  function setup(ui: ReactNode, onChange?: (v: unknown) => void) {
    return render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
        defaultSelection={span([[D(2026, 3, 10), D(2026, 6, 20)]])}
        onChange={onChange}
      >
        {ui}
      </Calendar>,
    );
  }

  it("months track bound='to' displays the to-bound month", () => {
    const { container } = setup(<CalendarMonthsTrack bound="to" />);
    const tr = container.querySelector("[data-area='months-track']");
    expect(tr?.getAttribute("aria-valuenow")).toBe("6"); // June (the 'to')
  });

  it("months track bound='from' displays the from-bound month", () => {
    const { container } = setup(<CalendarMonthsTrack bound="from" />);
    const tr = container.querySelector("[data-area='months-track']");
    expect(tr?.getAttribute("aria-valuenow")).toBe("3"); // March (the 'from')
  });

  it("months wheel bound='to' edits ONLY the to bound (day preserved)", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const { container } = setup(<CalendarMonthsWheel bound="to" />, onChange);
    const drum = container.querySelector("[role=spinbutton]") as HTMLElement;
    drum.focus();
    await user.keyboard("{ArrowDown}"); // step the to-month forward
    expect(onChange).toHaveBeenCalled();
    const value = onChange.mock.calls.at(-1)?.[0] as { start: Date; end: Date };
    expect(value.start.getMonth()).toBe(2); // 'from' stays March
    expect(value.start.getDate()).toBe(10);
    expect(value.end.getMonth()).not.toBe(5); // 'to' moved off June
    expect(value.end.getDate()).toBe(20); // 'to' day preserved
  });
});

// Reordering: editing a bound across the other is the core's job, not the
// module's — a controlled host that always feeds back the emitted value must
// never crash or corrupt.
describe("bound reordering is the core's concern", () => {
  function Controlled() {
    const [sel, setSel] = useState(span([[D(2026, 3, 10), D(2026, 6, 20)]]));
    return (
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
        defaultSelection={sel}
        // biome-ignore lint/suspicious/noExplicitAny: test feedback loop
        onChange={(_v, d: any) => d?.selection && setSel(d.selection)}
      >
        <CalendarMonthsWheel bound="from" />
      </Calendar>
    );
  }

  it("stepping 'from' far forward does not throw", async () => {
    const user = userEvent.setup();
    const { container } = render(<Controlled />);
    const drum = container.querySelector("[role=spinbutton]") as HTMLElement;
    drum.focus();
    // Push 'from' (March) up past 'to' (June) — core orders, no crash.
    for (let i = 0; i < 5; i++) await user.keyboard("{ArrowDown}");
    expect(container.querySelector("[role=spinbutton]")).toBeTruthy();
  });
});
