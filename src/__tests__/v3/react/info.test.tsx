import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarInfo } from "@/modules-v3/info/CalendarInfo";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  mode: "single" | "multiple" | "range" | "multi-range" = "single",
  props: Parameters<typeof CalendarInfo>[0] = {},
  onChange?: (v: unknown) => void,
  configOver: Record<string, unknown> = {},
) {
  return render(
    <Calendar
      config={buildConfig({ mode, ...configOver })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarInfo {...props} />
    </Calendar>,
  );
}

const day = (key: string) =>
  document.querySelector(`[data-date="${key}"]`) as HTMLElement;

describe("CalendarInfo", () => {
  it("unmounts entirely when empty", () => {
    const { container } = setup("single", {});
    expect(container.querySelector("[data-dateforge-info]")).toBeNull();
  });

  it("shows emptyLabel when provided and no selection", () => {
    setup("single", { emptyLabel: "Pick a date" });
    expect(screen.getByText("Pick a date")).toBeTruthy();
  });

  it("shows single date summary after selection", async () => {
    const user = userEvent.setup();
    setup("single", {});
    await user.click(day("20260615"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/June 15, 2026/);
  });

  it("shows range day count after range selection", async () => {
    const user = userEvent.setup();
    setup("range", {});
    await user.click(day("20260601"));
    await user.click(day("20260607"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/7 days/);
  });

  it("localizes the range summary via Intl (ru-RU)", async () => {
    const user = userEvent.setup();
    setup("range", {}, undefined, { locale: "ru-RU" });
    await user.click(day("20260601"));
    await user.click(day("20260607"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/7 дней/);
  });

  it("multiple mode counts as localized unit-days (v2 behavior)", async () => {
    const user = userEvent.setup();
    setup("multiple", {});
    await user.click(day("20260601"));
    await user.click(day("20260602"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/2 days/);
  });

  it("multi-range summary goes through the label registry", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "multi-range" })}
        initialView={D(2026, 6, 1)}
        labels={{ infoRanges: "{count} диапазона" }}
      >
        <CalendarDays />
        <CalendarInfo />
      </Calendar>,
    );
    await user.click(day("20260601"));
    await user.click(day("20260603"));
    await user.click(day("20260610"));
    await user.click(day("20260612"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/2 диапазона/);
  });

  it("rangeStyle=duration formats day distance as a duration", async () => {
    const user = userEvent.setup();
    setup("range", { rangeStyle: "duration" });
    await user.click(day("20260601"));
    await user.click(day("20260607"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/6 days/);
  });

  it("rangeStyle=duration shows '1 day' for a single-day range (never '0 minutes')", async () => {
    const user = userEvent.setup();
    setup("range", { rangeStyle: "duration" });
    await user.click(day("20260605"));
    await user.click(day("20260605"));
    const status = document.querySelector("[role=status]");
    expect(status?.textContent).toMatch(/1 day/);
    expect(status?.textContent).not.toMatch(/minute/);
  });

  it("formatter receives the v3 public value", async () => {
    const user = userEvent.setup();
    const formatter = vi.fn((v: unknown) =>
      v instanceof Date ? `custom:${v.getDate()}` : "custom:?",
    );
    setup("single", { formatter });
    await user.click(day("20260615"));
    expect(screen.getByText("custom:15")).toBeTruthy();
    expect(formatter).toHaveBeenCalled();
  });

  it("showRelative renders a relative line next to the summary", async () => {
    const user = userEvent.setup();
    setup("single", { showRelative: true });
    await user.click(day("20260615"));
    const lines = document.querySelectorAll("[role=status] > div");
    expect(lines.length).toBe(2);
    expect(lines[1].textContent?.length).toBeGreaterThan(0);
  });

  it("prefix renders before the summary, hidden in empty state", async () => {
    const user = userEvent.setup();
    setup("single", { prefix: "→", emptyLabel: "none" });
    expect(screen.queryByText("→")).toBeNull();
    await user.click(day("20260615"));
    expect(screen.getByText("→")).toBeTruthy();
  });

  it("showSummary=false keeps actions but hides the text", async () => {
    const user = userEvent.setup();
    setup("single", { showSummary: false, allowClear: true });
    await user.click(day("20260615"));
    expect(
      document.querySelector("[data-dateforge-info] [role=status]"),
    ).toBeNull();
    expect(screen.getByLabelText("Clear")).toBeTruthy();
  });

  it("align maps to justify-content on the content group", () => {
    setup("single", { emptyLabel: "x", align: "right" });
    const group = document.querySelector("[role=status]") as HTMLElement;
    expect(group.style.justifyContent).toBe("flex-end");
  });

  it("allowClear shows clear button that clears selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup("single", { allowClear: true }, onChange);
    await user.click(day("20260605"));
    const clearBtn = screen.getByLabelText("Clear");
    await user.click(clearBtn);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.calls[1][0]).toBeNull();
  });

  // These two view March 2026: on the current month the home action is
  // disabled (correct), which would turn off roving/focus-restore.
  it("clear hands focus to the home action when it disappears", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 3, 1)}
      >
        <CalendarDays />
        <CalendarInfo allowClear showHome />
      </Calendar>,
    );
    await user.click(day("20260305"));
    await user.click(screen.getByLabelText("Clear"));
    expect(document.activeElement).toBe(
      screen.getByLabelText("Go to current month"),
    );
  });

  it("arrow keys rove between action buttons", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 3, 1)}
      >
        <CalendarDays />
        <CalendarInfo allowClear showHome />
      </Calendar>,
    );
    await user.click(day("20260305"));
    const home = screen.getByLabelText("Go to current month");
    const clear = screen.getByLabelText("Clear");
    home.focus();
    await user.keyboard("{ArrowRight}");
    expect(document.activeElement).toBe(clear);
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(home);
  });

  it("clearLabel / homeLabel override the registry labels", async () => {
    const user = userEvent.setup();
    setup("single", {
      allowClear: true,
      showHome: true,
      clearLabel: "Сброс",
      homeLabel: "Домой",
    });
    await user.click(day("20260605"));
    expect(screen.getByLabelText("Сброс")).toBeTruthy();
    expect(screen.getByLabelText("Домой")).toBeTruthy();
  });

  it("showHome renders home button", () => {
    setup("single", { showHome: true });
    expect(screen.getByLabelText("Go to current month")).toBeTruthy();
  });

  it("per-module theme renders data attrs on the container", () => {
    setup("single", { emptyLabel: "x", theme: "velvet", scheme: "dark" });
    const info = document.querySelector("[data-dateforge-info]");
    expect(info?.getAttribute("data-theme")).toBe("velvet");
    expect(info?.getAttribute("data-scheme")).toBe("dark");
  });

  it("status region has aria-live=polite only when text exists", async () => {
    const user = userEvent.setup();
    setup("single", { showHome: true });
    expect(
      document.querySelector("[data-dateforge-info] [role=status]"),
    ).toBeNull();
    await user.click(day("20260615"));
    const status = document.querySelector(
      "[data-dateforge-info] [role=status]",
    );
    expect(status?.getAttribute("aria-live")).toBe("polite");
  });
});
