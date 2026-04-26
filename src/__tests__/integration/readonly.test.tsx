import { describe, it, expect, vi } from "vitest";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarManualSelect } from "@/modules/manual-select";

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
});

describe("readOnly — ManualSelect", () => {
  it("input has readOnly attribute and onChange does not fire on Enter", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar onChange={onChange} readOnly>
        <CalendarManualSelect />
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
        <CalendarManualSelect />
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
        <CalendarManualSelect />
      </Calendar>,
    );
    const clearBtns = within(container).getAllByLabelText("Clear");
    const clearBtn = clearBtns[clearBtns.length - 1];
    expect(clearBtn).toBeDisabled();
    await userEvent.click(clearBtn);
    expect(onChange).not.toHaveBeenCalled();
  });
});
