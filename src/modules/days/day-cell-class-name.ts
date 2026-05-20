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

export const getDayCellClassName = (f: DayCellFlags): string =>
  [
    styles.dayItem,
    shared.interactive,
    shared.hovered,
    f.isSelected && shared.activeItem,
    f.isOtherMonth &&
      (f.isHighlighted ? shared.selectedOtherItem : shared.otherItem),
  ]
    .filter(Boolean)
    .join(" ");
