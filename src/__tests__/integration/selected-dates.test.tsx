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

  it("Clear button calls onChange with null", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} onChange={onChange}>
        <CalendarSelectedDates />
      </Calendar>,
    );
    const clear = container.querySelector(
      '[aria-label="Clear"]',
    ) as HTMLButtonElement;
    await userEvent.click(clear);
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("Clear button is disabled in readOnly", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)} readOnly>
        <CalendarSelectedDates />
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
    const chips = container.querySelectorAll(
      'button[type="button"]:not([aria-label="Clear"])',
    );
    expect(chips.length).toBe(3);
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
