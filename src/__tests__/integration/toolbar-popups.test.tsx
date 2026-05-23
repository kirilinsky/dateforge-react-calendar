import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { TestToolbar } from "../helpers/test-toolbar";

describe("Toolbar popups — open/close via local toolbar state", () => {
  it("renders toolbar shell for picker controls", () => {
    const { container } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showMonthPicker showYearPicker />
      </Calendar>,
    );
    expect(container.querySelector('[data-area="toolbar"]')).toBeTruthy();
    expect(container.querySelectorAll("button").length).toBeGreaterThan(0);
  });

  it("clicking showTime button opens the time popup", async () => {
    const { container, queryByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showTime />
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

  it("clicking the month label (showMonthPicker) opens the month popup", async () => {
    const { container, queryByLabelText, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showMonthPicker />
      </Calendar>,
    );
    expect(queryByLabelText("Select month")).toBeNull();
    const labelBtn = getByLabelText(/Change month/);
    await userEvent.click(labelBtn);
    expect(
      container.querySelector('[aria-label="Select month"]'),
    ).not.toBeNull();
  });

  it("clicking the year label (showYearPicker) opens the year popup", async () => {
    const { container, getByLabelText, queryByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar showYearPicker />
      </Calendar>,
    );
    expect(queryByLabelText("Select year")).toBeNull();
    const labelBtn = getByLabelText(/Change year/);
    await userEvent.click(labelBtn);
    expect(
      container.querySelector('[aria-label="Select year"]'),
    ).not.toBeNull();
  });

  it("compactTime icon button opens the time popup", async () => {
    const { queryByLabelText, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar compactTime />
      </Calendar>,
    );
    expect(queryByLabelText("Select time")).toBeNull();
    const btn = getByLabelText(/Change time/);
    await userEvent.click(btn);
    expect(queryByLabelText("Select time")).not.toBeNull();
  });

  it("compact time renders only the icon button", () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar compactTime />
      </Calendar>,
    );
    expect(getByLabelText(/Change time/)).toBeTruthy();
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("compactTime button shows current time in its aria-label", () => {
    const { getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15, 14, 30)}>
        <TestToolbar compactTime />
      </Calendar>,
    );
    const btn = getByLabelText(/Change time, currently/);
    expect(btn.getAttribute("aria-label")).toMatch(/\d/);
  });

  it("compactMonths button opens the same month popup", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)}>
        <TestToolbar compactMonths />
      </Calendar>,
    );
    const btn = getByLabelText(/Change month/);
    await userEvent.click(btn);
    expect(
      container.querySelector('[aria-label="Select month"]'),
    ).not.toBeNull();
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
        <TestToolbar showTime />
      </Calendar>,
    );
    const btn = container.querySelector(
      'button[aria-expanded="false"]',
    ) as HTMLElement;
    await userEvent.click(btn);
    expect(lastValue).toBe("untouched");
  });

  it("does not render a duplicate popup from an offset toolbar", async () => {
    const { container, getByLabelText } = render(
      <Calendar value={new Date(2024, 5, 15)} cols={4}>
        <TestToolbar showMonthPicker yearLabel col={2} />
        <TestToolbar monthLabel yearLabel offset={1} col={2} />
      </Calendar>,
    );

    await userEvent.click(getByLabelText(/Change month/));

    expect(
      container.querySelectorAll('[role="dialog"][aria-label="Select month"]'),
    ).toHaveLength(1);
  });
});
