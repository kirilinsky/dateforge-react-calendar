import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarTimeWheel } from "@/modules/time";
import { TestToolbar } from "../helpers/test-toolbar";

const D = new Date(2024, 5, 15);

const setup = async (ui: React.ReactNode) => {
  const html = renderToString(ui);
  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  let root!: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, ui);
  });
  return { container, root, errorSpy };
};

const teardown = async (
  root: ReturnType<typeof hydrateRoot>,
  errorSpy: ReturnType<typeof vi.spyOn>,
) => {
  await act(async () => {
    root.unmount();
  });
  errorSpy.mockRestore();
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
  it("Calendar + Days hydrates cleanly", async () => {
    const { errorSpy, root } = await setup(
      <Calendar value={D}>
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    await teardown(root, errorSpy);
  });

  it("Toolbar with live clock hydrates cleanly", async () => {
    const { errorSpy, root } = await setup(
      <Calendar value={D}>
        <TestToolbar showNowTime />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    await teardown(root, errorSpy);
  });

  it("Calendar with theme=auto hydrates cleanly", async () => {
    const { errorSpy, root } = await setup(
      <Calendar value={D} theme="auto">
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    await teardown(root, errorSpy);
  });

  it("Calendar with timeZone=auto hydrates cleanly", async () => {
    const { errorSpy, root } = await setup(
      <Calendar value={D} timeZone="auto">
        <CalendarDays />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    await teardown(root, errorSpy);
  });

  it("Calendar with TimeWheel hydrates cleanly", async () => {
    const { errorSpy, root } = await setup(
      <Calendar value={D}>
        <CalendarTimeWheel />
      </Calendar>,
    );
    expect(hydrationWarnings(errorSpy)).toEqual([]);
    await teardown(root, errorSpy);
  });
});
