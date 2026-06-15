import { fireEvent, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { calendarDate } from "@/core-v3/calendar-date";
import { MIDNIGHT } from "@/core-v3/calendar-time";
import { compileDateRules } from "@/core-v3/date-rule-engine";
import type { AnyCalendarValue } from "@/core-v3/public-value";
import type { SelectionMode, SelectionUnit } from "@/core-v3/selection-types";
import type { CalendarConfig } from "@/core-v3/state";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarProvider } from "@/react-v3/provider";

const D = (y: number, m: number, d: number) => calendarDate(y, m, d);

function config(
  unit: SelectionUnit,
  mode: SelectionMode,
  over: Partial<CalendarConfig> = {},
): CalendarConfig {
  return {
    unit,
    mode,
    firstDayOfWeek: 1,
    readOnly: false,
    withTime: false,
    defaultTime: MIDNIGHT,
    excludedEndpointPolicy: "snap-inward",
    disabled: compileDateRules(),
    exclude: compileDateRules(),
    ...over,
  };
}

function setup(
  cfg: CalendarConfig,
  props: { onChange?: (v: AnyCalendarValue) => void } = {},
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CalendarProvider config={cfg} initialView={D(2026, 6, 1)} {...props}>
      {children}
    </CalendarProvider>
  );
  return render(<CalendarDays />, { wrapper });
}

/** Find the gridcell button for a day-of-month within the displayed month. */
function dayButton(container: HTMLElement, day: number) {
  const cells = within(container).getAllByRole("gridcell");
  return cells.find(
    (c) =>
      c.textContent === String(day) && c.getAttribute("data-outside") === null,
  ) as HTMLButtonElement;
}

describe("CalendarDays", () => {
  it("renders a fixed 6-week grid (42 cells) plus weekday headers", () => {
    const { container } = setup(config("day", "single"));
    expect(within(container).getAllByRole("gridcell")).toHaveLength(42);
    expect(within(container).getAllByRole("columnheader")).toHaveLength(7);
  });

  it("merges an adjacent weekend into one strip (Monday-start)", () => {
    // Order Mon..Sun → Sat col 5, Sun col 6: one strip from col 5 spanning 2,
    // no second strip — so no rounded notch between Sat and Sun.
    const { container } = setup(config("day", "single", { firstDayOfWeek: 1 }));
    const grid = within(container).getByRole("grid");
    expect(grid.style.getPropertyValue("--wknd-a-start")).toBe("5");
    expect(grid.style.getPropertyValue("--wknd-a-span")).toBe("2");
    expect(grid.style.getPropertyValue("--wknd-b-span")).toBe("0");
  });

  it("splits the weekend into two strips on a Sunday-start week", () => {
    // Order Sun..Sat → Sun col 0, Sat col 6 (non-adjacent): two 1-col strips.
    const { container } = setup(config("day", "single", { firstDayOfWeek: 0 }));
    const grid = within(container).getByRole("grid");
    expect(grid.style.getPropertyValue("--wknd-a-start")).toBe("0");
    expect(grid.style.getPropertyValue("--wknd-a-span")).toBe("1");
    expect(grid.style.getPropertyValue("--wknd-b-start")).toBe("6");
    expect(grid.style.getPropertyValue("--wknd-b-span")).toBe("1");
  });

  it("tints the weekend weekday headers by default", () => {
    const { container } = setup(config("day", "single", { firstDayOfWeek: 1 }));
    const grid = within(container).getByRole("grid");
    expect(grid.getAttribute("data-weekend-headers")).toBe("");
    const tinted = within(container)
      .getAllByRole("columnheader")
      .filter((h) => h.getAttribute("data-weekend") === "");
    expect(tinted).toHaveLength(2); // Sat + Sun
  });

  it("weekendHeaders={false} drops the header tint flag", () => {
    const { container } = render(
      <CalendarProvider
        config={config("day", "single")}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays weekendHeaders={false} />
      </CalendarProvider>,
    );
    expect(
      within(container).getByRole("grid").getAttribute("data-weekend-headers"),
    ).toBeNull();
  });

  it("honors a custom weekendDays config (Fri/Sat)", () => {
    // Monday-start order Mon..Sun: Fri col 4, Sat col 5 → one strip from col 4.
    const { container } = setup(
      config("day", "single", { firstDayOfWeek: 1, weekendDays: [5, 6] }),
    );
    const grid = within(container).getByRole("grid");
    expect(grid.style.getPropertyValue("--wknd-a-start")).toBe("4");
    expect(grid.style.getPropertyValue("--wknd-a-span")).toBe("2");
    // June 2026: the 5th is a Friday → tagged weekend; the 7th (Sunday) is not.
    expect(dayButton(container, 5).getAttribute("data-weekend")).toBe("");
    expect(dayButton(container, 7).getAttribute("data-weekend")).toBeNull();
  });

  it("selects a day on click and emits the value", () => {
    const onChange = vi.fn();
    const { container } = setup(config("day", "single"), { onChange });
    fireEvent.click(dayButton(container, 5));
    expect(onChange).toHaveBeenCalledTimes(1);
    const v = onChange.mock.calls[0][0] as Date;
    expect(v.getTime()).toBe(new Date(2026, 5, 5).getTime());
  });

  it("marks the selected day with data-selected", () => {
    const { container } = setup(config("day", "single"));
    const cell = dayButton(container, 5);
    fireEvent.click(cell);
    expect(cell.getAttribute("data-selected")).toBe("");
  });

  it("flags disabled days and out-of-month cells", () => {
    const { container } = setup(
      config("day", "single", {
        disabled: compileDateRules({ dates: [D(2026, 6, 10)] }),
      }),
    );
    expect(dayButton(container, 10).getAttribute("data-disabled")).toBe("");
    // Leading cells belong to May -> at least one out-of-month cell exists.
    const outside = within(container)
      .getAllByRole("gridcell")
      .filter((c) => c.getAttribute("data-outside") === "");
    expect(outside.length).toBeGreaterThan(0);
  });

  it("draws a range across two clicks with start/end edges", () => {
    const { container } = setup(config("day", "range"));
    fireEvent.click(dayButton(container, 5));
    fireEvent.click(dayButton(container, 9));
    expect(dayButton(container, 5).getAttribute("data-range-start")).toBe("");
    expect(dayButton(container, 9).getAttribute("data-range-end")).toBe("");
    expect(dayButton(container, 7).getAttribute("data-in-range")).toBe("");
  });
});

describe("CalendarDays accessible names (Intl)", () => {
  it("day cells carry a full localized date aria-label", () => {
    render(
      <CalendarProvider
        config={config("day", "single", { locale: "en-US" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </CalendarProvider>,
    );
    const cell = document.querySelector('[data-date="20260615"]');
    expect(cell?.getAttribute("aria-label")).toMatch(/June 15, 2026/);
    expect(cell?.getAttribute("aria-label")).toMatch(/Monday/);
  });

  it("grid is named by the viewed month/year, localized", () => {
    render(
      <CalendarProvider
        config={config("day", "single", { locale: "ru-RU" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </CalendarProvider>,
    );
    const grid = document.querySelector("[role=grid]");
    expect(grid?.getAttribute("aria-label")).toMatch(/июнь 2026/i);
  });
});

describe("range drafting visuals", () => {
  it("the armed anchor renders as a selected day (visible range start)", () => {
    render(
      <CalendarProvider
        config={config("day", "range")}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </CalendarProvider>,
    );
    const cell = document.querySelector(
      '[data-date="20260610"]',
    ) as HTMLElement;
    fireEvent.click(cell);
    expect(cell.hasAttribute("data-selected")).toBe(true);
  });

  it("clicking a day over a complete range clears the band immediately", () => {
    render(
      <CalendarProvider
        config={config("day", "range")}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </CalendarProvider>,
    );
    fireEvent.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    fireEvent.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    expect(document.querySelectorAll("[data-in-range]").length).toBe(6);

    fireEvent.click(
      document.querySelector('[data-date="20260620"]') as HTMLElement,
    );
    expect(document.querySelectorAll("[data-in-range]").length).toBe(0);
    expect(
      document
        .querySelector('[data-date="20260620"]')
        ?.hasAttribute("data-selected"),
    ).toBe(true);
  });
});

describe("CalendarDays props (v2-parity surface)", () => {
  const mount = (props: Record<string, unknown> = {}, cfg = {}) =>
    render(
      <CalendarProvider
        config={config("day", "single", cfg)}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays {...props} />
      </CalendarProvider>,
    );

  it("today: dot on by default, outline off by default; both removable", () => {
    const { container, unmount } = mount();
    const grid = container.querySelector("[data-dateforge-days]");
    expect(grid?.hasAttribute("data-today-dot")).toBe(true);
    expect(grid?.hasAttribute("data-today-outline")).toBe(false);
    unmount();
    const { container: c2 } = mount({ highlightToday: true });
    const g2 = c2.querySelector("[data-dateforge-days]");
    expect(g2?.hasAttribute("data-today-outline")).toBe(true);
    const { container: c3 } = mount({ todayDot: false });
    const g3 = c3.querySelector("[data-dateforge-days]");
    expect(g3?.hasAttribute("data-today-dot")).toBe(false);
  });

  it("weekNumbers renders ISO rowheaders (June 2026 starts week 23)", () => {
    const { container } = mount({ weekNumbers: true });
    const headers = container.querySelectorAll("[role=rowheader]");
    expect(headers.length).toBeGreaterThanOrEqual(5);
    expect(headers[0].textContent).toBe("23");
  });

  it("hideWeekdays drops the header row", () => {
    const { container } = mount({ hideWeekdays: true });
    expect(container.querySelector("[data-weekdays]")).toBeNull();
  });

  it("weekdayFormat narrow + long aria on columnheaders", () => {
    const { container } = mount({ weekdayFormat: "narrow" });
    const head = container.querySelector("[role=columnheader]");
    expect(head?.textContent?.length).toBe(1);
    expect(head?.getAttribute("aria-label")).toMatch(/day$/);
  });

  it("showOutsideDays=false renders inert placeholders", () => {
    const { container } = mount({ showOutsideDays: false });
    expect(container.querySelector('[data-date="20260531"]')).toBeNull();
    const placeholders = container.querySelectorAll(
      "[aria-hidden][role=gridcell]",
    );
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it("fixedWeeks=false shrinks June 2026 to 5 week rows", () => {
    const { container } = mount({ fixedWeeks: false });
    // 1 weekday row + 5 week rows
    expect(container.querySelectorAll("[role=row]").length).toBe(6);
  });

  it("boldWeekends / highlightWeekends toggle grid attrs", () => {
    const { container } = mount({
      boldWeekends: true,
      highlightWeekends: false,
    });
    const grid = container.querySelector("[data-dateforge-days]");
    expect(grid?.hasAttribute("data-bold-weekends")).toBe(true);
    expect(grid?.hasAttribute("data-weekend-tint")).toBe(false);
  });

  it("weekend background tint is opt-in (default off, on via highlightWeekends)", () => {
    const off = mount({});
    expect(
      off.container
        .querySelector("[data-dateforge-days]")
        ?.hasAttribute("data-weekend-tint"),
    ).toBe(false);
    const on = mount({ highlightWeekends: true });
    expect(
      on.container
        .querySelector("[data-dateforge-days]")
        ?.hasAttribute("data-weekend-tint"),
    ).toBe(true);
  });

  it("renderDay replaces content, shell attrs stay ours", () => {
    // Fixed past view (2020) so no cell is ever "today" — keeps the assertion
    // date-independent regardless of when the suite runs.
    const { container } = render(
      <CalendarProvider
        config={config("day", "single")}
        initialView={D(2020, 6, 1)}
      >
        <CalendarDays
          renderDay={(d: { day: number }, s: { today: boolean }) =>
            `${d.day}${s.today ? "!" : ""}*`
          }
        />
      </CalendarProvider>,
    );
    const cell = container.querySelector('[data-date="20200615"]');
    expect(cell?.textContent).toBe("15*");
    expect(cell?.getAttribute("role")).toBe("gridcell");
    expect(cell?.getAttribute("aria-label")).toMatch(/June 15, 2020/);
  });

  it("renderDay turns the today dot off unless explicitly re-enabled", () => {
    const render = (d: { day: number }) => String(d.day);
    const { container, unmount } = mount({ renderDay: render });
    expect(
      container
        .querySelector("[data-dateforge-days]")
        ?.hasAttribute("data-today-dot"),
    ).toBe(false);
    unmount();
    const { container: c2 } = mount({ renderDay: render, todayDot: true });
    expect(
      c2.querySelector("[data-dateforge-days]")?.hasAttribute("data-today-dot"),
    ).toBe(true);
  });

  it("offset grid shows the next month and does not steal view on select", () => {
    const { container } = mount({ offset: 1 });
    const grid = container.querySelector("[role=grid]");
    expect(grid?.getAttribute("aria-label")).toMatch(/July 2026/);
    fireEvent.click(
      container.querySelector('[data-date="20260715"]') as HTMLElement,
    );
    //

    expect(grid?.getAttribute("aria-label")).toMatch(/July 2026/);
  });

  it("per-module theme + col land on the grid", () => {
    const { container } = mount({ theme: "velvet", scheme: "dark", col: 2 });
    const grid = container.querySelector(
      "[data-dateforge-days]",
    ) as HTMLElement;
    expect(grid.getAttribute("data-theme")).toBe("velvet");
    expect(grid.style.gridColumn).toBe("span 2");
  });
});

describe("deselectOnReclick=false in multiple mode (core)", () => {
  it("re-click keeps the date selected", () => {
    render(
      <CalendarProvider
        config={config("day", "multiple", { deselectOnReclick: false })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
      </CalendarProvider>,
    );
    const cell = document.querySelector(
      '[data-date="20260610"]',
    ) as HTMLElement;
    fireEvent.click(cell);
    fireEvent.click(cell);
    expect(cell.hasAttribute("data-selected")).toBe(true);
  });
});
