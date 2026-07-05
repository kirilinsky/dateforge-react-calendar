import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarManualInput } from "@/modules-v3/manual-input/CalendarManualInput";
import { Calendar } from "@/react-v3/calendar";
import { useCalendarActions } from "@/react-v3/provider";
import { buildConfig, D } from "../fixtures/builders";

/** React-side v2-parity fixes: aria-live announcer, public defaultValue, the
 *  manual-input add-box in multiple mode. */

function Actions({ onReady }: { onReady: (a: unknown) => void }) {
  onReady(useCalendarActions());
  return null;
}

describe("selection announcer (aria-live)", () => {
  it("announces a committed selection and a clear", async () => {
    type A = ReturnType<typeof useCalendarActions>;
    let actions: A | undefined;
    render(
      <Calendar
        config={buildConfig({ mode: "single", locale: "en-US" })}
        initialView={D(2026, 6, 1)}
      >
        <Actions onReady={(a) => (actions = a as A)} />
      </Calendar>,
    );
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("");

    act(() => actions?.selectDay(calendarDate(2026, 6, 5)));
    expect(region.textContent).toContain("June 5, 2026");

    act(() => actions?.clear());
    expect(region.textContent).toBe("Selection cleared");
  });

  it("does not announce the seeded value on mount", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        defaultValue={new Date(2026, 5, 5)}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});

describe("public defaultValue", () => {
  it("seeds an uncontrolled calendar from a JS Date", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        defaultValue={new Date(2026, 5, 5)}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(
      document.querySelector('[data-date="20260605"][data-selected]'),
    ).toBeTruthy();
  });

  it("survives an Invalid Date without crashing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        defaultValue={new Date(Number.NaN)}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </Calendar>,
    );
    expect(document.querySelector("[data-selected]")).toBeNull();
    warn.mockRestore();
  });
});

describe("manual input in multiple mode (add box)", () => {
  it("appends dates and resets for the next entry", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        config={buildConfig({ mode: "multiple" })}
        onChange={onChange}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput format="DD.MM.YYYY" />
      </Calendar>,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "05062026");
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date[]).length).toBe(1);
    // The box resets so the next date can be typed.
    await vi.waitFor(() => expect(input).toHaveValue(""));

    await user.type(input, "07062026");
    expect(onChange).toHaveBeenCalledTimes(2);
    expect((onChange.mock.calls[1][0] as Date[]).length).toBe(2);
  });

  it("disables the box at maxDates", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "multiple", maxDates: 1 })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput format="DD.MM.YYYY" />
      </Calendar>,
    );
    const input = screen.getByRole("textbox");
    await user.type(input, "05062026");
    await vi.waitFor(() => expect(input).toBeDisabled());
  });
});
