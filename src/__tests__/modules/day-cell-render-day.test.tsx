import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Fragment, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  DayCell,
  type DayCellProps,
  type DayState,
} from "@/modules/days/day-cell";

const TARGET = new Date(2024, 5, 15);

const baseProps: DayCellProps = {
  day: 15,
  dateTime: TARGET.getTime(),
  isDisabled: false,
  isSelected: false,
  isCurrentMonth: true,
  connectLeft: false,
  connectRight: false,
  isRangeStart: false,
  isRangeEnd: false,
  isInRange: false,
  rangeBridgeLeft: false,
  rangeBridgeRight: false,
  isPreviewStart: false,
  isPreviewEnd: false,
  isPreviewMid: false,
  previewBridgeLeft: false,
  previewBridgeRight: false,
  isTodayDate: false,
  highlightToday: true,
  isWeekend: false,
  boldWeekends: false,
  range: false,
  ariaLabel: "June 15, 2024",
  tabIndex: 0,
  readOnly: false,
  isMaxReachedTarget: false,
  onSelect: vi.fn(),
  onMouseEnter: vi.fn(),
  onKeyDown: vi.fn(),
};

const renderCell = (overrides: Partial<DayCellProps> = {}) => {
  const result = render(<DayCell {...baseProps} {...overrides} />);
  return { ...result, button: screen.getByRole("button") };
};

describe("DayCell renderDay — default behavior", () => {
  it("renders day number as plain label when renderDay is omitted", () => {
    const { button } = renderCell();
    expect(button.textContent).toBe("15");
  });

  it("default render preserves a11y attributes and data-cell hook", () => {
    const { button } = renderCell();
    expect(button).toHaveAttribute("aria-label", "June 15, 2024");
    expect(button).toHaveAttribute("data-cell", "");
    expect(button).toHaveAttribute("type", "button");
  });
});

describe("DayCell renderDay — receives correct args", () => {
  it("passes a Date instance matching the cell's dateTime", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>((d) => (
      <span data-testid="iso">{d.toISOString()}</span>
    ));
    renderCell({ renderDay: spy });
    expect(spy).toHaveBeenCalledOnce();
    const [receivedDate] = spy.mock.calls[0];
    expect(receivedDate).toBeInstanceOf(Date);
    expect(receivedDate.getTime()).toBe(TARGET.getTime());
    expect(screen.getByTestId("iso").textContent).toBe(TARGET.toISOString());
  });

  it("DayState includes all 8 documented flags", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({ renderDay: spy });
    const [, state] = spy.mock.calls[0];
    expect(Object.keys(state).sort()).toEqual(
      [
        "isDisabled",
        "isInRange",
        "isOtherMonth",
        "isRangeEnd",
        "isRangeStart",
        "isSelected",
        "isToday",
        "isWeekend",
      ].sort(),
    );
  });

  it("DayState.isOtherMonth is true when isCurrentMonth=false", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({ isCurrentMonth: false, renderDay: spy });
    expect(spy.mock.calls[0][1].isOtherMonth).toBe(true);
  });

  it("DayState.isToday is false when highlightToday=false even on today's date", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({ isTodayDate: true, highlightToday: false, renderDay: spy });
    expect(spy.mock.calls[0][1].isToday).toBe(false);
  });

  it("DayState.isToday is true when both highlightToday and isTodayDate are set", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({ isTodayDate: true, highlightToday: true, renderDay: spy });
    expect(spy.mock.calls[0][1].isToday).toBe(true);
  });

  it("DayState reflects selected / disabled / weekend / range flags", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({
      isSelected: true,
      isDisabled: true,
      isWeekend: true,
      isInRange: true,
      isRangeStart: true,
      isRangeEnd: true,
      renderDay: spy,
    });
    const state = spy.mock.calls[0][1];
    expect(state).toMatchObject({
      isSelected: true,
      isDisabled: true,
      isWeekend: true,
      isInRange: true,
      isRangeStart: true,
      isRangeEnd: true,
    });
  });
});

describe("DayCell renderDay — return value tolerance", () => {
  it("returning null renders an empty button (no crash)", () => {
    const { button } = renderCell({ renderDay: () => null });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("");
  });

  it("returning undefined renders an empty button (no crash)", () => {
    const { button } = renderCell({ renderDay: () => undefined });
    expect(button).toBeInTheDocument();
    expect(button.textContent).toBe("");
  });

  it("returning false / true renders nothing visible", () => {
    const { button } = renderCell({ renderDay: () => false });
    expect(button.textContent).toBe("");
  });

  it("returning a string renders the text", () => {
    const { button } = renderCell({ renderDay: (d) => `Day ${d.getDate()}` });
    expect(button.textContent).toBe("Day 15");
  });

  it("returning a number renders the digit", () => {
    const { button } = renderCell({ renderDay: () => 42 });
    expect(button.textContent).toBe("42");
  });

  it("returning an array of nodes renders all in order", () => {
    const { button } = renderCell({
      renderDay: (d) => [
        <span key="a">A</span>,
        <span key="b">{d.getDate()}</span>,
        <span key="c">B</span>,
      ],
    });
    expect(button.textContent).toBe("A15B");
  });

  it("returning a Fragment renders children", () => {
    const { button } = renderCell({
      renderDay: (d) => (
        <Fragment>
          <span>X</span>
          <span>{d.getDate()}</span>
        </Fragment>
      ),
    });
    expect(button.textContent).toBe("X15");
  });

  it("nested element tree renders with all descendants", () => {
    const { button } = renderCell({
      renderDay: (d) => (
        <div>
          <div>
            <div>
              <span>deep {d.getDate()}</span>
            </div>
          </div>
        </div>
      ),
    });
    expect(button.textContent).toBe("deep 15");
  });
});

describe("DayCell renderDay — interactions stay wired to the cell", () => {
  it("clicking custom content still fires onSelect with the cell's date", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderCell({
      renderDay: (d) => <span data-testid="hit">{d.getDate()}</span>,
      onSelect,
    });
    await user.click(screen.getByTestId("hit"));
    expect(onSelect).toHaveBeenCalledOnce();
    const [date, isDisabled] = onSelect.mock.calls[0];
    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBe(TARGET.getTime());
    expect(isDisabled).toBe(false);
  });

  it("clicking custom content respects readOnly (no onSelect)", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderCell({
      readOnly: true,
      renderDay: (d) => <span data-testid="ro">{d.getDate()}</span>,
      onSelect,
    });
    await user.click(screen.getByTestId("ro"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("hover over custom content fires onMouseEnter with the cell's date", async () => {
    const onMouseEnter = vi.fn();
    const user = userEvent.setup();
    renderCell({
      renderDay: () => <span data-testid="hover">x</span>,
      onMouseEnter,
    });
    await user.hover(screen.getByTestId("hover"));
    expect(onMouseEnter).toHaveBeenCalled();
    expect(onMouseEnter.mock.calls[0][0].getTime()).toBe(TARGET.getTime());
  });

  it("keyboard activation on the button still works with custom content", async () => {
    const onKeyDown = vi.fn();
    const user = userEvent.setup();
    const { button } = renderCell({
      renderDay: () => <span>x</span>,
      onKeyDown,
    });
    button.focus();
    await user.keyboard("{ArrowRight}");
    expect(onKeyDown).toHaveBeenCalled();
  });
});

describe("DayCell renderDay — data attributes and a11y preserved", () => {
  it("all state data-* attributes still applied with custom content", () => {
    const { button } = renderCell({
      isSelected: true,
      isTodayDate: true,
      isDisabled: false,
      isInRange: true,
      isRangeStart: true,
      isWeekend: true,
      range: true,
      renderDay: () => <span>custom</span>,
    });
    expect(button).toHaveAttribute("data-selected", "true");
    expect(button).toHaveAttribute("data-today", "true");
    expect(button).toHaveAttribute("data-in-range", "true");
    expect(button).toHaveAttribute("data-range-start", "true");
    expect(button).toHaveAttribute("data-weekend", "true");
    expect(button).toHaveAttribute("data-range-mode", "true");
  });

  it("aria-label persists when renderDay returns minimal content", () => {
    const { button } = renderCell({
      ariaLabel: "Custom label",
      renderDay: () => null,
    });
    expect(button).toHaveAttribute("aria-label", "Custom label");
  });

  it("aria-disabled propagates regardless of renderDay output", () => {
    const { button } = renderCell({
      isDisabled: true,
      renderDay: () => <span>nope</span>,
    });
    expect(button).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DayCell renderDay — call cadence and stability", () => {
  it("calls renderDay exactly once per render", () => {
    const spy = vi.fn<(d: Date, s: DayState) => ReactNode>(() => null);
    renderCell({ renderDay: spy });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("re-rendering with a different renderDay reference uses the new one", () => {
    const first = vi.fn(() => <span>FIRST</span>);
    const second = vi.fn(() => <span>SECOND</span>);
    const { rerender, button } = renderCell({ renderDay: first });
    expect(button.textContent).toBe("FIRST");
    rerender(<DayCell {...baseProps} renderDay={second} />);
    expect(button.textContent).toBe("SECOND");
    expect(second).toHaveBeenCalled();
  });

  it("re-rendering with the same DayCellProps does not re-invoke renderDay (memoized)", () => {
    const spy = vi.fn(() => <span>x</span>);
    const { rerender } = renderCell({ renderDay: spy });
    rerender(<DayCell {...baseProps} renderDay={spy} />);
    // React.memo prevents re-render when props are referentially equal,
    // so renderDay should be called exactly once across both renders.
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
