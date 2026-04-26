export type AlignValue = "left" | "center" | "right";

export const alignToJustify: Record<AlignValue, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};
