import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarLunar } from "@/modules/lunar";

const FIXED = new Date(2024, 0, 25); // 2024-01-25, ~full moon
const FULL_PHRASE_LONG = "Full moon";
const WINDOW_LENGTH = 21;
const ANCHOR_INDEX = 10;

describe("CalendarLunar", () => {
  it("renders a 21-cell strip (fixed DOM, CSS auto-fits visible subset)", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar />
      </Calendar>,
    );
    const strip = screen.getByRole("list", { name: "Lunar phases" });
    expect(strip).toBeInTheDocument();
    const cells = strip.querySelectorAll("[data-phase]");
    expect(cells.length).toBe(WINDOW_LENGTH);
  });

  it("marks the anchor cell with aria-current and data-anchor", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    const anchorCells = Array.from(cells).filter(
      (c) => c.getAttribute("data-anchor") === "true",
    );
    expect(anchorCells).toHaveLength(1);
    expect(anchorCells[0].getAttribute("aria-current")).toBe("date");
  });

  it("anchor cell sits at index 10 (center of 21-cell window)", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    expect(cells[ANCHOR_INDEX].getAttribute("data-anchor")).toBe("true");
  });

  it("phase label is rendered by default (NASA-style abbrev)", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    const anchorCell = cells[ANCHOR_INDEX];
    expect(anchorCell.textContent).toContain("FULL");
  });

  it("phaseLabels=false hides visible labels but keeps aria-label", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar phaseLabels={false} />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    const anchorCell = cells[ANCHOR_INDEX];
    expect(anchorCell.textContent).not.toContain("FULL");
    expect(anchorCell.textContent).toContain(FULL_PHRASE_LONG);
  });

  it("phaseLabels override per phase", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar phaseLabels={{ full: "ПОЛН" }} />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    const anchorCell = cells[ANCHOR_INDEX];
    expect(anchorCell.textContent).toContain("ПОЛН");
  });

  it("phaseAriaLabels override per phase", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar phaseAriaLabels={{ full: "Полнолуние" }} />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    expect(cells[ANCHOR_INDEX].textContent).toMatch(/Полнолуние/);
  });

  it("custom lunarLabel applies to the strip group", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <CalendarLunar lunarLabel="Фазы луны" />
      </Calendar>,
    );
    expect(screen.getByRole("list", { name: "Фазы луны" })).toBeInTheDocument();
  });

  it("falls back to viewDate when nothing is selected", () => {
    render(
      <Calendar defaultViewDate={FIXED}>
        <CalendarLunar />
      </Calendar>,
    );
    const cells = document.querySelectorAll("[data-phase]");
    expect(cells.length).toBe(WINDOW_LENGTH);
    expect(cells[ANCHOR_INDEX].getAttribute("data-anchor")).toBe("true");
  });
});
