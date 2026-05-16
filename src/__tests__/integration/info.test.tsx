import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { useNavigation } from "@/context/navigation-context";
import { CalendarInfo } from "@/modules/info";

const D = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m, d, h, min);

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
  it("renders nothing when no value, animated=false, and no empty label", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeNull();
  });

  it("keeps the block visible with emptyLabel when selection is empty", () => {
    const { container, getByText } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} emptyLabel="Select a date" />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeTruthy();
    expect(getByText("Select a date")).toBeTruthy();
  });

  it("treats boolean ReactNode values as empty", () => {
    const { container, rerender } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} emptyLabel={false} />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeNull();

    rerender(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarInfo animated={false} formatter={() => false} />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeNull();
  });

  it("renders single selection count by default via Intl", () => {
    const { getByText } = render(
      <Calendar mode="single" locale="en-US" value={D(2024, 5, 15)}>
        <CalendarInfo animated={false} />
      </Calendar>,
    );

    expect(getByText("1 day")).toBeTruthy();
  });

  it("renders multiple selection count by default via Intl", () => {
    const { getByText } = render(
      <Calendar
        mode="multiple"
        locale="en-US"
        value={[D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)]}
      >
        <CalendarInfo animated={false} />
      </Calendar>,
    );

    expect(getByText("3 days")).toBeTruthy();
  });

  it("uses a custom formatter for selected values", () => {
    const { getByText } = render(
      <Calendar
        mode="multiple"
        value={[D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)]}
      >
        <CalendarInfo
          formatter={(value) =>
            Array.isArray(value) ? `${value.length} dates selected` : null
          }
        />
      </Calendar>,
    );

    expect(getByText("3 dates selected")).toBeTruthy();
  });

  it("renders range days count by default via Intl", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 17) }}
      >
        <CalendarInfo />
      </Calendar>,
    );

    expect(getByText("7 days")).toBeTruthy();
  });

  it("renders range duration when rangeStyle=duration", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 10, 10), to: D(2024, 5, 13, 14) }}
      >
        <CalendarInfo rangeStyle="duration" />
      </Calendar>,
    );

    expect(getByText("3 days 4 hours")).toBeTruthy();
  });

  it("renders prefix alongside range metric", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 4, 14), to: D(2024, 4, 21) }}
      >
        <CalendarInfo prefix="Trip:" />
      </Calendar>,
    );

    expect(getByText("Trip:")).toBeTruthy();
    expect(getByText("7 days")).toBeTruthy();
  });

  it("uses Intl relative formatting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 10));
    const { getByText } = render(
      <Calendar mode="single" value={D(2024, 5, 13)}>
        <CalendarInfo showSummary={false} showRelative />
      </Calendar>,
    );

    expect(getByText("in 3 days")).toBeTruthy();
  });

  it("can show summary and relative together", () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 10));
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 13), to: D(2024, 5, 17) }}
      >
        <CalendarInfo showRelative />
      </Calendar>,
    );

    expect(getByText("4 days")).toBeTruthy();
    expect(getByText("in 3 days")).toBeTruthy();
  });

  it("uses custom formatter for range values", () => {
    const { getByText } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 14) }}
      >
        <CalendarInfo
          formatter={(value) =>
            value && !Array.isArray(value) && !(value instanceof Date)
              ? `Trip length: ${
                  value.from && value.to
                    ? Math.abs(value.to.getDate() - value.from.getDate())
                    : 0
                } days`
              : null
          }
        />
      </Calendar>,
    );

    expect(getByText("Trip length: 4 days")).toBeTruthy();
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
        <CalendarInfo allowClear emptyLabel="Select a date" />
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

  it("showHome keeps the block visible without selection or empty label", () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 15));
    const { container, getByLabelText } = render(
      <Calendar mode="single">
        <CalendarInfo animated={false} showHome />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeTruthy();
    expect(getByLabelText("Go to current month")).toBeTruthy();
    expect(
      container.querySelector('[data-area="calendar-info"] [role="status"]'),
    ).toBeNull();
  });

  it("allowClear with selection keeps the block visible without summary", () => {
    const { container, getByLabelText } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarInfo animated={false} allowClear showSummary={false} />
      </Calendar>,
    );

    expect(container.querySelector('[data-area="calendar-info"]')).toBeTruthy();
    expect(getByLabelText("Clear")).toBeTruthy();
    expect(
      container.querySelector('[data-area="calendar-info"] [role="status"]'),
    ).toBeNull();
  });

  it("emptyLabel renders when nothing selected, summary takes over when selected", () => {
    const { queryByText, rerender } = render(
      <Calendar mode="single">
        <CalendarInfo
          animated={false}
          emptyLabel="Pick a date"
          formatter={(value) => (value instanceof Date ? "1 selected" : null)}
        />
      </Calendar>,
    );

    expect(queryByText("Pick a date")).toBeTruthy();
    expect(queryByText("1 selected")).toBeNull();

    rerender(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarInfo
          animated={false}
          emptyLabel="Pick a date"
          formatter={(value) => (value instanceof Date ? "1 selected" : null)}
        />
      </Calendar>,
    );

    expect(queryByText("Pick a date")).toBeNull();
    expect(queryByText("1 selected")).toBeTruthy();
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
          <CalendarInfo
            allowClear={allowClear}
            showHome={showHome}
            formatter={() => "1"}
          />
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

  it("remeasures animated height when action buttons appear", () => {
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
    const offsetHeightSpy = vi
      .spyOn(HTMLElement.prototype, "offsetHeight", "get")
      .mockImplementation(function (this: HTMLElement) {
        return this.getAttribute("aria-label") === "Go to current month"
          ? 60
          : 0;
      });

    try {
      const renderInfo = (showHome: boolean) => (
        <Calendar mode="single" value={D(2024, 5, 15)}>
          <CalendarInfo showHome={showHome} formatter={() => "1"} />
        </Calendar>
      );
      const { container, rerender } = render(renderInfo(false));
      const getInner = () =>
        container.querySelector(
          '[data-area="calendar-info"] > div',
        ) as HTMLElement;

      expect(
        getInner().style.getPropertyValue("--calendar-info-inner-height"),
      ).toBe("50px");

      rerender(renderInfo(true));

      expect(
        getInner().style.getPropertyValue("--calendar-info-inner-height"),
      ).toBe("84px");
    } finally {
      getComputedStyleSpy.mockRestore();
      scrollHeightSpy.mockRestore();
      offsetHeightSpy.mockRestore();
    }
  });
});
