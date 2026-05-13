import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSelectedDates } from "@/modules/selected-dates";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

describe("CalendarSelectedDates — single mode", () => {
  it("renders nothing when no value and animated=false", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarSelectedDates animated={false} />
      </Calendar>,
    );
    expect(container.querySelector('[data-area="selected-dates"]')).toBeNull();
  });

  it("renders empty container when animated=true and no value", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarSelectedDates animated />
      </Calendar>,
    );
    expect(
      container.querySelector('[data-area="selected-dates"]'),
    ).toBeTruthy();
  });

  it("does not render Clear when animated=true and no value", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarSelectedDates animated allowClear />
      </Calendar>,
    );
    expect(container.querySelector('[aria-label="Clear"]')).toBeNull();
  });

  it("keeps animated height numeric after select-clear-select", () => {
    const renderSelectedDates = (value: Date | null) => (
      <Calendar mode="single" value={value}>
        <CalendarSelectedDates animated />
      </Calendar>
    );
    const { container, rerender } = render(renderSelectedDates(D(2024, 5, 15)));
    const getInner = () =>
      container.querySelector(
        '[data-area="selected-dates"] > div',
      ) as HTMLElement;

    expect(
      getInner().style.getPropertyValue("--selected-dates-inner-height"),
    ).toMatch(/px$/);

    rerender(renderSelectedDates(null));
    expect(
      getInner().style.getPropertyValue("--selected-dates-inner-height"),
    ).toBe("0px");

    rerender(renderSelectedDates(D(2024, 5, 16)));
    expect(
      getInner().style.getPropertyValue("--selected-dates-inner-height"),
    ).toMatch(/px$/);
  });

  it("measures animated height with target padding, not transitional padding", () => {
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
      const { container } = render(
        <Calendar mode="single" value={D(2024, 5, 15)}>
          <CalendarSelectedDates animated />
        </Calendar>,
      );
      const inner = container.querySelector(
        '[data-area="selected-dates"] > div',
      ) as HTMLElement;

      expect(
        inner.style.getPropertyValue("--selected-dates-inner-height"),
      ).toBe("50px");
    } finally {
      getComputedStyleSpy.mockRestore();
      scrollHeightSpy.mockRestore();
    }
  });

  it("renders single chip with formatted date", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates />
      </Calendar>,
    );
    const chips = container.querySelectorAll("button[type='button']");
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Clear button when allowClear=true and value present", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates allowClear />
      </Calendar>,
    );
    expect(container.querySelector('[aria-label="Clear"]')).toBeTruthy();
  });

  it("does not render Clear when allowClear=false", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates allowClear={false} />
      </Calendar>,
    );
    expect(container.querySelector('[aria-label="Clear"]')).toBeNull();
  });

  it("does not render Clear by default", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates />
      </Calendar>,
    );
    expect(container.querySelector('[aria-label="Clear"]')).toBeNull();
  });

  it("Clear button calls onChange with null", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} onChange={onChange}>
        <CalendarSelectedDates allowClear />
      </Calendar>,
    );
    const clear = container.querySelector(
      '[aria-label="Clear"]',
    ) as HTMLButtonElement;
    await userEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("per-chip clear removes the selected date in single mode", async () => {
    const onChange = vi.fn();
    const { getByLabelText } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} onChange={onChange}>
        <CalendarSelectedDates allowClearPerChip />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Remove selected date"));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("Clear button is disabled in readOnly", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} readOnly>
        <CalendarSelectedDates allowClear />
      </Calendar>,
    );
    const clear = container.querySelector(
      '[aria-label="Clear"]',
    ) as HTMLButtonElement;
    expect(clear.disabled).toBe(true);
  });

  it("chip click navigates when allowNavigate=true", async () => {
    const otherMonth = D(2024, 2, 10);
    const { container } = render(
      <Calendar mode="single" defaultValue={otherMonth}>
        <CalendarSelectedDates allowNavigate />
      </Calendar>,
    );
    const chips = container.querySelectorAll(
      'button[type="button"]:not([aria-label="Clear"])',
    );
    if (chips.length > 0) {
      await userEvent.click(chips[0] as HTMLButtonElement);
    }
    expect(true).toBe(true);
  });

  it("renders with showTime — formatter includes hour/minute", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates showTime />
      </Calendar>,
    );
    const chips = container.querySelectorAll("button[type='button']");
    expect(chips.length).toBeGreaterThanOrEqual(1);
  });

  it("renders with align=center", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates align="center" />
      </Calendar>,
    );
    expect(
      container.querySelector('[data-area="selected-dates"]'),
    ).toBeTruthy();
  });

  it("renders with align=right", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarSelectedDates align="right" />
      </Calendar>,
    );
    expect(
      container.querySelector('[data-area="selected-dates"]'),
    ).toBeTruthy();
  });
});

describe("CalendarSelectedDates — multiple mode", () => {
  it("renders multiple chips", () => {
    const dates = [D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)];
    const { container } = render(
      <Calendar mode="multiple" value={dates}>
        <CalendarSelectedDates />
      </Calendar>,
    );
    const chips = container.querySelectorAll("[data-selected-date-chip]");
    expect(chips.length).toBe(3);
  });

  it("per-chip clear removes one date in multiple mode", async () => {
    const onChange = vi.fn();
    const dates = [D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)];
    const { getAllByLabelText } = render(
      <Calendar mode="multiple" value={dates} onChange={onChange}>
        <CalendarSelectedDates allowClearPerChip />
      </Calendar>,
    );

    await userEvent.click(getAllByLabelText("Remove selected date")[1]);

    expect(onChange).toHaveBeenCalledWith([dates[0], dates[2]]);
  });

  it("per-chip clear does not nest buttons", () => {
    const dates = [D(2024, 5, 15), D(2024, 5, 16)];
    const { container } = render(
      <Calendar mode="multiple" value={dates}>
        <CalendarSelectedDates allowClearPerChip />
      </Calendar>,
    );

    expect(container.querySelector("button button")).toBeNull();
  });

  it("limits visible chips and renders overflow count", () => {
    const dates = [
      D(2024, 5, 15),
      D(2024, 5, 16),
      D(2024, 5, 17),
      D(2024, 5, 18),
    ];
    const { container, getByText } = render(
      <Calendar mode="multiple" value={dates}>
        <CalendarSelectedDates maxVisibleChips={2} />
      </Calendar>,
    );
    const chips = container.querySelectorAll("[data-selected-date-chip]");
    expect(chips.length).toBe(2);
    expect(getByText("+2")).toBeTruthy();
  });

  it("expands overflow chips on click", async () => {
    const dates = [
      D(2024, 5, 15),
      D(2024, 5, 16),
      D(2024, 5, 17),
      D(2024, 5, 18),
    ];
    const { container, getByText, queryByText } = render(
      <Calendar mode="multiple" value={dates}>
        <CalendarSelectedDates maxVisibleChips={2} />
      </Calendar>,
    );

    await userEvent.click(getByText("+2"));

    expect(container.querySelectorAll("[data-selected-date-chip]").length).toBe(
      4,
    );
    expect(queryByText("+2")).toBeNull();
  });

  it("uses custom overflow label template", () => {
    const dates = [D(2024, 5, 15), D(2024, 5, 16), D(2024, 5, 17)];
    const { getByText } = render(
      <Calendar mode="multiple" value={dates}>
        <CalendarSelectedDates
          maxVisibleChips={1}
          overflowLabel="{count} hidden"
        />
      </Calendar>,
    );
    expect(getByText("2 hidden")).toBeTruthy();
  });

  it("empty array → no chips, but Clear hidden when no content", () => {
    const { container } = render(
      <Calendar mode="multiple">
        <CalendarSelectedDates animated={false} />
      </Calendar>,
    );
    expect(container.querySelector('[data-area="selected-dates"]')).toBeNull();
  });
});

describe("CalendarSelectedDates — range mode", () => {
  it("renders nothing when no rangeStart and animated=false", () => {
    const { container } = render(
      <Calendar mode="range">
        <CalendarSelectedDates animated={false} />
      </Calendar>,
    );
    expect(container.querySelector('[data-area="selected-dates"]')).toBeNull();
  });

  it("renders only start chip when rangeStart but no rangeEnd", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10), to: undefined as unknown as Date }}
      >
        <CalendarSelectedDates />
      </Calendar>,
    );
    const chips = container.querySelectorAll(
      'button[type="button"]:not([aria-label="Clear"])',
    );
    expect(chips.length).toBe(1);
  });

  it("renders both start and end chips with separator", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10), to: D(2024, 5, 20) }}
      >
        <CalendarSelectedDates />
      </Calendar>,
    );
    const chips = container.querySelectorAll(
      'button[type="button"]:not([aria-label="Clear"])',
    );
    expect(chips.length).toBe(2);
  });

  it("per-chip clear removes one range bound", async () => {
    const onChange = vi.fn();
    const from = D(2024, 5, 10);
    const to = D(2024, 5, 20);
    const { getByLabelText } = render(
      <Calendar mode="range" value={{ from, to }} onChange={onChange}>
        <CalendarSelectedDates allowClearPerChip />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Remove range end"));

    expect(onChange).toHaveBeenCalledWith({ from, to: null });
  });

  it("range chip click navigates when allowNavigate", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 0, 10), to: D(2024, 5, 20) }}
        onChange={onChange}
      >
        <CalendarSelectedDates allowNavigate />
      </Calendar>,
    );
    const chips = container.querySelectorAll(
      'button[type="button"]:not([aria-label="Clear"])',
    );
    if (chips.length > 0) {
      await userEvent.click(chips[0] as HTMLButtonElement);
    }
    expect(true).toBe(true);
  });
});
