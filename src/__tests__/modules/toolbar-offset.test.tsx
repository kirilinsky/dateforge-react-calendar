import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarToolbar } from "@/modules/toolbar";
import { CalendarToolbarMonthLabel } from "@/modules/toolbar/month-label";
import { CalendarToolbarMonthTrigger } from "@/modules/toolbar/month-trigger";
import { CalendarToolbarYearLabel } from "@/modules/toolbar/year-label";
import { CalendarToolbarYearTrigger } from "@/modules/toolbar/year-trigger";

const D = (y: number, m: number, d: number) => new Date(y, m - 1, d);

const SEP = D(2024, 9, 1); // September 2024
const DEC = D(2024, 12, 1); // December 2024 — year boundary
const JAN = D(2024, 1, 1); // January 2024 — negative year boundary

const wrap = (viewDate: Date, children: React.ReactNode) =>
  render(
    <Calendar value={viewDate} onChange={() => {}} locale="en">
      <CalendarToolbar>{children}</CalendarToolbar>
    </Calendar>,
  );

// MonthLabel renders srOnly "Current month, <name>" — unique per month, query that.
const monthSrOnly = (name: string) => `Current month, ${name}`;

// ─── CalendarToolbarMonthLabel ────────────────────────────────────────────────

describe("CalendarToolbarMonthLabel offset", () => {
  it("no offset shows current month", () => {
    wrap(SEP, <CalendarToolbarMonthLabel />);
    expect(screen.getByText(monthSrOnly("September"))).toBeInTheDocument();
  });

  it("offset=1 shows next month", () => {
    wrap(SEP, <CalendarToolbarMonthLabel offset={1} />);
    expect(screen.getByText(monthSrOnly("October"))).toBeInTheDocument();
  });

  it("offset=-1 shows previous month", () => {
    wrap(SEP, <CalendarToolbarMonthLabel offset={-1} />);
    expect(screen.getByText(monthSrOnly("August"))).toBeInTheDocument();
  });

  it("offset=1 wraps to January at year boundary", () => {
    wrap(DEC, <CalendarToolbarMonthLabel offset={1} />);
    expect(screen.getByText(monthSrOnly("January"))).toBeInTheDocument();
  });

  it("offset=-1 wraps to December at year boundary", () => {
    wrap(JAN, <CalendarToolbarMonthLabel offset={-1} />);
    expect(screen.getByText(monthSrOnly("December"))).toBeInTheDocument();
  });

  it("does not stack with parent toolbar offset", () => {
    render(
      <Calendar value={SEP} onChange={() => {}} locale="en">
        <CalendarToolbar offset={1}>
          {/* toolbar shows October, but component offset=2 uses baseDate(Sep)+2=November */}
          <CalendarToolbarMonthLabel offset={2} />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(screen.getByText(monthSrOnly("November"))).toBeInTheDocument();
  });
});

// ─── CalendarToolbarYearLabel ─────────────────────────────────────────────────

describe("CalendarToolbarYearLabel offset", () => {
  it("no offset shows current year", () => {
    wrap(SEP, <CalendarToolbarYearLabel />);
    // srOnly = "Current year, 2024", visible = "2024" — use exact srOnly
    expect(screen.getByText("Current year, 2024")).toBeInTheDocument();
  });

  it("offset=1 stays same year within year", () => {
    wrap(SEP, <CalendarToolbarYearLabel offset={1} />);
    expect(screen.getByText("Current year, 2024")).toBeInTheDocument();
  });

  it("offset=1 advances year at December boundary", () => {
    wrap(DEC, <CalendarToolbarYearLabel offset={1} />);
    expect(screen.getByText("Current year, 2025")).toBeInTheDocument();
  });

  it("offset=-1 goes back a year at January boundary", () => {
    wrap(JAN, <CalendarToolbarYearLabel offset={-1} />);
    expect(screen.getByText("Current year, 2023")).toBeInTheDocument();
  });

  it("does not stack with parent toolbar offset", () => {
    render(
      <Calendar value={DEC} onChange={() => {}} locale="en">
        <CalendarToolbar offset={1}>
          {/* toolbar shows Jan 2025, but component offset=2 uses baseDate(Dec)+2=Feb 2025 */}
          <CalendarToolbarYearLabel offset={2} />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(screen.getByText("Current year, 2025")).toBeInTheDocument();
  });
});

// ─── CalendarToolbarMonthTrigger ──────────────────────────────────────────────

describe("CalendarToolbarMonthTrigger offset", () => {
  it("no offset shows current month in button aria-label", () => {
    wrap(SEP, <CalendarToolbarMonthTrigger />);
    expect(
      screen.getByRole("button", { name: /September/i }),
    ).toBeInTheDocument();
  });

  it("offset=1 shows next month in button aria-label", () => {
    wrap(SEP, <CalendarToolbarMonthTrigger offset={1} />);
    expect(
      screen.getByRole("button", { name: /October/i }),
    ).toBeInTheDocument();
  });

  it("offset=-1 shows previous month in button aria-label", () => {
    wrap(SEP, <CalendarToolbarMonthTrigger offset={-1} />);
    expect(screen.getByRole("button", { name: /August/i })).toBeInTheDocument();
  });

  it("offset=1 wraps to January at year boundary", () => {
    wrap(DEC, <CalendarToolbarMonthTrigger offset={1} />);
    expect(
      screen.getByRole("button", { name: /January/i }),
    ).toBeInTheDocument();
  });

  it("does not stack with parent toolbar offset", () => {
    render(
      <Calendar value={SEP} onChange={() => {}} locale="en">
        <CalendarToolbar offset={1}>
          <CalendarToolbarMonthTrigger offset={2} />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(
      screen.getByRole("button", { name: /November/i }),
    ).toBeInTheDocument();
  });
});

// ─── CalendarToolbarYearTrigger ───────────────────────────────────────────────

describe("CalendarToolbarYearTrigger offset", () => {
  it("no offset shows current year in button aria-label", () => {
    wrap(SEP, <CalendarToolbarYearTrigger />);
    expect(screen.getByRole("button", { name: /2024/ })).toBeInTheDocument();
  });

  it("offset=1 stays same year within year", () => {
    wrap(SEP, <CalendarToolbarYearTrigger offset={1} />);
    expect(screen.getByRole("button", { name: /2024/ })).toBeInTheDocument();
  });

  it("offset=1 advances year at December boundary", () => {
    wrap(DEC, <CalendarToolbarYearTrigger offset={1} />);
    expect(screen.getByRole("button", { name: /2025/ })).toBeInTheDocument();
  });

  it("offset=-1 goes back a year at January boundary", () => {
    wrap(JAN, <CalendarToolbarYearTrigger offset={-1} />);
    expect(screen.getByRole("button", { name: /2023/ })).toBeInTheDocument();
  });

  it("does not stack with parent toolbar offset", () => {
    render(
      <Calendar value={DEC} onChange={() => {}} locale="en">
        <CalendarToolbar offset={1}>
          {/* toolbar shows Jan 2025, but component offset=2 uses baseDate(Dec)+2=Feb 2025 */}
          <CalendarToolbarYearTrigger offset={2} />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(screen.getByRole("button", { name: /2025/ })).toBeInTheDocument();
  });
});
