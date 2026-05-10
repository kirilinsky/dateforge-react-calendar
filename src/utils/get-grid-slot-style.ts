import type { CSSProperties } from "react";

export const getGridSlotStyle = (
  col?: number | string,
): CSSProperties | undefined =>
  col === undefined
    ? undefined
    : { gridColumn: typeof col === "number" ? `span ${col}` : col };
