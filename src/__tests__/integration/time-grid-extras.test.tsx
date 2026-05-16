import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarTimeGrid } from "@/modules/time";

const D = (y: number, m: number, d: number, h = 0, min = 0, s = 0) =>
  new Date(y, m, d, h, min, s);

afterEach(() => {
  vi.useRealTimers();
});

describe("CalendarTimeGrid — showBoundDate", () => {
  it("renders bound date header when bound and boundDate exist", () => {
    const { container } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 15, 10, 0), to: D(2024, 5, 18, 14, 0) }}
      >
        <CalendarTimeGrid bound="from" />
      </Calendar>,
    );

    const header = container.querySelector(
      '[data-area="time"] > div[data-bound]',
    );
    expect(header).toBeTruthy();
    expect(header?.textContent).toMatch(/Jun 15, 2024/);
    expect(header?.getAttribute("data-bound")).toBe("from");
  });

  it("renders 'to' bound date when bound=to", () => {
    const { container } = render(
      <Calendar
        mode="range"
        locale="en-US"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 18) }}
      >
        <CalendarTimeGrid bound="to" />
      </Calendar>,
    );

    const header = container.querySelector('[data-bound="to"]');
    expect(header?.textContent).toMatch(/Jun 18, 2024/);
  });

  it("hides header when showBoundDate=false", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 18) }}
      >
        <CalendarTimeGrid bound="from" showBoundDate={false} />
      </Calendar>,
    );

    expect(container.querySelector("[data-bound]")).toBeNull();
  });

  it("hides header when no bound prop is set (no-op)", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showBoundDate />
      </Calendar>,
    );

    expect(container.querySelector("[data-bound]")).toBeNull();
  });

  it("hides header when bound is set but boundDate is null", () => {
    const { container } = render(
      <Calendar mode="range" value={{ from: null, to: D(2024, 5, 18) }}>
        <CalendarTimeGrid bound="from" />
      </Calendar>,
    );

    expect(container.querySelector("[data-bound]")).toBeNull();
  });

  it("hides header outside range mode even with bound", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15)}>
        <CalendarTimeGrid bound="from" />
      </Calendar>,
    );

    expect(container.querySelector("[data-bound]")).toBeNull();
  });
});

describe("CalendarTimeGrid — showReset", () => {
  it("does not render the reset button by default", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid />
      </Calendar>,
    );

    expect(
      container.querySelector('[data-area="time"] button[aria-label^="Reset"]'),
    ).toBeNull();
  });

  it("renders a localized 'now' button when showReset is true", () => {
    const { container } = render(
      <Calendar mode="single" locale="en-US" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    expect(btn).toBeTruthy();
    expect(btn.textContent).toMatch(/now/i);
    expect(btn.querySelector("svg")).toBeTruthy();
  });

  it("renders Russian 'сейчас' for ru locale", () => {
    const { container } = render(
      <Calendar mode="single" locale="ru-RU" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    expect(btn.textContent).toMatch(/сейчас/i);
  });

  it("uses custom resetLabel when provided", () => {
    const { getByText, container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showReset resetLabel="Сбросить" />
      </Calendar>,
    );

    expect(getByText("Сбросить")).toBeTruthy();
    expect(container.querySelector('[data-area="time"] svg')).toBeNull();
  });

  it("click resets time to current hour/minute on selected date", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 20, 14, 37, 0));
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)} onChange={onChange}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    fireEvent.click(btn);

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getFullYear()).toBe(2024);
    expect(last.getMonth()).toBe(5);
    expect(last.getDate()).toBe(15);
    expect(last.getHours()).toBe(14);
    expect(last.getMinutes()).toBe(37);
    expect(last.getSeconds()).toBe(0);
  });

  it("click reset includes seconds when seconds prop is true", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 20, 14, 37, 42));
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        value={D(2024, 5, 15, 10, 0, 0)}
        onChange={onChange}
      >
        <CalendarTimeGrid showReset seconds />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    fireEvent.click(btn);

    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getHours()).toBe(14);
    expect(last.getMinutes()).toBe(37);
    expect(last.getSeconds()).toBe(42);
  });

  it("click reset on range bound updates only that bound", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(D(2024, 5, 20, 9, 15, 0));
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 10, 10, 0), to: D(2024, 5, 18, 18, 0) }}
        onChange={onChange}
      >
        <CalendarTimeGrid bound="from" showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    fireEvent.click(btn);

    const last = onChange.mock.calls.at(-1)![0] as {
      from: Date;
      to: Date;
    };
    expect(last.from.getHours()).toBe(9);
    expect(last.from.getMinutes()).toBe(15);
    expect(last.from.getDate()).toBe(10);
    expect(last.to.getHours()).toBe(18);
  });

  it("does not render reset button when bound is set but boundDate is null", () => {
    const { container } = render(
      <Calendar mode="range" value={{ from: null, to: D(2024, 5, 18) }}>
        <CalendarTimeGrid bound="from" showReset />
      </Calendar>,
    );

    expect(
      container.querySelector('[data-area="time"] button[aria-label^="Reset"]'),
    ).toBeNull();
  });

  it("does not render reset button when readOnly", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)} readOnly>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    expect(
      container.querySelector('[data-area="time"] button[aria-label^="Reset"]'),
    ).toBeNull();
  });

  it("aria-label includes localized 'now' word", () => {
    const { container } = render(
      <Calendar mode="single" locale="en-US" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label]',
    ) as HTMLElement;
    expect(btn.getAttribute("aria-label")).toMatch(/Reset to now/i);
  });
});

describe("Clock icon", () => {
  it("is rendered inside the default reset button content", () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const svg = container.querySelector('[data-area="time"] button svg');
    expect(svg).toBeTruthy();
  });
});

describe("CalendarTimeGrid — header chip background", () => {
  it("applies the chip background class on the bounded date header", () => {
    const { container } = render(
      <Calendar
        mode="range"
        value={{ from: D(2024, 5, 15), to: D(2024, 5, 18) }}
      >
        <CalendarTimeGrid bound="from" />
      </Calendar>,
    );

    const header = container.querySelector("[data-bound]");
    expect(header?.className).toMatch(/boundedDate/);
  });
});

describe("openTimePopup smoke — keeps existing behavior", () => {
  it("CalendarTimeGrid still renders TimeTrack content", async () => {
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 10, 0)}>
        <CalendarTimeGrid />
      </Calendar>,
    );

    const time = container.querySelector('[data-area="time"]');
    expect(time?.children.length).toBeGreaterThan(0);
  });

  it("does not throw when locale is unknown", async () => {
    expect(() =>
      render(
        <Calendar mode="single" locale="xx-YY" value={D(2024, 5, 15, 10, 0)}>
          <CalendarTimeGrid showReset />
        </Calendar>,
      ),
    ).not.toThrow();
  });

  it("clicking with userEvent fires reset", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(D(2024, 5, 20, 11, 5, 0));
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" value={D(2024, 5, 15, 9, 0)} onChange={onChange}>
        <CalendarTimeGrid showReset />
      </Calendar>,
    );

    const btn = container.querySelector(
      '[data-area="time"] button[aria-label^="Reset"]',
    ) as HTMLElement;
    await userEvent.click(btn);

    expect(onChange).toHaveBeenCalled();
  });
});
