import type React from "react";
import { useMemo } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { useGridSlot } from "@/hooks/use-grid-slot";
import type { PresetEntry } from "@/types/presets";
import { isSameDay } from "@/utils/date-core";
import { getResolvedPresets } from "./preset-utils";
import styles from "./presets.module.css";

export interface CalendarPresetsProps {
  /**
   * Array of preset entries to render. Empty / omitted = nothing.
   *
   * Each entry is either a `SimplePresetDef` (`{ label, value, range? }`) or
   * an `AdvancedPresetDef` (`{ id, label, getValue }`).
   *
   * Import `basicPresets` from the package to get the classic preset set.
   */
  presets?: PresetEntry[];
  col?: number | string;
}

const EMPTY: PresetEntry[] = [];

export const CalendarPresets: React.FC<CalendarPresetsProps> = ({
  presets = EMPTY,
  col,
}) => {
  const { minDate, maxDate, locale, disabled, range, readOnly } = useConfig();
  const { viewDate } = useNavigation();
  const { selectedDate, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate, onRangeSet } = useSelectionActions();

  const resolved = useMemo(
    () =>
      getResolvedPresets(
        presets,
        viewDate,
        locale,
        range,
        minDate,
        maxDate,
        disabled,
      ),
    [presets, viewDate, locale, range, minDate, maxDate, disabled],
  );
  const gridSlot = useGridSlot(col);

  if (!resolved.length) return null;

  return (
    <div
      className={styles.presetsContainer}
      data-area="presets"
      data-count={resolved.length}
      style={gridSlot}
    >
      {resolved.map((p) => {
        const isActive = p.isRange
          ? !!rangeStart &&
            !!rangeEnd &&
            isSameDay((p.value as { from: Date; to: Date }).from, rangeStart) &&
            isSameDay((p.value as { from: Date; to: Date }).to, rangeEnd)
          : !!selectedDate && isSameDay(p.value as Date, selectedDate);

        return (
          <button
            key={p.id}
            type="button"
            className={[
              styles.presetItem,
              shared.interactive,
              shared.hovered,
              isActive ? shared.activeItem : styles.inactiveItem,
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => {
              if (readOnly) return;
              if (p.isRange) {
                if (isActive) {
                  onRangeSet(null, null);
                } else {
                  const r = p.value as { from: Date; to: Date };
                  onRangeSet(r.from, r.to);
                }
              } else {
                onChangeDate(isActive ? null : (p.value as Date));
              }
            }}
            disabled={readOnly}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
};
