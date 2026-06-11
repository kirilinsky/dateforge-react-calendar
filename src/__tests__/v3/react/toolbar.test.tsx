import { fireEvent, render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { CalendarConfig } from "@/core-v3/state";
import {
  CalendarToolbar,
  CalendarToolbarClear,
  CalendarToolbarHome,
  CalendarToolbarLabel,
  CalendarToolbarMonthLabel,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearLabel,
} from "@/modules-v3/toolbar/CalendarToolbar";
import { CalendarProvider } from "@/react-v3/provider";

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
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CalendarProvider config={config()} initialView={D(2026, 6, 1)} {...props}>
      {children}
    </CalendarProvider>
  );
  return render(<>{ui}</>, { wrapper });
}

describe("Toolbar primitives", () => {
  it("renders a live Month Year label from the view", () => {
    const { getByText } = setup(<CalendarToolbarLabel />);
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
    fireEvent.click(getByLabelText("Next"));
    expect(getByText("July 2026")).toBeTruthy();
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 7, 1));

    fireEvent.click(getByLabelText("Previous"));
    fireEvent.click(getByLabelText("Previous"));
    expect(getByText("May 2026")).toBeTruthy();
  });

  it("steps by year when step='year'", () => {
    const { getByLabelText, getByText } = setup(
      <CalendarToolbar>
        <CalendarToolbarNext step="year" />
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    fireEvent.click(getByLabelText("Next"));
    expect(getByText("June 2027")).toBeTruthy();
  });

  it("Home jumps the view to today", () => {
    const onViewChange = vi.fn();
    const { getByLabelText } = setup(<CalendarToolbarHome />, { onViewChange });
    fireEvent.click(getByLabelText("Today"));
    expect(onViewChange).toHaveBeenCalledTimes(1);
  });

  it("exposes role=toolbar on the container", () => {
    const { getByRole } = setup(
      <CalendarToolbar>
        <CalendarToolbarLabel />
      </CalendarToolbar>,
    );
    expect(getByRole("toolbar")).toBeTruthy();
  });

  it("renders month-only and year-only labels", () => {
    const { getByText } = setup(
      <>
        <CalendarToolbarMonthLabel />
        <CalendarToolbarYearLabel />
      </>,
    );
    expect(getByText("June")).toBeTruthy();
    expect(getByText("2026")).toBeTruthy();
  });

  it("Clear empties the selection (onChange fires with empty)", () => {
    const onChange = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CalendarProvider
        config={config()}
        initialView={D(2026, 6, 1)}
        defaultSelection={{
          shape: "point",
          dates: [{ date: D(2026, 6, 5), time: MIDNIGHT }],
        }}
        onChange={onChange}
      >
        {children}
      </CalendarProvider>
    );
    const { getByLabelText } = render(<CalendarToolbarClear />, { wrapper });
    fireEvent.click(getByLabelText("Clear"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeNull();
  });
});
