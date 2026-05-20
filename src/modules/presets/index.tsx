import type React from "react";
import { useMemo } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { useRovingTileFocus } from "@/hooks/use-roving-tile-focus";
import type { PresetEntry } from "@/types/presets";
import type { CalendarTheme } from "@/types/themes";
import { isSameDay } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
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
  theme?: CalendarTheme;
}

const EMPTY: PresetEntry[] = [];

export const CalendarPresets: React.FC<CalendarPresetsProps> = ({
  presets = EMPTY,
  col,
  theme,
}) => {
  const {
    minDate,
    maxDate,
    locale,
    disabled,
    range,
    minRangeDays,
    maxRangeDays,
    readOnly,
  } = useConfig();
  const { viewDate } = useNavigation();
  const { activeTheme } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);
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
        minRangeDays,
        maxRangeDays,
      ),
    [
      presets,
      viewDate,
      locale,
      range,
      minDate,
      maxDate,
      disabled,
      minRangeDays,
      maxRangeDays,
    ],
  );
  const gridSlot = getGridSlotStyle(col);
  const rootStyle = { ...gridSlot, ...themeScope.style };
  const isPresetActive = (p: (typeof resolved)[number]) =>
    p.isRange
      ? !!rangeStart &&
        !!rangeEnd &&
        isSameDay((p.value as { from: Date; to: Date }).from, rangeStart) &&
        isSameDay((p.value as { from: Date; to: Date }).to, rangeEnd)
      : !!selectedDate && isSameDay(p.value as Date, selectedDate);
  const activeIndex = resolved.findIndex(isPresetActive);
  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: resolved.length,
    activeIndex: activeIndex >= 0 ? activeIndex : 0,
  });

  if (!resolved.length) return null;

  return (
    <div
      className={styles.presetsContainer}
      data-area="presets"
      data-theme={themeScope.dataTheme}
      style={rootStyle}
    >
      <div
        ref={containerRef}
        className={styles.presetsGrid}
        data-count={resolved.length}
        onKeyDown={handleKeyDown}
      >
        {resolved.map((p, index) => {
          const isActive = isPresetActive(p);

          return (
            <button
              key={p.id}
              type="button"
              {...getItemProps(index)}
              className={[
                styles.presetItem,
                shared.adaptiveTile,
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
    </div>
  );
};
