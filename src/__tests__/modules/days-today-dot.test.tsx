import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CalendarProvider } from "@/core/provider";
import { CalendarDays } from "@/modules/days";

function renderDays(props: { todayDot?: boolean; value?: Date } = {}) {
  return render(
    <CalendarProvider value={props.value ?? new Date()} mode="single">
      <CalendarDays todayDot={props.todayDot} />
    </CalendarProvider>,
  );
}

describe("CalendarDays — todayDot prop", () => {
  it("sets data-today-dot on grid by default", () => {
    const { container } = renderDays();
    const grid = container.querySelector('[role="grid"]');
    expect(grid).not.toBeNull();
    expect(grid?.hasAttribute("data-today-dot")).toBe(true);
  });

  it("sets data-today-dot when explicitly true", () => {
    const { container } = renderDays({ todayDot: true });
    const grid = container.querySelector('[role="grid"]');
    expect(grid?.hasAttribute("data-today-dot")).toBe(true);
  });

  it("omits data-today-dot when false", () => {
    const { container } = renderDays({ todayDot: false });
    const grid = container.querySelector('[role="grid"]');
    expect(grid?.hasAttribute("data-today-dot")).toBe(false);
  });
});
