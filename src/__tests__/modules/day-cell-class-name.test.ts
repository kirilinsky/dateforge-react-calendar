import { describe, expect, it } from "vitest";
import {
  type DayCellFlags,
  getDayCellClassName,
} from "@/modules/days/day-cell-class-name";

const FALSE: DayCellFlags = {
  range: false,
  isSelected: false,
  isDisabled: false,
  connectLeft: false,
  connectRight: false,
  isRangeStart: false,
  isRangeEnd: false,
  isInRange: false,
  rangeBridgeLeft: false,
  rangeBridgeRight: false,
  isPreviewStart: false,
  isPreviewEnd: false,
  isPreviewMid: false,
  previewBridgeLeft: false,
  previewBridgeRight: false,
  isToday: false,
  boldWeekends: false,
  isOtherMonth: false,
  isHighlighted: false,
  isMaxReachedTarget: false,
};

const make = (overrides: Partial<DayCellFlags>): DayCellFlags => ({
  ...FALSE,
  ...overrides,
});

describe("getDayCellClassName", () => {
  it("always includes base dayItem + interactive + hovered classes", () => {
    const cls = getDayCellClassName(FALSE);
    expect(cls).toMatch(/dayItem/);
    expect(cls).toMatch(/interactive/);
    expect(cls).toMatch(/hovered/);
  });

  it("adds activeItem when single-mode selected", () => {
    const cls = getDayCellClassName(make({ isSelected: true }));
    expect(cls).toMatch(/activeItem/);
  });

  it("adds rangeMid when connecting both sides in single-mode", () => {
    const cls = getDayCellClassName(
      make({ connectLeft: true, connectRight: true }),
    );
    expect(cls).toMatch(/rangeMid/);
    expect(cls).not.toMatch(/rangeStart|rangeEnd/);
  });

  it("adds rangeStart class when connecting only right in single-mode", () => {
    const cls = getDayCellClassName(make({ connectRight: true }));
    expect(cls).toMatch(/rangeStart/);
  });

  it("adds rangeEnd class when connecting only left in single-mode", () => {
    const cls = getDayCellClassName(make({ connectLeft: true }));
    expect(cls).toMatch(/rangeEnd/);
  });

  it("range-mode selected cell still gets activeItem", () => {
    const cls = getDayCellClassName(make({ range: true, isSelected: true }));
    expect(cls).toMatch(/activeItem/);
  });

  it("range start with right bridge picks rStart + rBridgeRight", () => {
    const cls = getDayCellClassName(
      make({
        range: true,
        isRangeStart: true,
        rangeBridgeRight: true,
      }),
    );
    expect(cls).toMatch(/rStart/);
    expect(cls).toMatch(/rBridgeRight/);
  });

  it("range end with left bridge picks rEnd + rBridgeLeft", () => {
    const cls = getDayCellClassName(
      make({
        range: true,
        isRangeEnd: true,
        rangeBridgeLeft: true,
      }),
    );
    expect(cls).toMatch(/rEnd/);
    expect(cls).toMatch(/rBridgeLeft/);
  });

  it("mid-range with both bridges picks rBridgeBoth", () => {
    const cls = getDayCellClassName(
      make({
        range: true,
        isInRange: true,
        rangeBridgeLeft: true,
        rangeBridgeRight: true,
      }),
    );
    expect(cls).toMatch(/rBridgeBoth/);
  });

  it("range in-range without disabled adds rIn", () => {
    const cls = getDayCellClassName(make({ range: true, isInRange: true }));
    expect(cls).toMatch(/rIn/);
    expect(cls).not.toMatch(/rInDisabled/);
  });

  it("range in-range AND disabled flips to rInDisabled (no rIn)", () => {
    const cls = getDayCellClassName(
      make({ range: true, isInRange: true, isDisabled: true }),
    );
    expect(cls).toMatch(/rInDisabled/);
    expect(cls).not.toMatch(/rIn(?![A-Za-z])/);
  });

  it("preview start adds rPreviewStart when not selected", () => {
    const cls = getDayCellClassName(make({ isPreviewStart: true }));
    expect(cls).toMatch(/rPreviewStart/);
  });

  it("preview start + selected picks rStart instead", () => {
    const cls = getDayCellClassName(
      make({ isPreviewStart: true, isSelected: true }),
    );
    expect(cls).toMatch(/rStart/);
    expect(cls).not.toMatch(/rPreviewStart/);
  });

  it("preview mid adds rPreview when not disabled", () => {
    const cls = getDayCellClassName(make({ isPreviewMid: true }));
    expect(cls).toMatch(/rPreview(?![A-Za-z])/);
  });

  it("preview mid is suppressed when disabled", () => {
    const cls = getDayCellClassName(
      make({ isPreviewMid: true, isDisabled: true }),
    );
    expect(cls).not.toMatch(/rPreview(?![A-Za-z])/);
  });

  it("preview bridges respect disabled flag", () => {
    const enabled = getDayCellClassName(
      make({ previewBridgeLeft: true, previewBridgeRight: true }),
    );
    expect(enabled).toMatch(/rPreviewBridgeBoth/);

    const disabled = getDayCellClassName(
      make({
        previewBridgeLeft: true,
        previewBridgeRight: true,
        isDisabled: true,
      }),
    );
    expect(disabled).not.toMatch(/rPreviewBridge/);
  });

  it("isToday adds todayItem", () => {
    const cls = getDayCellClassName(make({ isToday: true }));
    expect(cls).toMatch(/todayItem/);
  });

  it("boldWeekends adds boldWeekend", () => {
    const cls = getDayCellClassName(make({ boldWeekends: true }));
    expect(cls).toMatch(/boldWeekend/);
  });

  it("other month + not highlighted → otherItem", () => {
    const cls = getDayCellClassName(make({ isOtherMonth: true }));
    expect(cls).toMatch(/otherItem/);
    expect(cls).not.toMatch(/selectedOtherItem/);
  });

  it("other month + highlighted → selectedOtherItem", () => {
    const cls = getDayCellClassName(
      make({ isOtherMonth: true, isHighlighted: true }),
    );
    expect(cls).toMatch(/selectedOtherItem/);
  });

  it("isMaxReachedTarget adds maxReachedTarget", () => {
    const cls = getDayCellClassName(make({ isMaxReachedTarget: true }));
    expect(cls).toMatch(/maxReachedTarget/);
  });

  it("returns stable output for stable input (pure)", () => {
    const flags = make({
      range: true,
      isSelected: true,
      isInRange: true,
    });
    expect(getDayCellClassName(flags)).toBe(getDayCellClassName(flags));
  });

  it("no trailing/leading whitespace; single-space separated", () => {
    const cls = getDayCellClassName(
      make({ range: true, isInRange: true, isToday: true }),
    );
    expect(cls).toBe(cls.trim());
    expect(cls).not.toMatch(/\s{2,}/);
  });
});
