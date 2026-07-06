import type { CSSProperties } from "react";

/**
 * `col` → `grid-column`. A number spans N tracks, a string is raw placement,
 * and `"full"` is the collapse-safe full-row form (`1 / -1` tracks the
 * CURRENT explicit track count, so it stays one full row when the smart
 * `cols` grid collapses on narrow containers — a numeric span would force
 * phantom implicit tracks there).
 */
export const getGridSlotStyle = (
  col?: number | string,
): CSSProperties | undefined =>
  col === undefined
    ? undefined
    : {
        gridColumn:
          col === "full"
            ? "1 / -1"
            : typeof col === "number"
              ? `span ${col}`
              : col,
      };
