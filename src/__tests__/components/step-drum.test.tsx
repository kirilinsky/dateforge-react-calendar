import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StepDrum } from "@/components/step-drum/step-drum";

describe("StepDrum bounds", () => {
  it("does not render clamped duplicates beyond the bounded edge", () => {
    const { container } = render(
      <StepDrum
        value={8}
        max={12}
        minValue={8}
        label="Month"
        getValueText={(v) => String(v)}
        format={(v) =>
          [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ][v] ?? ""
        }
        onChange={() => undefined}
      />,
    );

    expect(container.textContent?.match(/Sep/g)).toHaveLength(1);
  });
});
