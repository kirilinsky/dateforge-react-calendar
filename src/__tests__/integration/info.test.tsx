import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { useNavigation } from "@/context/navigation-context";
import { CalendarInfo } from "@/modules/info";

const D = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m, d, h, min);

const englishUnitFormatter = (value: number, unit: string) => {
  if (unit === "night") return `${value} ${value === 1 ? "night" : "nights"}`;
  if (unit === "date") return `${value} ${value === 1 ? "date" : "dates"}`;
  return undefined;
};

const ViewProbe = () => {
  const { viewDate } = useNavigation();
  return (
    <span data-testid="view-month">
      {viewDate.getFullYear()}-{viewDate.getMonth()}
    </span>
  );
};

afterEach(() => {
  vi.useRealTimers();
});

describe("CalendarInfo", () => {
  it("renders nothing when no value, animated=false, and no label", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeNull();
  });

  it("keeps the block visible with label when selection is empty", () => {
    const { container, getByText } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} label="Select a date" />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeTruthy();
    expect(getByText("Select a date")).toBeTruthy();
  });

  it("renders the single-mode default count with no hardcoded labels", () => {
    const { getByText } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarInfo />
      </Calendar>,
    );

    expect(getByText("1")).toBeTruthy();
  });

  it("renders the multiple-mode default count with no hardcoded labels", () => {
    const { getByText } = render(
      <Calendar
        mode="multiple"
        value={[D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)]}
      >
        <CalendarInfo />
      </Calendar>,
    );

    expect(getByText("3")).toBeTruthy();
  });

  it("uses a custom selection count formatter", () => {
    const { getByText } = render(
      <Calendar
        mode="multiple"
        value={[D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)]}
      >
        <CalendarInfo
          selectionCountFormatter={(count) => `${count} dates selected`}
        />
      </Calendar>,
    );

    expect(getByText("3 dates selected")).toBeTruthy();
  });

  it("renders range nights count by default", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 17) }}
      >
        <CalendarInfo />
      </Calendar>,
    );

    expect(getByText("7")).toBeTruthy();
  });

  it("renders range duration when rangeStyle=duration", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10, 10), to: D(2024, 5, 13, 14) }}
      >
        <CalendarInfo rangeStyle="duration" />
      </Calendar>,
    );

    expect(getByText("3 days 4 hours")).toBeTruthy();
  });

  it("renders range dates with nights in one summary", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-GB"
        value={{ from: D(2024, 4, 14), to: D(2024, 4, 21) }}
      >
        <CalendarInfo
          showRangeDates
          showNights
          rangeLabel="Selected"
          unitFormatter={englishUnitFormatter}
        />
      </Calendar>,
    );

    expect(getByText("Selected: 14 May – 21 May (7 nights)")).toBeTruthy();
  });

  it("renders range dates with duration in days", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-GB"
        value={{ from: D(2024, 4, 14), to: D(2024, 4, 21) }}
      >
        <CalendarInfo showRangeDates showDurationInDays rangeLabel="Selected" />
      </Calendar>,
    );

    expect(getByText("Selected: 14 May – 21 May (7 days)")).toBeTruthy();
  });

  it("uses calendar hour12 for range date formatting", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        hour12
        value={{ from: D(2024, 4, 14, 13, 5), to: D(2024, 4, 14, 15, 30) }}
      >
        <CalendarInfo
          showRangeDates
          showNights={false}
          rangeDateOptions={{ hour: "numeric", minute: "2-digit" }}
        />
      </Calendar>,
    );

    expect(getByText("May 14, 1:05 PM – May 14, 3:30 PM")).toBeTruthy();
  });

  it("uses Intl relative formatting", () => {
    const { getByText } = render(
      <Calendar mode="single" value={D(2024, 5, 13)}>
        <CalendarInfo variant="relative" relativeBaseDate={D(2024, 5, 10)} />
      </Calendar>,
    );

    expect(getByText("in 3 days")).toBeTruthy();
  });

  it("uses custom formatters", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 14) }}
      >
        <CalendarInfo
          unitFormatter={englishUnitFormatter}
          rangeFormatter={({ formatUnit, nights }) =>
            `Trip length: ${formatUnit(nights, "night")}`
          }
        />
      </Calendar>,
    );

    expect(getByText("Trip length: 4 nights")).toBeTruthy();
  });

  it("clear button clears single selection", async () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} onChange={onChange}>
        <CalendarInfo allowClear />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Clear"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("clear button clears multiple selection", async () => {
    const onChange = vi.fn();
    const dates = [D(2024, 5, 15), D(2024, 5, 16)];
    const { getByLabelText } = render(
      <Calendar mode="multiple" value={dates} onChange={onChange}>
        <CalendarInfo allowClear />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Clear"));

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("clear button clears range selection", async () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 17) }}
        onChange={onChange}
      >
        <CalendarInfo allowClear />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Clear"));

    expect(onChange).toHaveBeenCalledWith({ from: null, to: null });
  });

  it("does not render clear button while only the empty label is visible", () => {
    const { queryByLabelText } = render(
      <Calendar mode="single">
        <CalendarInfo allowClear label="Select a date" />
      </Calendar>,
    );

    expect(queryByLabelText("Clear")).toBeNull();
  });

  it("showHome navigates to the current month without changing selection", () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 15));
    const onChange = vi.fn();
    const { getByLabelText, getByTestId } = render(
      <Calendar mode="single" value={D(2024, 0, 10)} onChange={onChange}>
        <CalendarInfo showHome />
        <ViewProbe />
      </Calendar>,
    );

    expect(getByTestId("view-month")).toHaveTextContent("2024-0");

    fireEvent.click(getByLabelText("Go to current month"));

    expect(getByTestId("view-month")).toHaveTextContent("2024-5");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("showHome is disabled for the current month", () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 15));
    const { getByLabelText } = render(
      <Calendar mode="single" value={D(2024, 5, 10)}>
        <CalendarInfo showHome />
      </Calendar>,
    );

    expect(getByLabelText("Go to current month")).toBeDisabled();
  });

  it("allowClear and showHome do not affect animated height", () => {
    const originalGetComputedStyle = window.getComputedStyle.bind(window);
    const getComputedStyleSpy = vi
      .spyOn(window, "getComputedStyle")
      .mockImplementation((element) => {
        const style = originalGetComputedStyle(element);
        const isPaddingProbe =
          element instanceof HTMLElement &&
          element.style.paddingTop === "var(--cal-spacing)";

        return new Proxy(style, {
          get(target, prop, receiver) {
            if (prop === "paddingTop" || prop === "paddingBottom") {
              return isPaddingProbe ? "12px" : "0px";
            }
            return Reflect.get(target, prop, receiver);
          },
        }) as CSSStyleDeclaration;
      });
    const scrollHeightSpy = vi
      .spyOn(HTMLElement.prototype, "scrollHeight", "get")
      .mockReturnValue(26);

    try {
      const renderInfo = (allowClear: boolean, showHome: boolean) => (
        <Calendar mode="single" value={D(2024, 5, 15)}>
          <CalendarInfo allowClear={allowClear} showHome={showHome} />
        </Calendar>
      );
      const { container, rerender } = render(renderInfo(false, false));
      const getInner = () =>
        container.querySelector(
          '[data-area="calendar-info"] > div',
        ) as HTMLElement;

      expect(
        getInner().style.getPropertyValue("--calendar-info-inner-height"),
      ).toBe("50px");

      rerender(renderInfo(true, true));

      expect(
        getInner().style.getPropertyValue("--calendar-info-inner-height"),
      ).toBe("50px");
    } finally {
      getComputedStyleSpy.mockRestore();
      scrollHeightSpy.mockRestore();
    }
  });
});
