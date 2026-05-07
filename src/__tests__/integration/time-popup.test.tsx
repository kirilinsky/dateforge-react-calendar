import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";

const openTimePopup = async (container: HTMLElement) => {
  const btn = container.querySelector(
    'button[aria-expanded="false"]',
  ) as HTMLElement;
  await userEvent.click(btn);
};

describe("TimePopup confirm/close handlers", () => {
  it("editing time inside the popup and confirming commits the new time", async () => {
    const onChange = vi.fn();
    const { container, getByLabelText } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 5, 15, 10, 0, 0)}
        onChange={onChange}
      >
        <CalendarNav showTime />
      </Calendar>,
    );
    await openTimePopup(container);

    const minute = getByLabelText("Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });

    expect(onChange).not.toHaveBeenCalled();

    const confirmBtn = getByLabelText("Confirm");
    await userEvent.click(confirmBtn);

    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0] as Date;
    expect(last.getMinutes()).toBe(1);
  });

  it("closing the popup via backdrop discards pending edits", async () => {
    const onChange = vi.fn();
    const { container, getByLabelText } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 5, 15, 10, 0, 0)}
        onChange={onChange}
      >
        <CalendarNav showTime />
      </Calendar>,
    );
    await openTimePopup(container);

    const minute = getByLabelText("Minutes");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });

    const closeBtn = container.querySelector(
      '[aria-label="Close"]',
    ) as HTMLElement;
    await userEvent.click(closeBtn);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("respects timeStep config when set on Calendar (popup minute=15)", async () => {
    const onChange = vi.fn();
    const { container, getByLabelText } = render(
      <Calendar
        mode="single"
        value={new Date(2024, 5, 15, 10, 0, 0)}
        onChange={onChange}
        timeStep={{ minute: 15 }}
      >
        <CalendarNav showTime />
      </Calendar>,
    );
    await openTimePopup(container);

    const minute = getByLabelText("Minutes");
    expect(minute.getAttribute("aria-valuemax")).toBe("45");
    minute.focus();
    fireEvent.keyDown(minute, { key: "ArrowDown" });
    const confirmBtn = getByLabelText("Confirm");
    await userEvent.click(confirmBtn);
    expect((onChange.mock.calls.at(-1)![0] as Date).getMinutes()).toBe(15);
  });
});
