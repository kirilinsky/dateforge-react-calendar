import type React from "react";

export const debugStyle: React.CSSProperties = {
  marginBottom: 8,
  fontFamily: "monospace",
  fontSize: 12,
  color: "inherit",
};

export const fmtDate = (d: Date): string =>
  `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()}`;

export const fmtRange = (r: { from: Date | null; to: Date | null }): string =>
  `from: ${r.from ? fmtDate(r.from) : "null"} | to: ${r.to ? fmtDate(r.to) : "null"}`;
