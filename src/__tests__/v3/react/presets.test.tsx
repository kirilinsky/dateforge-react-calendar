import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  commonPresets,
  presetLast7Days,
  presetThisWeek,
  presetToday,
} from "@/core-v3/preset-engine";
import { CalendarDays } from "@/modules-v3/days/CalendarDays";
import { CalendarPresets } from "@/modules-v3/presets/CalendarPresets";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function setup(
  presets = commonPresets,
  overrides: Parameters<typeof buildConfig>[0] = {},
  onChange?: (v: unknown, d: unknown) => void,
) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single", ...overrides })}
      initialView={D(2026, 6, 1)}
      onChange={onChange}
    >
      <CalendarDays />
      <CalendarPresets presets={presets} />
    </Calendar>,
  );
}

describe("CalendarPresets", () => {
  it("renders all preset buttons", () => {
    setup();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByText("This week")).toBeTruthy();
  });

  it("does not render when presets array is empty", () => {
    const { container } = setup([]);
    expect(container.querySelector("[data-dateforge-presets]")).toBeNull();
  });

  it("applies a per-module theme/scheme override on the container", () => {
    const { container } = render(
      <Calendar
        config={buildConfig({ mode: "single" })}
        initialView={D(2026, 6, 1)}
      >
        <CalendarPresets
          presets={commonPresets}
          theme="espresso"
          scheme="dark"
        />
      </Calendar>,
    );
    const root = container.querySelector("[data-dateforge-presets]");
    expect(root?.getAttribute("data-theme")).toBe("espresso");
    expect(root?.getAttribute("data-scheme")).toBe("dark");
  });

  it("clicking preset commits selection and calls onChange", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup([presetToday], {}, onChange);
    await user.click(screen.getByText("Today"));
    expect(onChange).toHaveBeenCalledOnce();
    const [value, details] = onChange.mock.calls[0];
    expect(value).toBeInstanceOf(Date);
    expect(details.reason).toBe("preset");
  });

  it("active preset gets data-active attribute", async () => {
    const user = userEvent.setup();
    setup([presetToday]);
    const btn = screen.getByText("Today");
    await user.click(btn);
    expect(btn.dataset.active).toBe("");
  });

  it("clicking active preset clears selection", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    setup([presetToday], {}, onChange);
    const btn = screen.getByText("Today");
    await user.click(btn);
    await user.click(btn);
    expect(onChange).toHaveBeenCalledTimes(2);
    const [value2] = onChange.mock.calls[1];
    expect(value2).toBeNull();
  });

  it("incompatible preset is disabled for wrong mode", () => {
    // presetLast7Days returns range — incompatible with mode:single
    setup([presetLast7Days], { mode: "single" });
    expect(screen.getByText("Last 7 days")).toBeDisabled();
  });

  it("range preset is enabled for mode:range", () => {
    setup([presetLast7Days], { mode: "range" });
    expect(screen.getByText("Last 7 days")).not.toBeDisabled();
  });

  it("data-count reflects preset count", () => {
    const { container } = setup(commonPresets);
    const grid = container.querySelector("[data-count]");
    expect(grid?.getAttribute("data-count")).toBe(String(commonPresets.length));
  });

  it("readOnly disables all preset buttons", () => {
    setup(commonPresets, { readOnly: true });
    const buttons = screen.getAllByRole("button");
    for (const btn of buttons) {
      expect(btn).toBeDisabled();
    }
  });

  it("range preset active detection matches span selection", async () => {
    const user = userEvent.setup();
    setup([presetThisWeek], { mode: "range" });
    const btn = screen.getByText("This week");
    await user.click(btn);
    expect(btn.dataset.active).toBe("");
  });
});
