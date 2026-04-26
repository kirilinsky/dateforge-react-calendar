import { describe, it, expect } from "vitest";
import { render, within } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { CalendarDays } from "@/modules/days";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarProvider } from "@/core/provider";

expect.extend(toHaveNoViolations);

// Fixed date so tests don't depend on "today"
const VIEW_DATE = new Date(2024, 5, 15); // June 15 2024

function renderDays(
  props: {
    value?: Date | null;
    minDate?: Date;
    maxDate?: Date;
    mode?: "single" | "range" | "multiple";
    hideOutOfRange?: boolean;
    fixedRows?: boolean;
    currentMonthOnly?: boolean;
  } = {},
) {
  return render(
    <CalendarProvider
      value={
        props.value !== undefined
          ? props.value
          : props.mode === "range"
            ? ({ from: VIEW_DATE, to: null } as never)
            : props.mode === "multiple"
              ? ([VIEW_DATE] as never)
              : VIEW_DATE
      }
      mode={props.mode ?? "single"}
      minDate={props.minDate}
      maxDate={props.maxDate}
    >
      <div>
        <CalendarDays
          hideOutOfRange={props.hideOutOfRange}
          fixedRows={props.fixedRows}
          currentMonthOnly={props.currentMonthOnly}
        />
      </div>
    </CalendarProvider>,
  );
}

// ─── axe — no violations ──────────────────────────────────────────────────────

describe("CalendarDays — axe", () => {
  it("no violations — default render", async () => {
    const { container } = renderDays();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — with selected date", async () => {
    const { container } = renderDays({ value: new Date(2024, 5, 10) });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — with minDate/maxDate", async () => {
    const { container } = renderDays({
      value: new Date(2024, 5, 15),
      minDate: new Date(2024, 5, 5),
      maxDate: new Date(2024, 5, 25),
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — range mode", async () => {
    const { container } = renderDays({ mode: "range" });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — hideOutOfRange with min/max", async () => {
    const { container } = renderDays({
      value: new Date(2024, 5, 15),
      minDate: new Date(2024, 5, 5),
      maxDate: new Date(2024, 5, 25),
      hideOutOfRange: true,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — hideOutOfRange + fixedRows", async () => {
    const { container } = renderDays({
      value: new Date(2024, 5, 15),
      minDate: new Date(2024, 5, 10),
      maxDate: new Date(2024, 5, 20),
      hideOutOfRange: true,
      fixedRows: true,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("no violations — currentMonthOnly", async () => {
    const { container } = renderDays({
      value: new Date(2024, 5, 15),
      currentMonthOnly: true,
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

// ─── ARIA roles ───────────────────────────────────────────────────────────────

describe("Calendar — live region", () => {
  it("mounts a polite status live region for selection announcements", async () => {
    const { Calendar } = await import("@/components/calendar/calendar");
    const { container } = render(
      <Calendar value={VIEW_DATE}>
        <CalendarDays />
      </Calendar>,
    );
    const live = container.querySelector('[role="status"]');
    expect(live).not.toBeNull();
    expect(live!.getAttribute("aria-live")).toBe("polite");
    expect(live!.getAttribute("aria-atomic")).toBe("true");
  });
});

describe("CalendarDays — ARIA roles", () => {
  it("grid role present", () => {
    const { getByRole } = renderDays();
    expect(getByRole("grid")).toBeInTheDocument();
  });

  it("grid has aria-label", () => {
    const { getByRole } = renderDays();
    const grid = getByRole("grid");
    expect(grid).toHaveAttribute("aria-label");
    expect(grid.getAttribute("aria-label")!.length).toBeGreaterThan(0);
  });

  it("row roles present (6 week rows + header row)", () => {
    const { getAllByRole } = renderDays();
    const rows = getAllByRole("row");
    expect(rows.length).toBeGreaterThanOrEqual(6);
  });

  it("columnheader roles present (7 weekday labels)", () => {
    const { getAllByRole } = renderDays();
    const headers = getAllByRole("columnheader");
    expect(headers).toHaveLength(7);
  });

  it("each columnheader has aria-label", () => {
    const { getAllByRole } = renderDays();
    getAllByRole("columnheader").forEach((h) => {
      expect(h).toHaveAttribute("aria-label");
    });
  });
});

// ─── Day cell ARIA ────────────────────────────────────────────────────────────

describe("CalendarDays — day cell ARIA", () => {
  it("selected cell has aria-selected=true", () => {
    const selected = new Date(2024, 5, 10);
    const { getByRole } = renderDays({ value: selected });
    const grid = getByRole("grid");
    const selectedCell = within(grid)
      .getAllByRole("gridcell")
      .find((el) => el.getAttribute("aria-selected") === "true");
    expect(selectedCell).toBeDefined();
  });

  it("non-selected cells do not have aria-selected=true", () => {
    const selected = new Date(2024, 5, 10);
    const { getByRole } = renderDays({ value: selected });
    const grid = getByRole("grid");
    const selectedCells = within(grid)
      .getAllByRole("gridcell")
      .filter((el) => el.getAttribute("aria-selected") === "true");
    expect(selectedCells).toHaveLength(1);
  });

  it("disabled cells have aria-disabled=true", () => {
    const { getByRole } = renderDays({
      value: new Date(2024, 5, 15),
      maxDate: new Date(2024, 5, 10), // everything after Jun 10 disabled
    });
    const grid = getByRole("grid");
    const disabledCells = within(grid)
      .getAllByRole("gridcell")
      .filter((el) => el.getAttribute("aria-disabled") === "true");
    expect(disabledCells.length).toBeGreaterThan(0);
  });

  it("disabled day buttons carry aria-disabled on the button element itself", () => {
    // Regression: aria-disabled was removed from <button> in 939ed13,
    // leaving it only on the parent <td>. CSS rules (cursor, line-through)
    // target the button directly, so they silently broke.
    const { getByRole } = renderDays({
      value: new Date(2024, 5, 15),
      maxDate: new Date(2024, 5, 10),
    });
    const grid = getByRole("grid");
    const disabledButtons = within(grid)
      .getAllByRole("button")
      .filter((btn) => btn.getAttribute("aria-disabled") === "true");
    expect(disabledButtons.length).toBeGreaterThan(0);
  });

  it("enabled cells do not have aria-disabled", () => {
    const { getByRole } = renderDays({ value: new Date(2024, 5, 5) });
    const grid = getByRole("grid");
    // with no min/maxDate, current month cells should not be disabled
    const enabledCells = within(grid)
      .getAllByRole("gridcell")
      .filter(
        (el) =>
          el.getAttribute("aria-disabled") !== "true" &&
          !el.hasAttribute("aria-disabled"),
      );
    expect(enabledCells.length).toBeGreaterThan(0);
  });

  it("each day cell button has aria-label", () => {
    const { container } = renderDays();
    // aria-label lives on the <button> inside each gridcell wrapper
    const buttons = container.querySelectorAll(
      '[role="gridcell"] button[aria-label]',
    );
    expect(buttons.length).toBeGreaterThan(20);
  });

  it("hidden out-of-range cells use role=presentation, not gridcell", () => {
    const { container } = renderDays({
      value: new Date(2024, 5, 15),
      minDate: new Date(2024, 5, 10),
      maxDate: new Date(2024, 5, 20),
      hideOutOfRange: true,
    });
    const presentations = container.querySelectorAll('[role="presentation"]');
    expect(presentations.length).toBeGreaterThan(0);
    // Confirm none of these placeholders also pose as gridcells.
    presentations.forEach((p) => {
      expect(p.getAttribute("role")).toBe("presentation");
      expect(p.getAttribute("aria-hidden")).toBeNull();
    });
  });

  it("today cell button has aria-current=date", () => {
    const today = new Date();
    const { container } = renderDays({ value: today });
    const todayBtn = container.querySelector(
      '[role="gridcell"] button[aria-current="date"]',
    );
    expect(todayBtn).not.toBeNull();
  });
});

// ─── Time picker ARIA ─────────────────────────────────────────────────────────

describe("Calendar time picker — ARIA", () => {
  it("time group has role=group and aria-label", () => {
    const { container } = render(
      <CalendarProvider value={new Date(2024, 5, 15)}>
        <div>
          <CalendarTimeGrid />
        </div>
      </CalendarProvider>,
    );
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group!.getAttribute("aria-label")).toBeTruthy();
  });

  it("no axe violations on time picker", async () => {
    const { container } = render(
      <CalendarProvider value={new Date(2024, 5, 15)}>
        <div>
          <CalendarTimeGrid />
        </div>
      </CalendarProvider>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
