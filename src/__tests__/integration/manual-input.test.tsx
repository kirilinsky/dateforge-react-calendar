import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarManualInput } from "@/modules/manual-input";

const findInput = (container: HTMLElement) =>
  container.querySelector("input") as HTMLInputElement;

describe("ManualInput — single mode typing", () => {
  it("does not commit while user is typing — only on Enter", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" onChange={onChange}>
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("15062024");
    expect(onChange).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getFullYear()).toBe(2024);
    expect(last.getMonth()).toBe(5);
    expect(last.getDate()).toBe(15);
  });

  it("Enter on malformed date (32.13.2024) does not commit", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" onChange={onChange}>
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("32132024{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("Escape clears the input text without affecting selection", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" onChange={onChange}>
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("15062024");
    onChange.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(input.value).toBe("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not commit dates outside minDate", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="single"
        minDate={new Date(2024, 5, 10)}
        onChange={onChange}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("05062024{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ManualInput — input mask format", () => {
  it("inserts dots automatically while typing", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("1");
    expect(input.value).toBe("1");
    await userEvent.keyboard("5");
    expect(input.value).toBe("15");
    await userEvent.keyboard("0");
    expect(input.value).toBe("15.0");
    await userEvent.keyboard("6");
    expect(input.value).toBe("15.06");
    await userEvent.keyboard("2024");
    expect(input.value).toBe("15.06.2024");
  });

  it("ignores non-digit characters", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("1a5b");
    expect(input.value).toBe("15");
  });
});

describe("ManualInput — multi mode cap", () => {
  it("hides the add-date input once selectedDates reaches maxDates", () => {
    const { container } = render(
      <Calendar
        mode="multiple"
        maxDates={2}
        value={[new Date(2024, 5, 1), new Date(2024, 5, 2)]}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    // 2 chips, no add-input
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(0);
  });
});

describe("ManualInput — per-chip remove (multiple mode)", () => {
  it("renders × button per chip and removes only that date", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar
        mode="multiple"
        value={[new Date(2024, 5, 1), new Date(2024, 5, 2), new Date(2024, 5, 3)]}
        onChange={onChange}
      >
        <CalendarManualInput />
      </Calendar>,
    );
    const removeButtons = container.querySelectorAll('button[aria-label="Remove"]');
    expect(removeButtons.length).toBe(3);
    await userEvent.click(removeButtons[1] as HTMLElement);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Date[];
    expect(next.length).toBe(2);
    expect(next[0].getDate()).toBe(1);
    expect(next[1].getDate()).toBe(3);
  });

  it("× button does not enter edit mode", async () => {
    const { container } = render(
      <Calendar mode="multiple" value={[new Date(2024, 5, 1)]} onChange={() => {}}>
        <CalendarManualInput />
      </Calendar>,
    );
    const removeBtn = container.querySelector('button[aria-label="Remove"]') as HTMLElement;
    await userEvent.click(removeBtn);
    // No <input> should appear since the chip was removed, not opened for editing.
    expect(container.querySelectorAll("input").length).toBeLessThanOrEqual(1);
  });

  it("× button is disabled when readOnly", () => {
    const { container } = render(
      <Calendar mode="multiple" value={[new Date(2024, 5, 1)]} onChange={() => {}} readOnly>
        <CalendarManualInput />
      </Calendar>,
    );
    const removeBtn = container.querySelector('button[aria-label="Remove"]') as HTMLButtonElement;
    expect(removeBtn.disabled).toBe(true);
  });
});

describe("ManualInput — invalid feedback while typing", () => {
  it("flags day=32 as invalid before full date is typed", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("32");
    const wrapper = input.closest('[class*="inputWrapper"]') as HTMLElement;
    expect(wrapper.className).toMatch(/Invalid/);
  });

  it("flags month=13 as invalid before year is typed", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("0113");
    const wrapper = input.closest('[class*="inputWrapper"]') as HTMLElement;
    expect(wrapper.className).toMatch(/Invalid/);
  });

  it("flags Feb 31 as invalid (calendrical impossible)", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("31022024");
    const wrapper = input.closest('[class*="inputWrapper"]') as HTMLElement;
    expect(wrapper.className).toMatch(/Invalid/);
  });

  it("clears invalid state when user fixes the input", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualInput />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("32");
    let wrapper = input.closest('[class*="inputWrapper"]') as HTMLElement;
    expect(wrapper.className).toMatch(/Invalid/);
    await userEvent.keyboard("{Backspace}{Backspace}15");
    wrapper = input.closest('[class*="inputWrapper"]') as HTMLElement;
    expect(wrapper.className).not.toMatch(/Invalid/);
  });
});
