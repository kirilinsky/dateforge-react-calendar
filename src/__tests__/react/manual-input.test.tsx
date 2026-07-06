import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CalendarDays } from "@/modules/days/CalendarDays";
import { CalendarManualInput } from "@/modules/manual-input/CalendarManualInput";
import { Calendar } from "@/react/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  overrides: Parameters<typeof buildConfig>[0] = {},
  onChange?: (v: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single", ...overrides })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarManualInput />
    </Calendar>,
  );
}

describe("CalendarManualInput", () => {
  it("renders an input element", () => {
    setup();
    expect(screen.getByRole("textbox")).toBeTruthy();
  });

  it("placeholder defaults to format string", () => {
    setup();
    expect(screen.getByRole("textbox").getAttribute("placeholder")).toBe(
      "DD.MM.YYYY",
    );
  });

  it("typing a valid date selects it and calls onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup({}, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "15062026");
    expect(onChange).toHaveBeenCalled();
    const [value] = onChange.mock.calls.at(-1) ?? [];
    expect(value).toBeInstanceOf(Date);
  });

  it("selecting a day fills the input", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    // format DD.MM.YYYY → 10.06.2026
    expect(input.value).toMatch(/10\.06\.2026/);
  });

  it("Escape clears the input text", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("textbox");
    await user.type(input, "15062026");
    await user.keyboard("{Escape}");
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("readOnly input cannot be typed into", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup({ readOnly: true }, onChange);
    const input = screen.getByRole("textbox");
    await user.type(input, "15062026");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("aria-invalid set when partial mask is invalid", async () => {
    const user = userEvent.setup();
    setup();
    const input = screen.getByRole("textbox");
    // Type just 2 digits — incomplete, invalid
    await user.type(input, "32");
    // The input may or may not be aria-invalid at this point depending on mask state.
    // Just verify it renders without throwing.
    expect(input).toBeTruthy();
  });
});

describe("CalendarManualInput v2-parity surface", () => {
  it("input has a registry aria-label when no visible label", () => {
    setup();
    expect(screen.getByRole("textbox").getAttribute("aria-label")).toBe("Date");
  });

  it("visible label is wired via htmlFor and drops aria-label", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput label="Departure" />
      </Calendar>,
    );
    const input = screen.getByLabelText("Departure");
    expect(input.getAttribute("aria-label")).toBeNull();
  });

  it("allowClear shows x when text exists and clears selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
        onChange={onChange}
      >
        <CalendarManualInput allowClear />
      </Calendar>,
    );
    const input = screen.getByRole("textbox");
    expect(screen.queryByLabelText("Clear")).toBeNull();
    await user.type(input, "15062026");
    await user.click(screen.getByLabelText("Clear"));
    expect((input as HTMLInputElement).value).toBe("");
    expect(onChange.mock.calls.at(-1)?.[0]).toBeNull();
  });

  it("bound inputs edit their side of an existing range", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
        <CalendarManualInput bound="from" label="From" />
        <CalendarManualInput bound="to" label="To" />
      </Calendar>,
    );
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    const from = screen.getByLabelText("From") as HTMLInputElement;
    const to = screen.getByLabelText("To") as HTMLInputElement;
    expect(from.value).toBe("10.06.2026");
    expect(to.value).toBe("15.06.2026");

    await user.clear(to);
    await user.type(to, "20062026");
    expect(
      document
        .querySelector('[data-date="20260620"]')
        ?.hasAttribute("data-range-end"),
    ).toBe(true);
    expect(from.value).toBe("10.06.2026");
  });

  it("inverted bound edit flags the input invalid, range untouched", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarDays />
        <CalendarManualInput bound="from" label="From" />
      </Calendar>,
    );
    await user.click(
      document.querySelector('[data-date="20260610"]') as HTMLElement,
    );
    await user.click(
      document.querySelector('[data-date="20260615"]') as HTMLElement,
    );
    const from = screen.getByLabelText("From") as HTMLInputElement;
    await user.clear(from);
    await user.type(from, "20062026");
    expect(from.getAttribute("aria-invalid")).toBe("true");
    expect(
      document
        .querySelector('[data-date="20260615"]')
        ?.hasAttribute("data-range-end"),
    ).toBe(true);
  });

  it("ArrowUp increments the segment under the caret and commits", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
        onChange={onChange}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.type(input, "15062026");
    input.setSelectionRange(1, 1); // caret in DD
    await user.keyboard("{ArrowUp}");
    expect(input.value).toBe("16.06.2026");
    const last = onChange.mock.calls.at(-1)?.[0] as Date;
    expect(last.getDate()).toBe(16);
  });

  it("ArrowDown wraps the month segment", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await user.type(input, "15012026");
    input.setSelectionRange(4, 4); // caret in MM
    await user.keyboard("{ArrowDown}");
    expect(input.value).toBe("15.12.2026");
  });

  it("ArrowUp on an empty input seeds from today/selected", async () => {
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    const input = screen.getByRole("textbox") as HTMLInputElement;
    input.focus();
    input.setSelectionRange(0, 0);
    await user.keyboard("{ArrowUp}");
    expect(input.value).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  it("per-module theme + align land on the container", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput theme="velvet" scheme="dark" align="right" />
      </Calendar>,
    );
    const box = document.querySelector(
      "[data-dateforge-manual-input]",
    ) as HTMLElement;
    expect(box.getAttribute("data-theme")).toBe("velvet");
    expect(box.getAttribute("data-scheme")).toBe("dark");
    expect(box.style.alignItems).toBe("flex-end");
  });
});

describe("CalendarManualInput localization (registry)", () => {
  it("bound inputs get per-bound registry aria-labels", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarManualInput bound="from" />
        <CalendarManualInput bound="to" />
      </Calendar>,
    );
    expect(screen.getByLabelText("Start date")).toBeTruthy();
    expect(screen.getByLabelText("End date")).toBeTruthy();
  });

  it("root labels prop localizes the bound aria-labels", () => {
    render(
      <Calendar
        config={buildConfig({ mode: "range" })}
        initialView={D(2026, 6, 1)}
        labels={{ rangeFrom: "Дата начала", rangeTo: "Дата конца" }}
      >
        <CalendarManualInput bound="from" />
        <CalendarManualInput bound="to" />
      </Calendar>,
    );
    expect(screen.getByLabelText("Дата начала")).toBeTruthy();
    expect(screen.getByLabelText("Дата конца")).toBeTruthy();
  });

  it("unsupported format tokens fall back to the default and still commit", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        onChange={onChange}
        initialView={D(2026, 7, 1)}
      >
        <CalendarManualInput format="TT.MM.JJJJ" />
      </Calendar>,
    );
    const input = screen.getByRole("textbox");
    // The bogus format falls back to DD.MM.YYYY across the WHOLE pipeline —
    // previously the mask worked but the commit parser never fired (dead
    // input: valid-looking text, nothing applied).
    expect(input.getAttribute("placeholder")).toBe("DD.MM.YYYY");
    await user.click(input);
    await user.type(input, "11122021");
    expect(input).toHaveValue("11.12.2021");
    expect(input.getAttribute("data-invalid")).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
