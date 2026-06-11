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
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
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

describe("Toolbar month/year triggers", () => {
  function triggerSetup(
    ui: ReactNode,
    props: { onViewChange?: (d: ReturnType<typeof D>) => void } = {},
  ) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CalendarProvider
        config={config()}
        initialView={D(2026, 6, 1)}
        {...props}
      >
        <UIProvider>{children}</UIProvider>
      </CalendarProvider>
    );
    return render(<>{ui}</>, { wrapper });
  }

  it("month trigger shows the view month and is closed initially", () => {
    const { getByLabelText, queryByRole } = triggerSetup(
      <CalendarToolbarMonthTrigger />,
    );
    const btn = getByLabelText("Choose month");
    expect(btn.textContent).toBe("June");
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(queryByRole("dialog")).toBeNull();
  });

  it("opens the month popup and picks a month (navigates + closes)", () => {
    const onViewChange = vi.fn();
    const { getByLabelText, getByText, queryByRole } = triggerSetup(
      <CalendarToolbarMonthTrigger />,
      { onViewChange },
    );
    fireEvent.click(getByLabelText("Choose month"));
    expect(queryByRole("dialog")).not.toBeNull();
    fireEvent.click(getByText("Sep"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2026, 9, 1));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("marks the current month as selected", () => {
    const { getByLabelText, getByText } = triggerSetup(
      <CalendarToolbarMonthTrigger />,
    );
    fireEvent.click(getByLabelText("Choose month"));
    expect(getByText("Jun").getAttribute("aria-current")).toBe("true");
  });

  it("year trigger opens a paged grid and picks a year", () => {
    const onViewChange = vi.fn();
    const { getByLabelText, getByText, queryByRole } = triggerSetup(
      <CalendarToolbarYearTrigger />,
      { onViewChange },
    );
    const btn = getByLabelText("Choose year");
    expect(btn.textContent).toBe("2026");
    fireEvent.click(btn);
    // Window aligned to 12-year boundary around 2026 -> 2016..2027.
    fireEvent.click(getByText("2024"));
    expect(onViewChange).toHaveBeenLastCalledWith(D(2024, 6, 1));
    expect(queryByRole("dialog")).toBeNull();
  });

  it("year grid pages earlier/later without picking", () => {
    const { getByLabelText, getByText } = triggerSetup(
      <CalendarToolbarYearTrigger />,
    );
    fireEvent.click(getByLabelText("Choose year"));
    // Base window 2016..2027; page later -> 2028..2039.
    fireEvent.click(getByLabelText("Later years"));
    expect(getByText("2028")).toBeTruthy();
    expect(getByText("2039")).toBeTruthy();
  });
});
