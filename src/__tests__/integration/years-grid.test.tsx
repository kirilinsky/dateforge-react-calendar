import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { createDisabled } from "@/utils/create-disabled";

const yearButtons = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll('[data-area="years-grid"] button'),
  ) as HTMLElement[];

const yearButton = (container: HTMLElement, label: number) =>
  yearButtons(container).find((b) =>
    b.getAttribute("aria-label")?.startsWith(`${label}`),
  );

describe("CalendarYearsGrid", () => {
  it("clicking a year navigates viewDate to that year", async () => {
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        defaultViewDate={new Date(2024, 5, 15)}
      >
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const btn = yearButton(container, 2026);
    expect(btn).toBeTruthy();
    await userEvent.click(btn!);
    const current = container.querySelector('[aria-current="true"]');
    expect(current?.textContent).toBe("2026");
  });

  it("arrow keys move focus between year tiles", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const current = yearButton(container, 2024)!;
    const next = yearButton(container, 2025)!;
    expect(current.tabIndex).toBe(0);
    current.focus();
    fireEvent.keyDown(current, { key: "ArrowRight" });
    expect(document.activeElement).toBe(next);
  });

  it("Next/Previous chevrons paginate through years", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const before = (
      container.querySelector(
        '[data-area="years-grid"] [aria-live="polite"]',
      ) as HTMLElement
    ).textContent;
    const next = getByLabelText("Next years");
    fireEvent.click(next);
    const after = (
      container.querySelector(
        '[data-area="years-grid"] [aria-live="polite"]',
      ) as HTMLElement
    ).textContent;
    expect(after).not.toBe(before);

    const prev = getByLabelText("Previous years");
    fireEvent.click(prev);
    const back = (
      container.querySelector(
        '[data-area="years-grid"] [aria-live="polite"]',
      ) as HTMLElement
    ).textContent;
    expect(back).toBe(before);
  });

  it("Previous chevron is disabled at the first page (minDate-bounded)", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)} minDate={new Date(2020, 0, 1)}>
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const prev = getByLabelText("Previous years") as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
  });

  it("Next chevron is disabled at the last page (maxDate-bounded)", () => {
    const { getByLabelText } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        minDate={new Date(2020, 0, 1)}
        maxDate={new Date(2029, 11, 31)}
      >
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const next = getByLabelText("Next years") as HTMLButtonElement;
    expect(next.disabled).toBe(true);
  });

  it("year fully covered by `disabled.before` is marked aria-disabled", () => {
    const disabled = createDisabled({ before: new Date(2025, 0, 1) });
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)} disabled={disabled}>
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const btn = yearButton(container, 2020);
    expect(btn?.getAttribute("aria-disabled")).toBe("true");
  });

  it("hideOutOfRange hides limited years from the grid", () => {
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        minDate={new Date(2024, 0, 1)}
        maxDate={new Date(2025, 11, 31)}
      >
        <CalendarYearsGrid yearsPerPage={10} hideOutOfRange />
      </Calendar>,
    );
    const limited = yearButtons(container).filter(
      (b) => b.getAttribute("aria-hidden") === "true",
    );
    expect(limited.length).toBeGreaterThan(0);
  });

  it("invalid yearsPerPage clamps and emits dev warning", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarYearsGrid yearsPerPage={100} />
      </Calendar>,
    );
    const msgs = warn.mock.calls.flat().join(" ");
    expect(msgs).toContain("yearsPerPage");
    warn.mockRestore();
  });

  it("clicking a `disableOutOfRange` year is a no-op", async () => {
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        minDate={new Date(2024, 0, 1)}
        maxDate={new Date(2025, 11, 31)}
      >
        <CalendarYearsGrid yearsPerPage={10} />
      </Calendar>,
    );
    const out = yearButtons(container).find(
      (b) => b.getAttribute("aria-disabled") === "true",
    );
    expect(out).toBeTruthy();
    await userEvent.click(out!);
    const current = container.querySelector('[aria-current="true"]');
    expect(current?.textContent).toBe("2024");
  });
});
