import React, { useMemo } from "react";
import styles from "./presets.module.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelection } from "@/context/selection-context";
import {
  getFilteredPresets,
  getPresetDate,
  getRelativeLabel,
  isSameDay,
} from "@/utils/date-utils";
import shared from "@/global/global.module.css";

interface CalendarPresetsProps {
  showYears?: boolean;
  showMonths?: boolean;
}

export const PresetsComponent: React.FC<CalendarPresetsProps> = ({
  showYears = true,
  showMonths = true,
}) => {
  const {
    minDate, maxDate, showYearPicker, locale,
    compactMonths, compactYears, months, disabled,
  } = useConfig();
  const { viewDate: date } = useNavigation();
  const { selectedDate, onChangeDate } = useSelection();

  const presets = useMemo(
    () =>
      getFilteredPresets(
        showYears && (showYearPicker || !!compactYears),
        showMonths && (!!compactMonths || !!months),
        minDate,
        maxDate,
        disabled,
      ),
    [
      showYears,
      showMonths,
      showYearPicker,
      months,
      minDate,
      maxDate,
      compactYears,
      compactMonths,
      disabled,
    ],
  );

  return (
    <div
      className={styles.presetsContainer}
      data-area="presets"
      style={{ gridArea: "PP" }}
      data-count={presets.length}
    >
      {presets.map((preset) => {
        const isActive =
          !!selectedDate && isSameDay(preset.targetDate, selectedDate);
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

export { PresetsComponent as CalendarPresets };
