import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarConfig } from "@/core-v3/state";
import { CalendarMonthsWheel } from "@/modules-v3/months-wheel/CalendarMonthsWheel";
import { CalendarTimeWheel } from "@/modules-v3/time/CalendarTimeWheel";
import {
  CalendarToolbar,
  CalendarToolbarApply,
  CalendarToolbarClear,
  CalendarToolbarClock,
  CalendarToolbarDayLabel,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarMonthLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarTime,
  CalendarToolbarYearLabel,
  CalendarToolbarYearTrigger,
} from "@/modules-v3/toolbar/CalendarToolbar";
import { CalendarProvider } from "@/react-v3/provider";
import { UIProvider } from "@/react-v3/ui-context";

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

function setup(
  ui: ReactNode,
  props: { onViewChange?: (d: ReturnType<typeof D>) => void } = {},
  over: Partial<CalendarConfig> = {},
  initialView = D(2026, 6, 1),
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CalendarProvider
      config={config(over)}
      initialView={initialView}
      {...props}
    >
      <UIProvider>{children}</UIProvider>
    </CalendarProvider>
  );
  return render(ui, { wrapper });
}

describe("Toolbar primitives", () => {
  it("renders a live Month Year label from the view", () => {
    const { getByText } = setup(<CalendarToolbarLabel />);
    expect(getByText("June 2026")).toBeTruthy();
  });

  it("label is a heading and reserves the longest month's width", () => {
    const { container, getByText } = setup(<CalendarToolbarLabel level={3} />);
    const label = container.querySelector("[data-toolbar-label]");
    expect(label?.getAttribute("role")).toBe("heading");
    expect(label?.getAttribute("aria-level")).toBe("3");
    // Invisible sizer holds September (longest en-US month) at the same year.
    expect(label?.textContent).toContain("September 2026");
    expect(getByText("June 2026")).toBeTruthy();
  });

  it("prev/next step the view a month and update the label", () => {
    const onViewChange = vi.fn();
    const { getByLabelText, getByText } = setup(
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarLabel />
        <CalendarToolbarNext />
      </CalendarToolbar>,
      { onViewChange },
    );
    fireEvent.click(getByLabelText("Next month"));
    expect(getByText("July 2026")).toBeTruthy();
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 7, 1));

    fireEvent.click(getByLabelText("Previous month"));
    fireEvent.click(getByLabelText("Previous month"));
    expect(getByText("May 2026")).toBeTruthy();
  });

  it("steps by year when unit='year'", () => {
    const { getByLabelText, getByText } = setup(
      <CalendarToolbar>
        <CalendarToolbarNext unit="year" />
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    fireEvent.click(getByLabelText("Next year"));
    expect(getByText("June 2027")).toBeTruthy();
  });

  it("steps by day when unit='day' (crosses month edges)", () => {
    const onViewChange = vi.fn();
    const { getByLabelText } = setup(
      <CalendarToolbar>
        <CalendarToolbarPrev unit="day" />
        <CalendarToolbarNext unit="day" />
      </CalendarToolbar>,
      { onViewChange },
    );
    fireEvent.click(getByLabelText("Previous day"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 5, 31));
    fireEvent.click(getByLabelText("Next day"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 6, 1));
  });

  it("prev/next disable at the min/max window edges", () => {
    const { getByLabelText } = setup(
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarNext />
        <CalendarToolbarPrev unit="year" label="Year back" />
        <CalendarToolbarPrev unit="day" label="Day back" />
        <CalendarToolbarNext unit="day" label="Day forward" />
      </CalendarToolbar>,
      {},
      { min: D(2026, 6, 1), max: D(2026, 6, 30) },
    );
    expect(getByLabelText("Previous month")).toHaveProperty("disabled", true);
    expect(getByLabelText("Next month")).toHaveProperty("disabled", true);
    expect(getByLabelText("Year back")).toHaveProperty("disabled", true);
    // View sits on June 1: a day back leaves the window, a day forward stays.
    expect(getByLabelText("Day back")).toHaveProperty("disabled", true);
    expect(getByLabelText("Day forward")).toHaveProperty("disabled", false);
  });

  it("Home jumps the view to today's month and disables once there", () => {
    const onViewChange = vi.fn();
    const now = new Date();
    const { getByLabelText } = setup(
      <CalendarToolbarHome />,
      { onViewChange },
      {},
      D(now.getFullYear() - 1, 1, 1),
    );
    const btn = getByLabelText("Go to current month");
    expect(btn).toHaveProperty("disabled", false);
    fireEvent.click(btn);
    expect(onViewChange).toHaveBeenLastCalledWith(
      D(now.getFullYear(), now.getMonth() + 1, 1),
    );
    expect(btn).toHaveProperty("disabled", true);
  });

  it("exposes role=toolbar with a registry name, overridable", () => {
    const { getByRole, rerender } = setup(
      <CalendarToolbar>
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    expect(getByRole("toolbar", { name: "Calendar navigation" })).toBeTruthy();
    rerender(
      <CalendarToolbar label="Range picker controls">
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    expect(
      getByRole("toolbar", { name: "Range picker controls" }),
    ).toBeTruthy();
  });

  it("arrow keys move focus between enabled toolbar buttons", () => {
    const { getByLabelText } = setup(
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarHome />
        <CalendarToolbarNext />
      </CalendarToolbar>,
    );
    const prev = getByLabelText("Previous month");
    const next = getByLabelText("Next month");
    prev.focus();
    fireEvent.keyDown(prev, { key: "ArrowRight" });
    // Home is disabled (view is on today's month in tests run "today") or
    // enabled — either way ArrowRight lands on the next ENABLED button.
    expect([getByLabelText("Go to current month"), next]).toContain(
      document.activeElement,
    );
    fireEvent.keyDown(document.activeElement as Element, { key: "End" });
    expect(document.activeElement).toBe(next);
    fireEvent.keyDown(next, { key: "Home" });
    expect(document.activeElement).toBe(prev);
  });

  it("renders month-only and year-only labels with sr companions", () => {
    const { container, getByText } = setup(
      <>
        <CalendarToolbarMonthLabel />
        <CalendarToolbarYearLabel />
      </>,
    );
    expect(getByText("June")).toBeTruthy();
    expect(getByText("2026")).toBeTruthy();
    const month = container.querySelector("[data-toolbar-month-label]");
    expect(month?.textContent).toContain("Current month, June");
    expect(month?.textContent).toContain("September"); // width sizer
    const year = container.querySelector("[data-toolbar-year-label]");
    expect(year?.textContent).toContain("Current year, 2026");
  });

  it("day label renders the view day in the requested format", () => {
    const { container, getByText } = setup(
      <>
        <CalendarToolbarDayLabel />
        <CalendarToolbarDayLabel format="long" />
      </>,
    );
    expect(getByText("1")).toBeTruthy();
    expect(getByText("June 1, 2026")).toBeTruthy();
    const label = container.querySelector("[data-toolbar-day-label]");
    expect(label?.textContent).toContain("Current day, June 1, 2026");
  });

  it("offset shifts what the toolbar's parts display", () => {
    const { getByText } = setup(
      <CalendarToolbar offset={1}>
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    expect(getByText("July 2026")).toBeTruthy();
  });

  it("clock renders a decorative live time", () => {
    const { container } = setup(<CalendarToolbarClock />);
    const clock = container.querySelector("[data-toolbar-clock]");
    expect(clock?.getAttribute("aria-hidden")).toBe("true");
    expect(clock?.textContent?.length).toBeGreaterThan(0);
  });
});

describe("Toolbar clear/apply", () => {
  function selectionSetup(
    ui: ReactNode,
    over: Partial<CalendarConfig> = {},
    withSelection = true,
    onChange = vi.fn(),
  ) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CalendarProvider
        config={config(over)}
        initialView={D(2026, 6, 1)}
        defaultSelection={
          withSelection
            ? {
                shape: "point",
                dates: [{ date: D(2026, 6, 5), time: MIDNIGHT }],
              }
            : undefined
        }
        onChange={onChange}
      >
        <UIProvider>{children}</UIProvider>
      </CalendarProvider>
    );
    return { ...render(ui, { wrapper }), onChange };
  }

  it("Clear empties the selection (onChange fires with empty)", () => {
    const { getByLabelText, onChange } = selectionSetup(
      <CalendarToolbarClear />,
    );
    fireEvent.click(getByLabelText("Clear"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeNull();
  });

  it("Clear is disabled when nothing is selected or readOnly", () => {
    const empty = selectionSetup(<CalendarToolbarClear />, {}, false);
    expect(empty.getByLabelText("Clear")).toHaveProperty("disabled", true);
    empty.unmount();
    const readOnly = selectionSetup(<CalendarToolbarClear />, {
      readOnly: true,
    });
    expect(readOnly.getByLabelText("Clear")).toHaveProperty("disabled", true);
  });

  it("Apply hands the current public value to the host", () => {
    const onApply = vi.fn();
    const { getByLabelText } = selectionSetup(
      <CalendarToolbarApply onApply={onApply} />,
    );
    fireEvent.click(getByLabelText("Apply"));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).not.toBeNull();
  });

  it("Apply is disabled when empty, overridable via the disabled prop", () => {
    const empty = selectionSetup(<CalendarToolbarApply />, {}, false);
    expect(empty.getByLabelText("Apply")).toHaveProperty("disabled", true);
    empty.unmount();
    const forced = selectionSetup(
      <CalendarToolbarApply disabled={false} />,
      {},
      false,
    );
    expect(forced.getByLabelText("Apply")).toHaveProperty("disabled", false);
  });
});

describe("Toolbar month/year triggers", () => {
  it("month trigger shows the view month and is closed initially", () => {
    const { getByLabelText, queryByRole } = setup(
      <CalendarToolbarMonthTrigger />,
    );
    const btn = getByLabelText("Change month, currently June");
    expect(btn.textContent).toContain("June");
    // Width sizer: the longest month name is reserved invisibly, so stepping
    // months never resizes the trigger.
    expect(btn.textContent).toContain("September");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(queryByRole("dialog")).toBeNull();
  });

  it("compact trigger renders the short month name", () => {
    const { getByLabelText } = setup(<CalendarToolbarMonthTrigger compact />);
    expect(
      getByLabelText("Change month, currently June").textContent,
    ).toContain("Jun");
  });

  it("picker prop swaps the popup body for custom content", () => {
    const { getByLabelText, getByText, queryByText } = setup(
      <>
        <CalendarToolbarMonthTrigger picker={<div>custom month UI</div>} />
        <CalendarToolbarYearTrigger picker={<div>custom year UI</div>} />
      </>,
    );
    fireEvent.click(getByLabelText("Change month, currently June"));
    expect(getByText("custom month UI")).toBeTruthy();
    expect(queryByText("Jan")).toBeNull(); // default grid is gone
    fireEvent.click(getByLabelText("Change year, currently 2026"));
    expect(getByText("custom year UI")).toBeTruthy();
    expect(queryByText("2016")).toBeNull(); // default paged grid is gone
  });

  it("wheel picker stages on spin and commits only on Confirm", async () => {
    const onViewChange = vi.fn();
    const user = userEvent.setup();
    const { getByLabelText } = setup(
      <CalendarToolbarMonthTrigger picker={<CalendarMonthsWheel />} />,
      { onViewChange },
    );
    fireEvent.click(getByLabelText(/Change month/));
    const drum = document.querySelector("[role=spinbutton]") as HTMLElement;
    expect(drum.getAttribute("aria-valuenow")).toBe("5"); // June, 0-based
    drum.focus();
    await user.keyboard("{ArrowDown}");
    // Spinning only STAGES the draft — the real view has NOT moved.
    expect(onViewChange).not.toHaveBeenCalled();
    expect(drum.getAttribute("aria-valuenow")).toBe("6"); // draft → July
    // Confirm applies the staged month.
    fireEvent.click(getByLabelText("Confirm"));
    const [view] = onViewChange.mock.calls.at(-1) ?? [];
    expect((view as { month: number }).month).toBe(7);
  });

  it("custom picker footer: Confirm (check) closes and refocuses the trigger", () => {
    const { getByLabelText, queryByRole } = setup(
      <CalendarToolbarMonthTrigger picker={<div>wheel</div>} />,
    );
    const trigger = getByLabelText("Change month, currently June");
    fireEvent.click(trigger);
    fireEvent.click(getByLabelText("Confirm"));
    expect(queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("custom picker footer: now-reset STAGES the month, Confirm commits it", () => {
    const onViewChange = vi.fn();
    const now = new Date();
    const { getByLabelText, queryByRole } = setup(
      <CalendarToolbarMonthTrigger picker={<div>wheel</div>} />,
      { onViewChange },
      {},
      D(now.getFullYear() - 1, 1, 1),
    );
    fireEvent.click(getByLabelText(/Change month/));
    const reset = getByLabelText(/Reset to/);
    expect(reset).toHaveProperty("disabled", false);
    fireEvent.click(reset);
    // Reset only STAGES the draft — the view has not moved and the popup stays.
    expect(onViewChange).not.toHaveBeenCalled();
    expect(queryByRole("dialog")).not.toBeNull();
    expect(reset).toHaveProperty("disabled", true); // draft now at current month
    // Confirm applies the staged month to the real view and closes.
    fireEvent.click(getByLabelText("Confirm"));
    expect(onViewChange).toHaveBeenLastCalledWith(
      D(now.getFullYear(), now.getMonth() + 1, 1),
    );
    expect(queryByRole("dialog")).toBeNull();
  });

  it("pickerConfirm/pickerReset={false} drop the footer; the grid never has it", () => {
    const { getByLabelText, queryByLabelText, unmount } = setup(
      <CalendarToolbarMonthTrigger
        picker={<div>wheel</div>}
        pickerConfirm={false}
        pickerReset={false}
      />,
    );
    fireEvent.click(getByLabelText("Change month, currently June"));
    expect(queryByLabelText("Confirm")).toBeNull();
    expect(queryByLabelText(/Reset to/)).toBeNull();
    unmount();
    const second = setup(<CalendarToolbarMonthTrigger />);
    fireEvent.click(second.getByLabelText("Change month, currently June"));
    expect(second.queryByLabelText("Confirm")).toBeNull();
  });

  it("opens the month popup and picks a month (navigates + closes)", () => {
    const onViewChange = vi.fn();
    const { getByLabelText, getByText, queryByRole } = setup(
      <CalendarToolbarMonthTrigger />,
      { onViewChange },
    );
    fireEvent.click(getByLabelText("Change month, currently June"));
    expect(queryByRole("dialog")).not.toBeNull();
    fireEvent.click(getByText("Sep"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 9, 1));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("marks the current month as selected", () => {
    const { getByLabelText, getByText } = setup(
      <CalendarToolbarMonthTrigger />,
    );
    fireEvent.click(getByLabelText("Change month, currently June"));
    expect(getByText("Jun").getAttribute("aria-current")).toBe("true");
  });

  it("disables months outside the min/max window", () => {
    const { getByLabelText } = setup(
      <CalendarToolbarMonthTrigger />,
      {},
      {
        min: D(2026, 5, 1),
        max: D(2026, 8, 31),
      },
    );
    fireEvent.click(getByLabelText("Change month, currently June"));
    expect(getByLabelText("January")).toHaveProperty("disabled", true);
    expect(getByLabelText("July")).toHaveProperty("disabled", false);
    expect(getByLabelText("December")).toHaveProperty("disabled", true);
  });

  it("year trigger opens a paged grid and picks a year", () => {
    const onViewChange = vi.fn();
    const { getByLabelText, getByText, queryByRole } = setup(
      <CalendarToolbarYearTrigger />,
      { onViewChange },
    );
    const btn = getByLabelText("Change year, currently 2026");
    expect(btn.textContent).toBe("2026");
    fireEvent.click(btn);
    // Window aligned to 12-year boundary around 2026 -> 2016..2027.
    fireEvent.click(getByText("2024"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2024, 6, 1));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("year grid pages earlier/later and re-anchors on reopen", () => {
    const { getByLabelText, getByText, queryByText } = setup(
      <CalendarToolbarYearTrigger />,
    );
    const trigger = getByLabelText("Change year, currently 2026");
    fireEvent.click(trigger);
    // Base window 2016..2027; page later -> 2028..2039.
    fireEvent.click(getByLabelText("Next years"));
    expect(getByText("2028")).toBeTruthy();
    expect(getByText("2039")).toBeTruthy();
    // Close and reopen: the stale page is dropped, the window re-anchors.
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(getByText("2016")).toBeTruthy();
    expect(queryByText("2039")).toBeNull();
  });

  it("year pager and out-of-window years gate on min/max", () => {
    const { getByLabelText } = setup(
      <CalendarToolbarYearTrigger />,
      {},
      {
        min: D(2020, 1, 1),
        max: D(2030, 12, 31),
      },
    );
    fireEvent.click(getByLabelText("Change year, currently 2026"));
    // Window 2016..2027: 2015 and earlier unreachable.
    expect(getByLabelText("Previous years")).toHaveProperty("disabled", true);
    expect(getByLabelText("Next years")).toHaveProperty("disabled", false);
    fireEvent.click(getByLabelText("Next years"));
    // Window 2028..2039: beyond max=2030.
    expect(getByLabelText("Next years")).toHaveProperty("disabled", true);
  });

  it("year trigger is static when min and max share a year", () => {
    const { getByLabelText } = setup(
      <CalendarToolbarYearTrigger />,
      {},
      {
        min: D(2026, 2, 1),
        max: D(2026, 11, 30),
      },
    );
    const btn = getByLabelText("Change year, currently 2026");
    expect(btn).toHaveProperty("disabled", true);
    expect(btn.getAttribute("aria-haspopup")).toBeNull();
  });
});

describe("Toolbar day stepper (target=selection)", () => {
  const pointSel = (y: number, m: number, d: number) => ({
    shape: "point" as const,
    dates: [{ date: D(y, m, d), time: MIDNIGHT }],
  });

  function renderStepper(
    ui: ReactNode,
    selection: ReturnType<typeof pointSel> | undefined,
    onChange?: (v: unknown) => void,
    over: Partial<CalendarConfig> = {},
  ) {
    return render(
      <CalendarProvider
        config={config(over)}
        initialView={D(2026, 6, 1)}
        defaultSelection={selection}
        onChange={onChange}
      >
        <UIProvider>{ui}</UIProvider>
      </CalendarProvider>,
    );
  }

  it("steps the selected date by a day and commits it", () => {
    const onChange = vi.fn();
    const { container } = renderStepper(
      <CalendarToolbarNext unit="day" target="selection" />,
      pointSel(2026, 6, 15),
      onChange,
    );
    fireEvent.click(container.querySelector("[data-toolbar-next]")!);
    const value = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(value.getMonth()).toBe(5); // June
    expect(value.getDate()).toBe(16); // 15 → 16
  });

  it("disables the step at the min/max bound", () => {
    const { container } = renderStepper(
      <CalendarToolbarNext unit="day" target="selection" />,
      pointSel(2026, 6, 15),
      undefined,
      { max: D(2026, 6, 15) },
    );
    expect(container.querySelector("[data-toolbar-next]")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("DayLabel source=selection shows the selected date, not the view", () => {
    const { container } = renderStepper(
      <CalendarToolbarDayLabel format="long" source="selection" />,
      pointSel(2026, 6, 15),
    );
    const visible = container.querySelector(
      "[data-toolbar-day-label] [aria-hidden='true']",
    );
    expect(visible?.textContent).toBe("June 15, 2026");
  });

  it("DayLabel source=selection shows a placeholder when nothing is picked", () => {
    const { container } = renderStepper(
      <CalendarToolbarDayLabel source="selection" />,
      undefined,
    );
    const label = container.querySelector("[data-toolbar-day-label]");
    expect(label?.getAttribute("data-empty")).toBe("");
    expect(label?.querySelector("[aria-hidden='true']")?.textContent).toBe("—");
  });

  it("disables the arrows when nothing is selected", () => {
    const onChange = vi.fn();
    const { container } = renderStepper(
      <CalendarToolbarNext unit="day" target="selection" />,
      undefined,
      onChange,
    );
    const next = container.querySelector("[data-toolbar-next]");
    expect(next).toHaveProperty("disabled", true);
    fireEvent.click(next!); // no-op even if forced
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Toolbar time trigger (CalendarToolbarTime)", () => {
  const timeSel = (h: number, m: number, s = 0) => ({
    shape: "point" as const,
    dates: [
      { date: D(2026, 6, 15), time: { hour: h, minute: m, second: s, ms: 0 } },
    ],
  });

  function setupTime(
    props: Parameters<typeof CalendarToolbarTime>[0] = {},
    selection?: ReturnType<typeof timeSel>,
    over: Partial<CalendarConfig> = {},
  ) {
    return render(
      <CalendarProvider
        config={config({ withTime: true, ...over })}
        initialView={D(2026, 6, 15)}
        defaultSelection={selection}
      >
        <UIProvider>
          <CalendarToolbarTime {...props} />
        </UIProvider>
      </CalendarProvider>,
    );
  }

  it("is disabled until a date is selected", () => {
    const { container } = setupTime({}, undefined);
    expect(container.querySelector("[data-toolbar-time]")).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("shows the selected time (24h default)", () => {
    const { container } = setupTime({}, timeSel(14, 30));
    expect(container.querySelector("[data-toolbar-time]")?.textContent).toBe(
      "14:30",
    );
  });

  it("compact renders a clock icon instead of the text", () => {
    const { container } = setupTime({ compact: true }, timeSel(14, 30));
    const btn = container.querySelector("[data-toolbar-time]");
    expect(btn?.textContent).not.toMatch(/14/);
    expect(btn?.querySelector("svg")).toBeTruthy();
  });

  it("units are spinbuttons; ArrowUp steps and commits the time", () => {
    const onTimeSelect = vi.fn();
    const { container, getByLabelText } = setupTime(
      { onTimeSelect },
      timeSel(14, 30),
    );
    fireEvent.click(container.querySelector("[data-toolbar-time]")!); // open
    const minute = getByLabelText("Minutes");
    expect(minute.getAttribute("role")).toBe("spinbutton");
    expect(minute.getAttribute("aria-valuenow")).toBe("30");
    expect(minute.getAttribute("aria-valuemax")).toBe("59");
    fireEvent.keyDown(minute, { key: "ArrowUp" });
    expect(onTimeSelect).toHaveBeenLastCalledWith(
      expect.objectContaining({ hour: 14, minute: 31 }),
    );
  });

  it("hour12 config formats the trigger with AM/PM", () => {
    const { container } = setupTime({}, timeSel(14, 30), { hour12: true });
    expect(container.querySelector("[data-toolbar-time]")?.textContent).toMatch(
      /PM/,
    );
  });

  it("wheel picker stages the time and commits only on Confirm", () => {
    const onChange = vi.fn();
    const { container, getByLabelText } = render(
      <CalendarProvider
        config={config({ withTime: true })}
        initialView={D(2026, 6, 15)}
        defaultSelection={timeSel(14, 30)}
        onChange={onChange}
      >
        <UIProvider>
          <CalendarToolbarTime picker={<CalendarTimeWheel />} />
        </UIProvider>
      </CalendarProvider>,
    );
    fireEvent.click(container.querySelector("[data-toolbar-time]")!); // open
    // Spin the hours drum — stages into the draft, no commit yet.
    fireEvent.keyDown(getByLabelText("Hours"), { key: "ArrowDown" });
    expect(onChange).not.toHaveBeenCalled();
    // Confirm applies the staged time.
    fireEvent.click(getByLabelText("Confirm"));
    expect(onChange).toHaveBeenCalled();
  });

  it("two time triggers don't both open (anchor-gated)", () => {
    const { container, queryAllByRole } = render(
      <CalendarProvider
        config={config({ withTime: true })}
        initialView={D(2026, 6, 15)}
        defaultSelection={timeSel(14, 30)}
      >
        <UIProvider>
          <CalendarToolbarTime />
          <CalendarToolbarTime compact />
        </UIProvider>
      </CalendarProvider>,
    );
    fireEvent.click(container.querySelectorAll("[data-toolbar-time]")[0]!);
    expect(queryAllByRole("dialog")).toHaveLength(1);
  });
});

describe("Toolbar bound mode (range edges)", () => {
  function spanSel(from: ReturnType<typeof D>, to: ReturnType<typeof D>) {
    return {
      shape: "span" as const,
      ranges: [{ start: from, end: to }],
      fromTime: MIDNIGHT,
      toTime: MIDNIGHT,
    };
  }

  function boundSetup(
    ui: ReactNode,
    {
      from = D(2026, 6, 10),
      to = D(2026, 8, 20),
      over = {},
    }: {
      from?: ReturnType<typeof D>;
      to?: ReturnType<typeof D>;
      over?: Partial<CalendarConfig>;
    } = {},
  ) {
    const onChange = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CalendarProvider
        config={config({ mode: "range", ...over })}
        initialView={D(2026, 1, 1)}
        defaultSelection={spanSel(from, to)}
        onChange={onChange}
      >
        <UIProvider>{children}</UIProvider>
      </CalendarProvider>
    );
    return { ...render(ui, { wrapper }), onChange };
  }

  it("a bound toolbar titles its range edge, not the view", () => {
    const { getByText } = boundSetup(
      <>
        <CalendarToolbar bound="from">
          <CalendarToolbarLabel />
        </CalendarToolbar>
        <CalendarToolbar bound="to">
          <CalendarToolbarLabel />
        </CalendarToolbar>
      </>,
    );
    // View is January; the labels follow the from/to edges instead.
    expect(getByText("June 2026")).toBeTruthy();
    expect(getByText("August 2026")).toBeTruthy();
  });

  it("per-part bound overrides the container", () => {
    const { getByText } = boundSetup(
      <CalendarToolbar bound="from">
        <CalendarToolbarMonthLabel />
        <CalendarToolbarMonthLabel bound="to" />
      </CalendarToolbar>,
    );
    expect(getByText("June")).toBeTruthy();
    expect(getByText("August")).toBeTruthy();
  });

  it("prev/next step the bound's date (commits, label follows)", () => {
    const { getByLabelText, getByText, onChange } = boundSetup(
      <CalendarToolbar bound="from">
        <CalendarToolbarPrev />
        <CalendarToolbarLabel />
        <CalendarToolbarNext />
      </CalendarToolbar>,
    );
    fireEvent.click(getByLabelText("Next month"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getByText("July 2026")).toBeTruthy();
  });

  it("the opposite edge walls the step (no crossing)", () => {
    // from=June, to=July 5 → stepping FROM forward to July 10 crosses to.
    const { getByLabelText } = boundSetup(
      <CalendarToolbar bound="from">
        <CalendarToolbarNext />
      </CalendarToolbar>,
      { from: D(2026, 6, 10), to: D(2026, 7, 5) },
    );
    expect(getByLabelText("Next month")).toHaveProperty("disabled", true);
  });

  it("bound steps are blocked under readOnly", () => {
    const { getByLabelText } = boundSetup(
      <CalendarToolbar bound="from">
        <CalendarToolbarNext />
      </CalendarToolbar>,
      { over: { readOnly: true } },
    );
    expect(getByLabelText("Next month")).toHaveProperty("disabled", true);
  });

  it("month trigger commits the pick to the bound (day kept in-month)", () => {
    const { getByLabelText, getByText, onChange } = boundSetup(
      <CalendarToolbar bound="from">
        <CalendarToolbarMonthTrigger picker={null} pickerConfirm={false} />
      </CalendarToolbar>,
    );
    fireEvent.click(getByLabelText(/change month/i));
    fireEvent.click(getByLabelText("July"));
    expect(onChange).toHaveBeenCalledTimes(1);
    // Trigger label now reads the moved bound month.
    expect(getByText("July")).toBeTruthy();
  });

  it("time trigger edits the chosen edge's time", () => {
    const { getByLabelText, onChange } = boundSetup(
      <CalendarToolbar bound="to">
        <CalendarToolbarTime />
      </CalendarToolbar>,
      { over: { withTime: true } },
    );
    fireEvent.click(getByLabelText(/change time/i));
    fireEvent.keyDown(getByLabelText("Hours"), { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalled();
  });
});
