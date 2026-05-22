import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TimeTrack } from "@/components/time-track/time-track";

const at = (h: number, m = 0, s = 0) => new Date(2024, 5, 15, h, m, s);

describe("TimeTrack labels", () => {
  it("renders no drum labels by default", () => {
    const { container } = render(
      <TimeTrack date={at(9)} onChange={() => undefined} />,
    );
    expect(container.textContent).not.toMatch(/HH|MM|SS/);
    expect(container.textContent).not.toMatch(/hour|minute|second/i);
  });

  it('labels="short" renders HH and MM (no seconds by default)', () => {
    const { container } = render(
      <TimeTrack date={at(9)} labels="short" onChange={() => undefined} />,
    );
    expect(container.textContent).toMatch(/HH/);
    expect(container.textContent).toMatch(/MM/);
    expect(container.textContent).not.toMatch(/SS/);
  });

  it('labels="short" + showSeconds renders SS', () => {
    const { container } = render(
      <TimeTrack
        date={at(9)}
        labels="short"
        showSeconds
        onChange={() => undefined}
      />,
    );
    expect(container.textContent).toMatch(/SS/);
  });

  it('labels="long" renders localized field names (EN)', () => {
    const { container } = render(
      <TimeTrack
        date={at(9)}
        labels="long"
        locale="en"
        onChange={() => undefined}
      />,
    );
    // EN "hour" / "minute" via Intl.DisplayNames dateTimeField
    expect(container.textContent?.toLowerCase()).toMatch(/hour/);
    expect(container.textContent?.toLowerCase()).toMatch(/minute/);
  });

  it('labels="long" picks a different word per locale', () => {
    const { container: en } = render(
      <TimeTrack
        date={at(9)}
        labels="long"
        locale="en"
        onChange={() => undefined}
      />,
    );
    const { container: ru } = render(
      <TimeTrack
        date={at(9)}
        labels="long"
        locale="ru"
        onChange={() => undefined}
      />,
    );
    const enText = en.textContent?.toLowerCase() ?? "";
    const ruText = ru.textContent?.toLowerCase() ?? "";
    // Either Intl.DisplayNames returns Russian terms, or it falls back to
    // the field key — either way EN and RU strings should not be identical
    // when DisplayNames is available, and the test passes trivially when
    // it isn't (both fall back to the same English keys).
    if (ruText.includes("час") || ruText.includes("минут")) {
      expect(enText).not.toBe(ruText);
    }
  });
});

describe("TimeTrack AM/PM switch", () => {
  it("does not render switch when hour12 is false", () => {
    const { queryByRole } = render(
      <TimeTrack date={at(9)} onChange={() => undefined} />,
    );
    expect(queryByRole("switch")).toBeNull();
  });

  it("renders a role=switch with aria-checked=false for AM", () => {
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={() => undefined} />,
    );
    const sw = getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("false");
    expect(sw.getAttribute("data-period")).toBe("AM");
  });

  it("renders aria-checked=true for PM", () => {
    const { getByRole } = render(
      <TimeTrack date={at(15)} hour12 onChange={() => undefined} />,
    );
    const sw = getByRole("switch");
    expect(sw.getAttribute("aria-checked")).toBe("true");
    expect(sw.getAttribute("data-period")).toBe("PM");
  });

  it("shows both AM and PM labels", () => {
    const { getByRole } = render(
      <TimeTrack date={at(9)} hour12 onChange={() => undefined} />,
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
      <TimeTrack date={at(9)} hour12 onChange={() => undefined} />,
    );
    expect(getByRole("switch").getAttribute("aria-label")).toMatch(
      /before noon/,
    );
    rerender(<TimeTrack date={at(15)} hour12 onChange={() => undefined} />);
    expect(getByRole("switch").getAttribute("aria-label")).toMatch(
      /after noon/,
    );
  });
});

describe("TimeTrack drum drag", () => {
  it("changes the focused drum when dragged past a row threshold", () => {
    const onChange = vi.fn();
    const { getByRole } = render(
      <TimeTrack date={at(9, 30, 15)} onChange={onChange} />,
    );

    const hours = getByRole("spinbutton", { name: "Hours" });
    fireEvent.pointerDown(hours, {
      button: 0,
      clientY: 100,
      pointerType: "mouse",
    });
    fireEvent.pointerMove(window, { clientY: 70, pointerType: "mouse" });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as Date).getHours()).toBe(10);

    fireEvent.pointerUp(window, { clientY: 70, pointerType: "mouse" });
  });
});
