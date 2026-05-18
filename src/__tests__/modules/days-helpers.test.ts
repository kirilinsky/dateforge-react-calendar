import { describe, expect, it } from "vitest";
import { computeEffectiveHoverDate } from "@/modules/days/helpers";

describe("days helpers", () => {
  describe("computeEffectiveHoverDate", () => {
    it("keeps hover for dates visible only in the far trailing grid spillover", () => {
      const hoverDate = new Date(2024, 7, 11);

      expect(
        computeEffectiveHoverDate({
          range: true,
          rangeStart: new Date(2024, 7, 9),
          rangeEnd: null,
          hoverDate,
          currentYear: 2024,
          currentMonth: 6,
          firstDayOffset: 0,
        }),
      ).toBe(hoverDate);
    });

    it("drops hover when the preview cannot intersect the visible grid", () => {
      expect(
        computeEffectiveHoverDate({
          range: true,
          rangeStart: new Date(2024, 7, 12),
          rangeEnd: null,
          hoverDate: new Date(2024, 7, 13),
          currentYear: 2024,
          currentMonth: 6,
          firstDayOffset: 0,
        }),
      ).toBeNull();
    });
  });
});
