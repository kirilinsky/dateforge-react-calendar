import shared from "@/global/global.module.css";
import styles from "./days.module.css";

export interface DayCellFlags {
  range: boolean;
  isSelected: boolean;
  isDisabled: boolean;
  connectLeft: boolean;
  connectRight: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  rangeBridgeLeft: boolean;
  rangeBridgeRight: boolean;
  isPreviewStart: boolean;
  isPreviewEnd: boolean;
  isPreviewMid: boolean;
  previewBridgeLeft: boolean;
  previewBridgeRight: boolean;
  isToday: boolean;
  boldWeekends: boolean;
  isOtherMonth: boolean;
  isHighlighted: boolean;
  isMaxReachedTarget: boolean;
}

const rangeEndpointClass = (f: DayCellFlags) => {
  if (f.isRangeStart && !f.isRangeEnd) return styles.rStart;
  if (f.isRangeEnd && !f.isRangeStart) return styles.rEnd;
  return null;
};

const rangeBridgeClass = (f: DayCellFlags) => {
  if (f.isRangeStart && f.rangeBridgeRight) return styles.rBridgeRight;
  if (f.isRangeEnd && f.rangeBridgeLeft) return styles.rBridgeLeft;
  if (f.isInRange && f.rangeBridgeLeft && f.rangeBridgeRight)
    return styles.rBridgeBoth;
  if (f.isInRange && f.rangeBridgeLeft) return styles.rBridgeLeft;
  if (f.isInRange && f.rangeBridgeRight) return styles.rBridgeRight;
  return null;
};

const previewClass = (f: DayCellFlags) => {
  if (f.isPreviewStart && f.isSelected) return styles.rStart;
  if (f.isPreviewEnd && f.isSelected) return styles.rEnd;
  if (f.isPreviewStart) return styles.rPreviewStart;
  if (f.isPreviewEnd) return styles.rPreviewEnd;
  if (f.isPreviewMid && !f.isDisabled) return styles.rPreview;
  return null;
};

const previewBridgeClass = (f: DayCellFlags) => {
  if (f.isDisabled) return null;
  if (f.previewBridgeLeft && f.previewBridgeRight)
    return styles.rPreviewBridgeBoth;
  if (f.previewBridgeRight) return styles.rPreviewBridgeRight;
  if (f.previewBridgeLeft) return styles.rPreviewBridgeLeft;
  return null;
};

export const getDayCellClassName = (f: DayCellFlags): string =>
  [
    styles.dayItem,
    shared.interactive,
    shared.hovered,
    f.isMaxReachedTarget && styles.maxReachedTarget,
    !f.range && f.isSelected && shared.activeItem,
    !f.range && f.connectLeft && f.connectRight && styles.rangeMid,
    !f.range && f.connectLeft && !f.connectRight && styles.rangeEnd,
    !f.range && !f.connectLeft && f.connectRight && styles.rangeStart,
    f.range && f.isSelected && shared.activeItem,
    f.range && rangeEndpointClass(f),
    f.range && rangeBridgeClass(f),
    f.range && f.isInRange && !f.isDisabled && styles.rIn,
    f.range &&
      (f.isInRange || f.isPreviewMid) &&
      f.isDisabled &&
      styles.rInDisabled,
    previewClass(f),
    previewBridgeClass(f),
    f.isToday && styles.todayItem,
    f.boldWeekends && styles.boldWeekend,
    f.isOtherMonth &&
      (f.isHighlighted ? shared.selectedOtherItem : shared.otherItem),
  ]
    .filter(Boolean)
    .join(" ");
