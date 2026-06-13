import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CalendarToolbar,
  CalendarToolbarThemeToggle,
} from "@/modules-v3/toolbar/CalendarToolbar";
import { Calendar } from "@/react-v3/calendar";
import { buildConfig, D } from "../fixtures/builders";

function mockSystem(dark: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia;
}

function root() {
  return document.querySelector("[data-dateforge-root]");
}

describe("CalendarToolbarThemeToggle", () => {
  beforeEach(() => mockSystem(false));
  afterEach(() => vi.restoreAllMocks());

  it("flips data-scheme on the root (uncontrolled, auto → dark)", async () => {
    const user = userEvent.setup();
    render(
      <Calendar config={buildConfig()} initialView={D(2026, 6, 1)}>
        <CalendarToolbar>
          <CalendarToolbarThemeToggle />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(root()?.getAttribute("data-scheme")).toBe("auto");
    // System is light → first flip resolves to dark.
    await user.click(screen.getByRole("button"));
    expect(root()?.getAttribute("data-scheme")).toBe("dark");
    await user.click(screen.getByRole("button"));
    expect(root()?.getAttribute("data-scheme")).toBe("light");
  });

  it("reflects the resolved dark state via aria-pressed", async () => {
    render(
      <Calendar
        config={buildConfig()}
        scheme="dark"
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar>
          <CalendarToolbarThemeToggle />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button").getAttribute("aria-label")).toMatch(
      /light/i,
    );
  });

  it("resolves dark from the OS when scheme is auto", () => {
    mockSystem(true);
    render(
      <Calendar config={buildConfig()} initialView={D(2026, 6, 1)}>
        <CalendarToolbar>
          <CalendarToolbarThemeToggle />
        </CalendarToolbar>
      </Calendar>,
    );
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("controlled: calls onSchemeChange and does not self-update", async () => {
    const onSchemeChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Calendar
        config={buildConfig()}
        scheme="light"
        onSchemeChange={onSchemeChange}
        initialView={D(2026, 6, 1)}
      >
        <CalendarToolbar>
          <CalendarToolbarThemeToggle />
        </CalendarToolbar>
      </Calendar>,
    );
    await user.click(screen.getByRole("button"));
    expect(onSchemeChange).toHaveBeenCalledWith("dark");
    // Host owns the prop; without a re-render with scheme="dark" it stays light.
    expect(root()?.getAttribute("data-scheme")).toBe("light");
  });
});
