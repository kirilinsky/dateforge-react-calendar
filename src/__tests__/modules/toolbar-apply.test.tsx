import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";

import { TestToolbar } from "../helpers/test-toolbar";

const D = (y: number, m: number, d: number) => new Date(y, m - 1, d);
const FIXED = D(2024, 9, 15);

const getApplyBtn = () => screen.getByRole("button", { name: "Apply" });

describe("CalendarToolbarApply", () => {
  // ─── disabled state ────────────────────────────────────────────────────────

  it("is disabled when nothing is selected", () => {
    render(
      <Calendar>
        <TestToolbar apply />
        <CalendarDays />
      </Calendar>,
    );
    expect(getApplyBtn()).toBeDisabled();
  });

  it("is enabled once a date is selected", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <TestToolbar apply />
        <CalendarDays />
      </Calendar>,
    );
    expect(getApplyBtn()).not.toBeDisabled();
  });

  it("is disabled when readOnly even with a selection", () => {
    render(
      <Calendar value={FIXED} onChange={() => {}} readOnly>
        <TestToolbar apply />
        <CalendarDays />
      </Calendar>,
    );
    expect(getApplyBtn()).toBeDisabled();
  });

  // ─── onApply callback ─────────────────────────────────────────────────────

  it("fires onApply with Date in single mode", () => {
    const onApply = vi.fn();
    render(
      <Calendar value={FIXED} onChange={() => {}}>
        <TestToolbar apply onApply={onApply} />
        <CalendarDays />
      </Calendar>,
    );
    fireEvent.click(getApplyBtn());
    expect(onApply).toHaveBeenCalledOnce();
    const val = onApply.mock.calls[0][0] as Date;
    expect(val instanceof Date).toBe(true);
    expect(val.getFullYear()).toBe(2024);
    expect(val.getMonth()).toBe(8); // 0-indexed September
    expect(val.getDate()).toBe(15);
  });

  it("fires onApply with DateRange in range mode", () => {
    const onApply = vi.fn();
    const from = D(2024, 9, 10);
    const to = D(2024, 9, 20);
    render(
      <Calendar mode="range" value={{ from, to }} onChange={() => {}}>
        <TestToolbar apply onApply={onApply} />
        <CalendarDays />
      </Calendar>,
    );
    fireEvent.click(getApplyBtn());
    expect(onApply).toHaveBeenCalledOnce();
    const val = onApply.mock.calls[0][0] as { from: Date; to: Date };
    expect(val.from?.getDate()).toBe(10);
    expect(val.to?.getDate()).toBe(20);
  });

  it("fires onApply with Date[] in multiple mode", () => {
    const onApply = vi.fn();
    const dates = [D(2024, 9, 1), D(2024, 9, 5), D(2024, 9, 10)];
    render(
      <Calendar mode="multiple" value={dates} onChange={() => {}}>
        <TestToolbar apply onApply={onApply} />
        <CalendarDays />
      </Calendar>,
    );
    fireEvent.click(getApplyBtn());
    expect(onApply).toHaveBeenCalledOnce();
    const val = onApply.mock.calls[0][0] as Date[];
    expect(Array.isArray(val)).toBe(true);
    expect(val).toHaveLength(3);
    expect(val[0].getDate()).toBe(1);
  });

  it("does not fire onApply when disabled", () => {
    const onApply = vi.fn();
    render(
      <Calendar>
        <TestToolbar apply onApply={onApply} />
        <CalendarDays />
      </Calendar>,
    );
    fireEvent.click(getApplyBtn());
    expect(onApply).not.toHaveBeenCalled();
  });

  // ─── aria / label ─────────────────────────────────────────────────────────

  it("has aria-label=Apply by default", () => {
    render(
      <Calendar>
        <TestToolbar apply />
      </Calendar>,
    );
    expect(getApplyBtn()).toHaveAttribute("aria-label", "Apply");
  });

  it("uses custom applyLabel", () => {
    render(
      <Calendar>
        <TestToolbar apply applyLabel="Confirm" />
      </Calendar>,
    );
    expect(screen.getByRole("button", { name: "Confirm" })).toBeInTheDocument();
  });

  // ─── range: partial selection ─────────────────────────────────────────────

  it("is enabled when only rangeStart is set (partial range)", () => {
    const onApply = vi.fn();
    render(
      <Calendar
        mode="range"
        value={{ from: FIXED, to: null }}
        onChange={() => {}}
      >
        <TestToolbar apply onApply={onApply} />
        <CalendarDays />
      </Calendar>,
    );
    expect(getApplyBtn()).not.toBeDisabled();
    fireEvent.click(getApplyBtn());
    const val = onApply.mock.calls[0][0] as {
      from: Date | null;
      to: Date | null;
    };
    expect(val.from?.getDate()).toBe(15);
    expect(val.to).toBeNull();
  });
});
