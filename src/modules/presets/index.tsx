import React, { useMemo } from "react";
import styles from "./presets.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue, useSelectionActions } from "@/context/selection-context";
import { isSameDay } from "@/utils/date-core";
import { getFilteredPresets, getPresetDate, getRelativeLabel } from "./preset-utils";
import { useGridSlot } from "@/hooks/use-grid-slot";
import shared from "@/global/global.module.css";

export interface CalendarPresetsProps {
  showYears?: boolean;
  showMonths?: boolean;
  col?: number | string;
}

export const CalendarPresets: React.FC<CalendarPresetsProps> = ({
  showYears = true,
  showMonths = true,
  col,
}) => {
  const { minDate, maxDate, locale, disabled } = useConfig();
  const { viewDate: date } = useNavigation();
  const { selectedDate } = useSelectionValue();
  const { onChangeDate } = useSelectionActions();

  const presets = useMemo(
    () => getFilteredPresets(showYears, showMonths, minDate, maxDate, disabled),
    [showYears, showMonths, minDate, maxDate, disabled],
  );

  return (
    <div
      className={styles.presetsContainer}
      data-area="presets"
      data-count={presets.length}
      style={useGridSlot(col)}
    >
      {presets.map((preset) => {
        const isActive = !!selectedDate && isSameDay(preset.targetDate, selectedDate);
        return (
          <button
            key={preset.id}
            type="button"
            className={[
              styles.presetItem,
              shared.interactive,
              shared.hoverable,
              isActive ? shared.activeItem : styles.inactiveItem,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() =>
              onChangeDate(getPresetDate(preset, date, minDate, maxDate))
            }
          >
            {getRelativeLabel(locale, preset.amount, preset.unit)}
          </button>
        );
      })}
    </div>
  );
};
