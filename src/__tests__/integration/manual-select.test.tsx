import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarManualSelect } from "@/modules/manual-select";

const findInput = (container: HTMLElement) =>
  container.querySelector("input") as HTMLInputElement;

describe("ManualSelect — single mode typing", () => {
  it("does not commit while user is typing — only on Enter", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="single" onChange={onChange}>
        <CalendarManualSelect />
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
        <CalendarManualSelect />
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
        <CalendarManualSelect />
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
        <CalendarManualSelect />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("05062024{Enter}");
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("ManualSelect — input mask format", () => {
  it("inserts dots automatically while typing", async () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarManualSelect />
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
        <CalendarManualSelect />
      </Calendar>,
    );
    const input = findInput(container);
    await userEvent.click(input);
    await userEvent.keyboard("1a5b");
    expect(input.value).toBe("15");
  });
});

describe("ManualSelect — multi mode cap", () => {
  it("hides the add-date input once selectedDates reaches maxDates", () => {
    const { container } = render(
      <Calendar
        mode="multiple"
        maxDates={2}
        value={[new Date(2024, 5, 1), new Date(2024, 5, 2)]}
      >
        <CalendarManualSelect />
      </Calendar>,
    );
    // 2 chips, no add-input
    const inputs = container.querySelectorAll("input");
    expect(inputs.length).toBe(0);
  });
});
