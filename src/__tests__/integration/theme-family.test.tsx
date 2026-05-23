import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { createTheme } from "@/utils/create-theme";
import { TestToolbar } from "../helpers/test-toolbar";

describe("Calendar theme families", () => {
  it("uses light and dark flags as the initial mode for the default theme", () => {
    const { container: darkContainer } = render(
      <Calendar dark>
        <TestToolbar />
      </Calendar>,
    );
    expect(
      darkContainer.querySelector("[data-theme]")?.getAttribute("data-theme"),
    ).toBe("dark");

    const { container: lightContainer } = render(
      <Calendar light>
        <TestToolbar />
      </Calendar>,
    );
    expect(
      lightContainer.querySelector("[data-theme]")?.getAttribute("data-theme"),
    ).toBe("light");
  });

  it("resolves the active family variant and lets the Toolbar theme toggle switch variants", () => {
    const theme = createTheme({
      light: { highlight: "#111111" },
      dark: { highlight: "#eeeeee" },
    });

    const { container } = render(
      <Calendar theme={theme}>
        <TestToolbar themeToggle />
      </Calendar>,
    );

    const root = container.querySelector("[data-theme]") as HTMLElement;
    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.style.getPropertyValue("--c-h")).toBe("#111111");

    fireEvent.click(screen.getByLabelText("Switch to dark mode"));

    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.getPropertyValue("--c-h")).toBe("#eeeeee");
  });

  it("uses light and dark flags as the initial mode for a theme family", () => {
    const theme = createTheme({
      light: { highlight: "#111111" },
      dark: { highlight: "#eeeeee" },
    });

    const { container } = render(
      <Calendar theme={theme} dark>
        <TestToolbar themeToggle />
      </Calendar>,
    );

    const root = container.querySelector("[data-theme]") as HTMLElement;
    expect(root.getAttribute("data-theme")).toBe("dark");
    expect(root.style.getPropertyValue("--c-h")).toBe("#eeeeee");

    fireEvent.click(screen.getByLabelText("Switch to light mode"));

    expect(root.getAttribute("data-theme")).toBe("light");
    expect(root.style.getPropertyValue("--c-h")).toBe("#111111");
  });
});
