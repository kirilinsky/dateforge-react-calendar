import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarNav } from "@/modules/nav";

const D = new Date(2024, 5, 15, 9, 30, 0);

const findShowTimeButton = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('button[aria-label*="Change time"]');

const findNowTimeDisplay = (container: HTMLElement): HTMLElement | null =>
  container.querySelector('[aria-hidden="true"]');

describe("Nav — animateTime toggle", () => {
  it("animateTime=false renders showTime as plain text (single span)", () => {
    const { container } = render(
      <Calendar value={D}>
        <CalendarNav showTime animateTime={false} />
      </Calendar>,
    );
    const btn = findShowTimeButton(container);
    expect(btn).not.toBeNull();
    const innerSpans = btn!.querySelectorAll("span");
    expect(innerSpans).toHaveLength(1);
    expect(innerSpans[0].textContent).toMatch(/\d{2}:\d{2}/);
  });

  it("animateTime=true renders showTime as per-character drum spans", () => {
    const { container } = render(
      <Calendar value={D}>
        <CalendarNav showTime animateTime />
      </Calendar>,
    );
    const btn = findShowTimeButton(container);
    expect(btn).not.toBeNull();
    const innerSpans = btn!.querySelectorAll("span");
    // outer ticker span + ≥5 char slots (e.g. "09:30" → 5)
    expect(innerSpans.length).toBeGreaterThan(5);
  });

  it("animateTime=false applies to showNowTime as well (plain text)", () => {
    const { container } = render(
      <Calendar value={D}>
        <CalendarNav showNowTime animateTime={false} />
      </Calendar>,
    );
    const display = findNowTimeDisplay(container);
    expect(display).not.toBeNull();
    // dot span + single time span
    const directChildren = Array.from(display!.children);
    expect(directChildren.length).toBe(2);
    const timeSpan = directChildren[1];
    expect(timeSpan.children.length).toBe(0);
  });

  it("animateTime=true applies to showNowTime (per-character spans)", () => {
    const { container } = render(
      <Calendar value={D}>
        <CalendarNav showNowTime animateTime />
      </Calendar>,
    );
    const display = findNowTimeDisplay(container);
    expect(display).not.toBeNull();
    const directChildren = Array.from(display!.children);
    expect(directChildren.length).toBe(2);
    const timeSpan = directChildren[1];
    expect(timeSpan.children.length).toBeGreaterThan(0);
  });
});
