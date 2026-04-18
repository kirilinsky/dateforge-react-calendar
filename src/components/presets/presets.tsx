import React, { useMemo } from "react";
import styles from "./presets.module.css";
import { useCalendarContext } from "../provider/provider";
import {
  getFilteredPresets,
  getPresetDate,
  getRelativeLabel,
  isSameDay,
} from "@/utils/date-utils";
import shared from "@/global/global.module.css";

export const PresetsComponent: React.FC = () => {
  const {
    monthsGrid,
    date,
    selectedDate,
    minDate,
    maxDate,
    showYearPicker,
    onChangeDate,
    locale,
    compactMonths,
    compactYears,
    months,
    disabled,
  } = useCalendarContext();

  const presets = useMemo(
    () =>
      getFilteredPresets(
        showYearPicker || !!compactYears,
        monthsGrid || !!compactMonths || !!months,
        minDate,
        maxDate,
        disabled,
      ),
    [
      showYearPicker,
      months,
      monthsGrid,
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
