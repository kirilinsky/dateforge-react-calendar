import { useMemo, useRef } from "react";
import { dateKey } from "../../core-v3/calendar-date";
import {
  compilePresets,
  type EvaluatedPreset,
  type Preset,
  type PresetResult,
} from "../../core-v3/preset-engine";
import type { SelectionState } from "../../core-v3/state";
import { today } from "../../core-v3/timezone-boundary";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UITile } from "../../react-v3/ui/tile";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./presets.module.css";

function isPresetActive(
  result: PresetResult | null,
  selection: SelectionState,
): boolean {
  if (!result) return false;
  if (result.kind === "date") {
    return (
      selection.shape === "point" &&
      selection.dates.some((dt) => dateKey(dt.date) === dateKey(result.date))
    );
  }
  if (result.kind === "dates") {
    if (selection.shape !== "point" || selection.dates.length === 0)
      return false;
    const keys = new Set(selection.dates.map((dt) => dateKey(dt.date)));
    return result.dates.every((d) => keys.has(dateKey(d)));
  }
  if (result.kind === "range") {
    return (
      selection.shape === "span" &&
      selection.ranges.length === 1 &&
      dateKey(selection.ranges[0].start) === dateKey(result.range.start) &&
      dateKey(selection.ranges[0].end) === dateKey(result.range.end)
    );
  }
  return false;
}

export type CalendarPresetsProps = {
  presets?: Preset[];
  col?: number | string;
  className?: string;
};

export function CalendarPresets({
  presets: presetsProp = [],
  col,
  className,
}: CalendarPresetsProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const { applyPreset, clear } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);

  const engine = useMemo(() => compilePresets(presetsProp), [presetsProp]);

  const todayRef = useRef(today(config.timeZone));
  const ctx = useMemo(
    () => ({ today: todayRef.current, firstDayOfWeek: config.firstDayOfWeek }),
    [config.firstDayOfWeek],
  );
  const vctx = useMemo(
    () => ({
      mode: config.mode,
      rules: config.disabled.isEmpty ? undefined : config.disabled,
      min: config.min,
      max: config.max,
    }),
    [config.mode, config.disabled, config.min, config.max],
  );

  const evaluated: EvaluatedPreset[] = useMemo(
    () => engine.evaluate(ctx, vctx),
    [engine, ctx, vctx],
  );

  const activeIndex = evaluated.findIndex((ep) =>
    isPresetActive(ep.result, selection),
  );

  const { containerRef, handleKeyDown, getItemProps } = useRovingTileFocus({
    itemCount: evaluated.length,
    activeIndex: activeIndex >= 0 ? activeIndex : 0,
  });

  if (evaluated.length === 0) return null;

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-presets=""
      data-area="presets"
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <div
        ref={containerRef}
        className={styles.grid}
        data-count={evaluated.length}
        onKeyDown={handleKeyDown}
      >
        {evaluated.map((ep, index) => {
          const active = isPresetActive(ep.result, selection);
          const isDisabled =
            config.readOnly ||
            ep.status === "incompatible" ||
            ep.status === "disabled";
          return (
            <UITile
              key={ep.preset.id}
              {...getItemProps(index)}
              className={styles.item}
              selected={active}
              data-active={active ? "" : undefined}
              data-preset-id={ep.preset.id}
              data-status={ep.status}
              disabled={isDisabled}
              onClick={() => {
                if (isDisabled || !ep.result) return;
                if (active) {
                  clear();
                } else {
                  applyPreset(ep.result);
                }
              }}
            >
              {ep.preset.label ?? ep.preset.id}
            </UITile>
          );
        })}
      </div>
    </div>
  );
}
