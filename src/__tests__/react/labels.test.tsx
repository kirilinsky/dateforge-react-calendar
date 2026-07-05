import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CalendarToolbar,
  CalendarToolbarNext,
  CalendarToolbarPrev,
} from "@/modules/toolbar/CalendarToolbar";
import { Calendar } from "@/react/calendar";
import { buildConfig, D } from "../fixtures/builders";

function renderToolbar(
  labels?: Record<string, string>,
  next?: { label?: string },
) {
  return render(
    <Calendar
      config={buildConfig()}
      initialView={D(2026, 6, 1)}
      labels={labels}
    >
      <CalendarToolbar>
        <CalendarToolbarPrev />
        <CalendarToolbarNext label={next?.label} />
      </CalendarToolbar>
    </Calendar>,
  );
}

describe("Label registry wiring (module → root → default)", () => {
  it("falls back to the English default", () => {
    const { getByLabelText } = renderToolbar();
    expect(getByLabelText("Previous month")).toBeTruthy();
    expect(getByLabelText("Next month")).toBeTruthy();
  });

  it("root `labels` override wins over the default", () => {
    const { getByLabelText, queryByLabelText } = renderToolbar({
      previousMonth: "Mois précédent",
    });
    expect(getByLabelText("Mois précédent")).toBeTruthy();
    expect(queryByLabelText("Previous month")).toBeNull();
    // Untouched keys still use the default.
    expect(getByLabelText("Next month")).toBeTruthy();
  });

  it("a module `label` prop overrides both root and default", () => {
    const { getByLabelText } = renderToolbar(
      { nextMonth: "Mois suivant" },
      { label: "Go forward" },
    );
    // Module prop beats the root override for that one control.
    expect(getByLabelText("Go forward")).toBeTruthy();
  });
});
