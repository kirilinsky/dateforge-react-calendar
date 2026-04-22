import type { CSSProperties } from "react";

export const useGridSlot = (col?: number | string): CSSProperties | undefined =>
  col === undefined
    ? undefined
    : { gridColumn: typeof col === "number" ? `span ${col}` : col };
