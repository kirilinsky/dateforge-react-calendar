import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DayCell, type DayCellProps } from "@/modules/days/day-cell";
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

const makeFlags = (overrides: Partial<DayCellFlags> = {}): DayCellFlags => ({
  ...FALSE,
  ...overrides,
});

const baseCellProps: DayCellProps = {
  day: 15,
  dateTime: new Date(2024, 5, 15).getTime(),
  isDisabled: false,
  isSelected: false,
  isCurrentMonth: true,
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
  isTodayDate: false,
  highlightToday: true,
  isWeekend: false,
  boldWeekends: false,
  range: false,
  ariaLabel: "June 15, 2024",
  tabIndex: -1,
  readOnly: false,
  isMaxReachedTarget: false,
  onSelect: vi.fn(),
  onMouseEnter: vi.fn(),
  onKeyDown: vi.fn(),
};

const renderDayCell = (props: Partial<DayCellProps> = {}) => {
  render(<DayCell {...baseCellProps} {...props} />);
  return screen.getByRole("button");
};

describe("getDayCellClassName", () => {
  it("keeps class output limited to base/shared primitive classes", () => {
    const cls = getDayCellClassName(
      makeFlags({
        range: true,
        isSelected: true,
        isInRange: true,
        rangeBridgeLeft: true,
        rangeBridgeRight: true,
        isPreviewMid: true,
        isToday: true,
        boldWeekends: true,
        isMaxReachedTarget: true,
      }),
    );

    expect(cls).toMatch(/dayItem/);
    expect(cls).toMatch(/interactive/);
    expect(cls).toMatch(/hovered/);
    expect(cls).toMatch(/activeItem/);
    expect(cls).not.toMatch(/range|Bridge|Preview|maxReached|today|Weekend/i);
  });

  it("still marks other-month cells with the shared other-month primitives", () => {
    expect(getDayCellClassName(makeFlags({ isOtherMonth: true }))).toMatch(
      /otherItem/,
    );
    expect(
      getDayCellClassName(
        makeFlags({ isOtherMonth: true, isHighlighted: true }),
      ),
    ).toMatch(/selectedOtherItem/);
  });
});

describe("DayCell state attributes", () => {
  it("exposes range, bridge, preview, and connection state as data attributes", () => {
    const button = renderDayCell({
      isSelected: true,
      connectLeft: true,
      connectRight: true,
      range: true,
      isRangeStart: true,
      isInRange: true,
      rangeBridgeLeft: true,
      rangeBridgeRight: true,
      isPreviewEnd: true,
      isPreviewMid: true,
      previewBridgeLeft: true,
      previewBridgeRight: true,
    });

    expect(button).toHaveAttribute("data-selected", "true");
    expect(button).toHaveAttribute("data-connect-left", "true");
    expect(button).toHaveAttribute("data-connect-right", "true");
    expect(button).toHaveAttribute("data-range-mode", "true");
    expect(button).toHaveAttribute("data-range-start", "true");
    expect(button).toHaveAttribute("data-in-range", "true");
    expect(button).toHaveAttribute("data-range-bridge-left", "true");
    expect(button).toHaveAttribute("data-range-bridge-right", "true");
    expect(button).toHaveAttribute("data-preview-end", "true");
    expect(button).toHaveAttribute("data-preview-mid", "true");
    expect(button).toHaveAttribute("data-preview-bridge-left", "true");
    expect(button).toHaveAttribute("data-preview-bridge-right", "true");
  });

  it("exposes today, weekend, other-month, disabled, and max-reached state as data attributes", () => {
    const button = renderDayCell({
      isDisabled: true,
      isCurrentMonth: false,
      isTodayDate: true,
      isWeekend: true,
      boldWeekends: true,
      isMaxReachedTarget: true,
    });

    expect(button).toHaveAttribute("data-disabled", "true");
    expect(button).toHaveAttribute("data-today", "true");
    expect(button).toHaveAttribute("data-weekend", "true");
    expect(button).toHaveAttribute("data-bold-weekend", "true");
    expect(button).toHaveAttribute("data-other-month", "true");
    expect(button).toHaveAttribute("data-max-reached", "true");
  });
});
