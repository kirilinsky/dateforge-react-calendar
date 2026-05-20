import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";

type StartViewTransition = (update: () => void) => {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};

const installStartViewTransition = () => {
  const startViewTransition = vi.fn<StartViewTransition>((update) => {
    update();
    return {
      finished: Promise.resolve(),
      ready: Promise.resolve(),
      updateCallbackDone: Promise.resolve(),
      skipTransition: vi.fn(),
    };
  });

  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: startViewTransition,
  });

  return startViewTransition;
};

afterEach(() => {
  Object.defineProperty(document, "startViewTransition", {
    configurable: true,
    value: undefined,
  });
});

describe("Calendar View Transitions", () => {
  it("does not call the browser API unless motion is opted in", async () => {
    const startViewTransition = installStartViewTransition();

    const { getByLabelText } = render(
      <Calendar defaultViewDate={new Date(2024, 5, 15)}>
        <CalendarNav showMonthPicker />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Next month"));

    expect(startViewTransition).not.toHaveBeenCalled();
  });

  it("wraps navigation updates when motion=view-transition", async () => {
    const startViewTransition = installStartViewTransition();

    const { getByLabelText } = render(
      <Calendar
        defaultViewDate={new Date(2024, 5, 15)}
        motion="view-transition"
      >
        <CalendarNav showMonthPicker />
        <CalendarDays />
      </Calendar>,
    );

    await userEvent.click(getByLabelText("Next month"));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });

  it("wraps popup open updates when motion=view-transition", async () => {
    const startViewTransition = installStartViewTransition();

    const { container, getByLabelText } = render(
      <Calendar
        defaultViewDate={new Date(2024, 5, 15)}
        motion="view-transition"
      >
        <CalendarNav showMonthPicker />
      </Calendar>,
    );

    await userEvent.click(getByLabelText(/Change month/));

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(
      container.querySelector('[role="dialog"][aria-label="Select month"]'),
    ).not.toBeNull();
  });
});
