import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarPresets } from "@/modules/presets";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarTimeGrid } from "@/modules/time";
import { basicPresets } from "@/modules/presets/presets-pack";

const D = new Date(2024, 5, 15);

describe("readOnly — Nav clear", () => {
  it("clear button is disabled and does not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarNav clear />
      </Calendar>,
    );
    const btn = within(container).getByLabelText("Clear selection");
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("clear button is enabled when not readOnly", () => {
    const { container } = render(
      <Calendar value={D}>
        <CalendarNav clear />
      </Calendar>,
    );
    const btn = within(container).getByLabelText("Clear selection");
    expect(btn).not.toBeDisabled();
  });
});

describe("readOnly — SelectedDates clear", () => {
  it("clear button is disabled and does not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarSelectedDates />
      </Calendar>,
    );
    const btn = within(container).getByLabelText("Clear");
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("chip is rendered enabled under readOnly (chip click = navigation, allowed)", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarSelectedDates />
      </Calendar>,
    );
    const chip = Array.from(container.querySelectorAll("button")).find(
      (b) => b.getAttribute("aria-label") !== "Clear",
    ) as HTMLElement | undefined;
    expect(chip).toBeTruthy();
    expect(chip).not.toBeDisabled();
    await userEvent.click(chip!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("readOnly — ManualInput", () => {
  it("input has readOnly attribute and onChange does not fire on Enter", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar onChange={onChange} readOnly>
        <CalendarManualInput />
      </Calendar>,
    );
    const input = container.querySelector("input") as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.readOnly).toBe(true);
    await userEvent.click(input);
    await userEvent.keyboard("01.06.2024{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("chip with selected date does not enter edit mode on click", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarManualInput />
      </Calendar>,
    );
    const chip = container.querySelector("button[disabled]") as HTMLElement;
    expect(chip).toBeTruthy();
    await userEvent.click(chip);
    expect(container.querySelector("input")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("top-level clear button is disabled when readOnly", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarManualInput />
      </Calendar>,
    );
    const clearBtns = within(container).getAllByLabelText("Clear");
    const clearBtn = clearBtns[clearBtns.length - 1];
    expect(clearBtn).toBeDisabled();
    await userEvent.click(clearBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("readOnly — Presets", () => {
  it("preset buttons are disabled and do not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar onChange={onChange} readOnly>
        <CalendarPresets presets={basicPresets} />
      </Calendar>,
    );
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    for (const b of buttons) {
      expect(b).toBeDisabled();
    }
    await userEvent.click(buttons[0]);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("readOnly — DaysTrack multi confirm", () => {
  it("confirm button is disabled in multiselect mode", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="multiple" onChange={onChange} readOnly>
        <CalendarDaysTrack />
      </Calendar>,
    );
    const btn = container.querySelector(
      'button[aria-label="Save selected date"]',
    ) as HTMLElement | null;
    expect(btn).toBeTruthy();
    expect(btn).toBeDisabled();
    await userEvent.click(btn!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("readOnly — TimeGrid", () => {
  it("drum has aria-disabled and arrow keys do not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} onChange={onChange} readOnly>
        <CalendarTimeGrid />
      </Calendar>,
    );
    const drums = container.querySelectorAll('[role="spinbutton"]');
    expect(drums.length).toBeGreaterThan(0);
    for (const d of drums) {
      expect(d.getAttribute("aria-disabled")).toBe("true");
    }
    (drums[0] as HTMLElement).focus();
    await userEvent.keyboard("{ArrowUp}{ArrowDown}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("readOnly — Days", () => {
  it("day cells are aria-disabled and click does not fire onChange", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar value={D} defaultViewDate={D} onChange={onChange} readOnly>
        <CalendarDays />
      </Calendar>,
    );
    const grid = within(container).getByRole("grid");
    const cells = within(grid).getAllByRole("gridcell").filter(
      (c) => c.getAttribute("aria-hidden") !== "true",
    );
    expect(cells.length).toBeGreaterThan(0);
    for (const cell of cells) {
      expect(cell.getAttribute("aria-disabled")).toBe("true");
    }
    const firstBtn = cells[10].querySelector("button") as HTMLElement;
    await userEvent.click(firstBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
