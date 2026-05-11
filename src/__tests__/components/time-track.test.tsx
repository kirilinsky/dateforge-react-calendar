import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimeTrack } from "@/components/time-track/time-track";

const at = (h: number, m = 0, s = 0) => new Date(2024, 5, 15, h, m, s);

describe("TimeTrack AM/PM switch", () => {
  it("does not render switch when hour12 is false", () => {
    const { queryByRole } = render(
      <TimeTrack date={at(9)} onChange={() => {}} />,
    );
    expect(queryByRole("switch")).toBeNull();
  });

  it("renders a role=switch with aria-checked=false for AM", () => {
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={() => {}} />,
    );
    const sw = getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.getAttribute("data-period")).toBe("AM");
  });

  it("renders aria-checked=true for PM", () => {
    const { getByRole } = render(
      <TimeTrack date={at(15)} hour12 onChange={() => {}} />,
    );
    const sw = getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(sw.getAttribute("data-period")).toBe("PM");
  });

  it("shows both AM and PM labels", () => {
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={() => {}} />,
    );
    const sw = getByRole("switch");
    expect(sw.textContent).toMatch(/AM/);
    expect(sw.textContent).toMatch(/PM/);
  });

  it("toggles AM -> PM on click (shifts hours by +12)", async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(9, 30, 15)} hour12 onChange={onChange} />,
    );
    await userEvent.click(getByRole("switch"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Date;
    expect(next.getHours()).toBe(21);
    expect(next.getMinutes()).toBe(30);
    expect(next.getSeconds()).toBe(15);
  });

  it("toggles PM -> AM on click (shifts hours by -12)", async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(21, 30, 15)} hour12 onChange={onChange} />,
    );
    await userEvent.click(getByRole("switch"));
    const next = onChange.mock.calls[0][0] as Date;
    expect(next.getHours()).toBe(9);
    expect(next.getMinutes()).toBe(30);
    expect(next.getSeconds()).toBe(15);
  });

  it("toggles via keyboard Space", async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={onChange} />,
    );
    const sw = getByRole("switch") as HTMLButtonElement;
    sw.focus();
    await userEvent.keyboard(" ");
    expect(onChange).toHaveBeenCalled();
    expect((onChange.mock.calls.at(-1)![0] as Date).getHours()).toBe(21);
  });

  it("toggles via keyboard Enter", async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={onChange} />,
    );
    const sw = getByRole("switch") as HTMLButtonElement;
    sw.focus();
    await userEvent.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalled();
  });

  it("is disabled and does not emit when readOnly", async () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 readOnly onChange={onChange} />,
    );
    const sw = getByRole("switch") as HTMLButtonElement;
    expect(sw.disabled).toBe(true);
    await userEvent.click(sw);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("has an accessible name describing current period", () => {
    const { getByRole, rerender } = render(
      <TimeTrack date={at(9)} hour12 onChange={() => {}} />,
    );
    expect(getByRole("switch").getAttribute("aria-label")).toMatch(
      /before noon/,
    );
    rerender(<TimeTrack date={at(15)} hour12 onChange={() => {}} />);
    expect(getByRole("switch").getAttribute("aria-label")).toMatch(
      /after noon/,
    );
  });
});
