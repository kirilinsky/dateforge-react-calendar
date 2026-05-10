import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";

const VIEW_DATE = new Date(2024, 5, 15);

const getHeaders = (container: HTMLElement): HTMLElement[] =>
  within(container).queryAllByRole("columnheader");

describe("WeekDays — rendering", () => {
  it("renders 7 columnheader cells by default", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays />
      </Calendar>,
    );
    expect(getHeaders(container)).toHaveLength(7);
  });

  it("renders nothing when hideWeekdays=true", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays hideWeekdays />
      </Calendar>,
    );
    expect(getHeaders(container)).toHaveLength(0);
  });
});

describe("WeekDays — weekdayFormat", () => {
  it("short (default) → 3-letter labels in en-US", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays />
      </Calendar>,
    );
    const headers = getHeaders(container);
    expect(headers[0]?.textContent?.trim().length).toBeGreaterThanOrEqual(2);
    expect(headers[0]?.textContent?.trim().length).toBeLessThanOrEqual(3);
  });

  it("narrow → single-letter labels in en-US", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays weekdayFormat="narrow" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    for (const h of headers) {
      expect(h.textContent?.trim()).toHaveLength(1);
    }
  });

  it("long → full names in en-US", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays weekdayFormat="long" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    const labels = headers.map((h) => h.textContent?.trim().toLowerCase());
    expect(labels).toContain("monday");
    expect(labels).toContain("sunday");
  });

  it("sets data-weekday-format attribute on header", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays weekdayFormat="narrow" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    expect(headers[0]?.getAttribute("data-weekday-format")).toBe("narrow");
  });

  it("respects locale (ru-RU narrow → cyrillic letters)", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="ru-RU">
        <CalendarDays weekdayFormat="narrow" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    const text = headers.map((h) => h.textContent?.trim()).join("");
    expect(/[а-яё]/i.test(text)).toBe(true);
  });
});

describe("WeekDays — startOfWeek", () => {
  it("startOfWeek=1 (Monday) → first header label starts with 'M' in en-US", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays startOfWeek={1} weekdayFormat="narrow" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    expect(headers[0]?.textContent?.trim()).toBe("M");
  });

  it("startOfWeek=0 (Sunday) → first header label starts with 'S' in en-US", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays startOfWeek={0} weekdayFormat="narrow" />
      </Calendar>,
    );
    const headers = getHeaders(container);
    expect(headers[0]?.textContent?.trim()).toBe("S");
  });
});

describe("WeekDays — weekNumbers", () => {
  it("renders aria-hidden spacer when weekNumbers=true", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays weekNumbers />
      </Calendar>,
    );
    const headers = getHeaders(container);
    expect(headers).toHaveLength(7);
    const row = headers[0]?.parentElement;
    expect(row?.children.length).toBe(8);
    expect(row?.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("WeekDays — highlightWeekends", () => {
  it("applies weekend class when highlightWeekends=true and startOfWeek=1", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays highlightWeekends startOfWeek={1} />
      </Calendar>,
    );
    const headers = getHeaders(container);
    const lastTwo = headers.slice(5, 7);
    for (const h of lastTwo) {
      expect(h.className).toMatch(/weekend/i);
    }
  });

  it("does not apply weekend class when highlightWeekends=false", () => {
    const { container } = render(
      <Calendar value={VIEW_DATE} locale="en-US">
        <CalendarDays highlightWeekends={false} startOfWeek={1} />
      </Calendar>,
    );
    const headers = getHeaders(container);
    for (const h of headers) {
      expect(h.className).not.toMatch(/weekend/i);
    }
  });
});
