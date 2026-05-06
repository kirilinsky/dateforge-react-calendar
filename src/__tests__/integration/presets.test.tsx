import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { __resetWarnOnce } from "@/core/dev-warn";
import { CalendarPresets } from "@/modules/presets";
import { basicPresets } from "@/modules/presets/presets-pack";

const buttonsByLabel = (container: HTMLElement, label: string): Element[] =>
  Array.from(container.querySelectorAll("button")).filter(
    (b) => b.textContent?.trim() === label,
  );

let warnSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  __resetWarnOnce();
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

const lastMsg = (): string => warnSpy.mock.calls.at(-1)?.[0] as string;

describe("Presets — combinations with basicPresets", () => {
  it("renders both basicPresets and custom entries side by side", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            ...basicPresets,
            { id: "custom-x", label: "My X", value: 5 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.length).toBeGreaterThan(basicPresets.length - 2);
    expect(buttons.some((b) => b.textContent?.trim() === "My X")).toBe(true);
  });
});

describe("Presets — id collisions", () => {
  it("custom entry with the same id as a basic preset is dropped (first wins) + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            ...basicPresets,
            { id: "today", label: "TODAY OVERRIDE", value: 0 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    const overrideHits = buttons.filter(
      (b) => b.textContent?.trim() === "TODAY OVERRIDE",
    );
    expect(overrideHits).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('Duplicate preset id "today"');
  });

  it("two custom entries with the same id keep the first + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            { id: "x", label: "First", value: 0 },
            { id: "x", label: "Second", value: 1 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["First"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain('Duplicate preset id "x"');
  });
});

describe("Presets — defensive handling of bad input", () => {
  it("entry that is null is skipped + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[null as never, { id: "ok", label: "OK", value: 0 }]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["OK"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("not an object");
  });

  it("entry without label is skipped + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            { id: "no-label", value: 0 } as never,
            { id: "ok", label: "OK", value: 0 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["OK"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("missing the required `label`");
  });

  it("getValue that throws does not crash + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            {
              id: "boom",
              label: "Boom",
              getValue: () => {
                throw new Error("kaboom");
              },
            },
            { id: "ok", label: "OK", value: 0 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["OK"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("kaboom");
  });

  it("getValue returning Invalid Date is filtered + warn", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            {
              id: "invalid",
              label: "Invalid",
              getValue: () => new Date(NaN),
            },
            { id: "ok", label: "OK", value: 0 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["OK"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("invalid Date");
  });

  it("getValue returning a range with NaN bounds is filtered + warn", () => {
    const { container } = render(
      <Calendar mode="range">
        <CalendarPresets
          presets={[
            {
              id: "bad-range",
              label: "Bad",
              getValue: () => ({ from: new Date(NaN), to: new Date() }),
            },
            { id: "ok", label: "OK", value: 0 },
          ]}
        />
      </Calendar>,
    );
    const buttons = Array.from(container.querySelectorAll("button"));
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(["OK"]);
    expect(warnSpy).toHaveBeenCalled();
    expect(lastMsg()).toContain("invalid Date");
  });
});

describe("Presets — maxDates cap", () => {
  it("preset click is silently dropped when cap is reached", async () => {
    const onChange = vi.fn();
    const D = (day: number) => new Date(2024, 5, day);
    const { container } = render(
      <Calendar
        mode="multiple"
        maxDates={3}
        value={[D(1), D(2), D(3)]}
        onChange={onChange}
      >
        <CalendarPresets
          presets={[{ id: "tenth", label: "Tenth", value: D(10) }]}
        />
      </Calendar>,
    );
    const btn = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent?.trim() === "Tenth",
    );
    expect(btn).toBeTruthy();
    await userEvent.click(btn!);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("Presets — mode filtering", () => {
  it("simple range preset is filtered in single mode", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            { id: "today", label: "Today", value: 0 },
            { id: "last7", label: "Last 7 days", value: -6, range: 6 },
          ]}
        />
      </Calendar>,
    );
    expect(buttonsByLabel(container, "Today")).toHaveLength(1);
    expect(buttonsByLabel(container, "Last 7 days")).toHaveLength(0);
  });

  it("simple range preset is filtered in multiple mode", () => {
    const { container } = render(
      <Calendar mode="multiple">
        <CalendarPresets
          presets={[
            { id: "today", label: "Today", value: 0 },
            { id: "last7", label: "Last 7 days", value: -6, range: 6 },
          ]}
        />
      </Calendar>,
    );
    expect(buttonsByLabel(container, "Last 7 days")).toHaveLength(0);
  });

  it("simple range preset renders and commits in range mode", async () => {
    const onChange = vi.fn();
    const { container } = render(
      <Calendar mode="range" onChange={onChange}>
        <CalendarPresets
          presets={[{ id: "last7", label: "Last 7 days", value: -6, range: 6 }]}
        />
      </Calendar>,
    );
    const btns = buttonsByLabel(container, "Last 7 days");
    expect(btns).toHaveLength(1);
    await userEvent.click(btns[0]);
    expect(onChange).toHaveBeenCalled();
    const last = onChange.mock.calls.at(-1)![0];
    expect(last).toHaveProperty("from");
    expect(last).toHaveProperty("to");
  });

  it("range preset is filtered when shorter than minRangeDays", () => {
    const { container } = render(
      <Calendar mode="range" minRangeDays={3}>
        <CalendarPresets
          presets={[
            {
              id: "short",
              label: "Too short",
              value: new Date(2024, 5, 1),
              range: 1,
            },
          ]}
        />
      </Calendar>,
    );
    expect(buttonsByLabel(container, "Too short")).toHaveLength(0);
  });

  it("range preset is filtered when it contains disabled dates", () => {
    const { container } = render(
      <Calendar
        mode="range"
        disabled={{
          __type: "disabled-config",
          rules: [new Date(2024, 5, 2)],
        }}
      >
        <CalendarPresets
          presets={[
            {
              id: "blocked",
              label: "Blocked range",
              getValue: () => ({
                from: new Date(2024, 5, 1),
                to: new Date(2024, 5, 3),
              }),
            },
          ]}
        />
      </Calendar>,
    );
    expect(buttonsByLabel(container, "Blocked range")).toHaveLength(0);
  });

  it("advanced range preset is filtered in single mode", () => {
    const { container } = render(
      <Calendar mode="single">
        <CalendarPresets
          presets={[
            {
              id: "this-week",
              label: "This week",
              getValue: ({ now }) => ({
                from: now,
                to: new Date(now.getTime() + 6 * 86400000),
              }),
            },
          ]}
        />
      </Calendar>,
    );
    expect(buttonsByLabel(container, "This week")).toHaveLength(0);
  });
});
