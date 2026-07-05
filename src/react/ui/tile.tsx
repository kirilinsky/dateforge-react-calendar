import { type ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./tile.module.css";

/**
 * The ONE roving-grid cell primitive for v3 pickers (toolbar month/year
 * popups, months/years grids, presets). Internal — modules compose it.
 *
 * Style guide (see _lab/UIKit.stories.tsx and .notes/ui-styleguide.md):
 * - Resting: borderless ghost surface; hover `--c-tone`.
 * - `selected`: `--c-accent` fill + `--c-activeText` ink (the committed pick).
 * - `current`: subtle inset outline at 50% accent — the same "this is now"
 *   language the Days module uses for today. Yields to the focus ring.
 * - Disabled (`disabled` OR `aria-disabled` for roving-focusable cells):
 *   `--c-disabledText` + opacity, hover suppressed.
 * - Spread roving props (`tabIndex`, `data-roving-index`) straight onto it.
 *
 * NOT for Days cells — those keep a bespoke bitmask-memoized cell with range
 * band geometry (per-cell perf contract).
 */
export type UITileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Committed pick: accent fill. */
  selected?: boolean;
  /** "Current" marker (today's month/year): subtle accent outline. */
  current?: boolean;
};

export const UITile = forwardRef<HTMLButtonElement, UITileProps>(
  function UITile({ selected, current, className, type, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        data-ui-tile=""
        data-selected={selected || undefined}
        data-current={current || undefined}
        className={[styles.tile, className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
