import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";

describe("Nav popups — open/close via UI state", () => {
  it("clicking showTime button opens the time popup", async () => {
    const { container, queryByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <CalendarNav showTime />
      </Calendar>,
    );
    expect(queryByLabelText("Select time")).toBeNull();
    const btn = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLElement | null;
    expect(btn).toBeTruthy();
    await userEvent.click(btn!);
    expect(queryByLabelText("Select time")).not.toBeNull();
  });

  it("opening time popup does not affect selection state", async () => {
    let lastValue: unknown = "untouched";
    const { container } = render(
      <Calendar
        value={new Date(2024, 5, 15)}
        onChange={(v) => {
          lastValue = v;
        }}
      >
        <CalendarNav showTime />
      </Calendar>,
    );
    const btn = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLElement;
    await userEvent.click(btn);
    expect(lastValue).toBe("untouched");
  });
});
