import { describe, it, expect, vi, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarNav } from "@/modules/nav";
import { CalendarTimeGrid } from "@/modules/time";

const D = new Date(2024, 5, 15);

const setup = (ui: React.ReactNode) => {
  const html = renderToString(ui);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  const root = hydrateRoot(container, ui);
  return { container, root, errorSpy };
};

afterEach(() => {
  document.body.innerHTML = "";
});

const hydrationWarnings = (errorSpy: ReturnType<typeof vi.spyOn>): string[] =>
  (errorSpy.mock.calls as unknown[][])
    .map((c) => String(c[0] ?? ""))
    .filter(
      (m: string) =>
        m.includes("did not match") ||
        m.includes("Hydration") ||
        m.includes("hydration"),
    );

describe("Hydration — no mismatch warnings", () => {
  it("Calendar + Days hydrates cleanly", () => {
    const { errorSpy, root } = setup(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    root.unmount();
    errorSpy.mockRestore();
  });

  it("Nav with showNowTime hydrates cleanly", () => {
    const { errorSpy, root } = setup(
      <Calendar value={D}>
        <CalendarNav showNowTime />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    root.unmount();
    errorSpy.mockRestore();
  });

  it("Calendar with theme=auto hydrates cleanly", () => {
    const { errorSpy, root } = setup(
      <Calendar value={D} theme="auto">
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    root.unmount();
    errorSpy.mockRestore();
  });

  it("Calendar with timeZone=auto hydrates cleanly", () => {
    const { errorSpy, root } = setup(
      <Calendar value={D} timeZone="auto">
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    root.unmount();
    errorSpy.mockRestore();
  });

  it("Calendar with TimeGrid hydrates cleanly", () => {
    const { errorSpy, root } = setup(
      <Calendar value={D}>
        <CalendarTimeGrid />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    root.unmount();
    errorSpy.mockRestore();
  });
});
