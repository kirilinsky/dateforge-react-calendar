import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { __resetWarnOnce } from "@/core/dev-warn";
import { CalendarNav } from "@/modules/nav";

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  __resetWarnOnce();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

describe("Nav popups — open/close via UI state", () => {
  it("marks how many picker selector groups are rendered", () => {
    const { container, rerender } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker />
      </Calendar>,
    );
    expect(
      container
        .querySelector('[data-area="header"]')
        ?.getAttribute("data-selector-count"),
    ).toBe("1");

    rerender(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker showYearPicker />
      </Calendar>,
    );
    expect(
      container
        .querySelector('[data-area="header"]')
        ?.getAttribute("data-selector-count"),
    ).toBe("2");
  });

  it("clicking showTime button opens the time popup", async () => {
    const { container, queryByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showTime />
      </Calendar>,
    );
    expect(queryByLabelText("Select time")).toBeNull();
    const btn = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLElement | null;
    expect(btn).toBeTruthy();
    await userEvent.click(btn!);
    expect(queryByLabelText("Select time")).not.toBeNull();
  });

  it("clicking the month label (showMonthPicker) opens the month popup", async () => {
    const { container, queryByLabelText, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker />
      </Calendar>,
    );
    expect(queryByLabelText("Select month")).toBeNull();
    const labelBtn = getByLabelText(/Change month/);
    await userEvent.click(labelBtn);
    expect(
      container.querySelector('[aria-label="Select month"]'),
    ).not.toBeNull();
  });

  it("clicking the year label (showYearPicker) opens the year popup", async () => {
    const { container, getByLabelText, queryByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showYearPicker />
      </Calendar>,
    );
    expect(queryByLabelText("Select year")).toBeNull();
    const labelBtn = getByLabelText(/Change year/);
    await userEvent.click(labelBtn);
    expect(
      container.querySelector('[aria-label="Select year"]'),
    ).not.toBeNull();
  });

  it("compactTime icon button opens the time popup", async () => {
    const { queryByLabelText, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav compactTime />
      </Calendar>,
    );
    expect(queryByLabelText("Select time")).toBeNull();
    const btn = getByLabelText(/Change time/);
    await userEvent.click(btn);
    expect(queryByLabelText("Select time")).not.toBeNull();
  });

  it("compactTime does not render any nav UI other than the icon button", () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav compactTime />
      </Calendar>,
    );
    expect(getByLabelText(/Change time/)).toBeTruthy();
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("compactTime button shows current time in its aria-label", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15, 14, 30)}>
        <CalendarNav compactTime />
      </Calendar>,
    );
    const btn = getByLabelText(/Change time, currently/);
    expect(btn.getAttribute("aria-label")).toMatch(/\d/);
  });

  it("compactMonths button opens the same month popup", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav compactMonths />
      </Calendar>,
    );
    const btn = getByLabelText(/Change month/);
    await userEvent.click(btn);
    expect(
      container.querySelector('[aria-label="Select month"]'),
    ).not.toBeNull();
  });

  it("opening time popup does not affect selection state", async () => {
    let lastValue: unknown = "untouched";
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        onChange={(v) => {
          lastValue = v;
        }}
      >
        <CalendarNav showTime />
      </Calendar>,
    );
    const btn = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLElement;
    await userEvent.click(btn);
    expect(lastValue).toBe("untouched");
  });

  it("does not render a duplicate popup from an offset nav", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)} cols={4}>
        <CalendarNav showMonthPicker yearLabel col={2} />
        <CalendarNav monthLabel yearLabel offset={1} col={2} />
      </Calendar>,
    );

    await userEvent.click(getByLabelText(/Change month/));

    expect(
      container.querySelectorAll('[role="dialog"][aria-label="Select month"]'),
    ).toHaveLength(1);
  });
});

describe("Nav — ambiguous picker combinations", () => {
  it("warns when showMonthPicker and compactMonths are both true", () => {
    render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker compactMonths />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    const msg = warnSpy.mock.calls.flat().join(" ");
    expect(msg).toContain("month UI variants");
  });

  it("warns when showYearPicker and compactYears are both true", () => {
    render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showYearPicker compactYears />
      </Calendar>,
    );
    expect(warnSpy).toHaveBeenCalled();
    const msg = warnSpy.mock.calls.flat().join(" ");
    expect(msg).toContain("year UI variants");
  });

  it("does not warn when only one of each pair is set", () => {
    render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker showYearPicker />
      </Calendar>,
    );
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
