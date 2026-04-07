/**
 * CSS variable suffixes (--c-*). Order MUST strictly match THEMES_DATA arrays.
 * a: accent | b: backdrop | h: highlight | t: tone | c: text | s: stroke | x: shadow | d: disabled | we: weekend | r: range/holiday
 */
export const THEME_MAP = [
  "a",
  "b",
  "h",
  "t",
  "c",
  "s",
  "x",
  "d",
  "we",
  "r",
] as const;

const W = "#ffffff";
const B = "#1a1a1c";
const G = "#f0f0f0";
const OR = "#e85d00";
const IB = "#111111";
const IS = "#d4d4d4";
const GA = "#f1a01d";
const RE = "#e53935";

export const THEMES_DATA: Record<string, string[]> = {
  //                 a       b         h          t          c          s          x            d          we         r
  paper:     [W,  W,        B,        "#f4f4f4",  B,        "#e8e8e8", "#1a1a1c14", "#a0a0a2", RE,        "#4a90d9"],
  carbon:    [B,  B,        W,        "#2d2d2d",  G,        "#333333", "#ffffff16", "#555558", RE,        "#4a90d9"],
  industrial:[W,  IB,       OR,       "#1c1c1c",  IS,       "#2a2a2a", "#e85d0030", "#505050", "#ff7043", "#f1c40f"],
  graphite:  [W,  "#f7f8f9",GA,       "#eeeff1",  "#1a1a1a","#e2e4e8", "#f1a01d1e", "#9aa0aa", RE,        "#4a90d9"],
  crimson:   ["#161111","#0d0909","#f92f2f","#3a1616",W,"#2b1a1a","#f92f2f2c","#5a3535","#ff6b6b","#ff9800"],
  amethyst:  [W,  "#f5f3f7","#681c9e","#ebdff4",  "#2b2533","#ddd5e6", "#681c9e22", "#b0a0be", RE,        "#2196f3"],
  cyber:     ["#0d0d15","#07070b","#00f3ff","#301649",W,"#303050","#00f3ff2c","#282840","#e040fb","#ff6d00"],
  phosphor:  ["#020602","#010401","#76ff03","#1a1f1a","#00e676","#1a4428","#76ff0328","#1a4020","#ff6d00","#00bcd4"],
  midnight:  ["#141721","#1a1e2b","#3559e0","#212638",W,"#444b68","#3559e02c","#3a4060",RE,"#00bcd4"],
  sandstone: ["#1c1a17","#1f1c18","#e3ae5c","#2f2b24","#fdfbf7","#5d5448","#e3ae5c24","#504840",RE,"#8bc34a"],
  mint:      [W,  "#f8f9fc","#60d276","#eaedf4",  "#171827","#b8c0d1", "#60d27620",  "#8898aa", RE,        "#7c4dff"],
  rosa:      [W,  "#fef0f4","#d64c7f","#fce4ed",  "#2a1520","#f0b8cc", "#d64c7f28",  "#c09aaa", "#ff6b95", "#8e44ad"],
  snow:      [W,  "#e2e5e9","#3a60d6","#eceff4",  "#212630","#acb9cb", "#3a60d624",  "#8898a8", RE,        "#26c6da"],
  solar:     [W,  "#fffbe8","#e67e22","#fff3c4",  "#1e1a08","#d4aa5a", "#e67e2224",  "#b09060", "#f59e0b", "#27ae60"],
  dracula:   ["#1a0f0f","#1c1111","#ff5e5e","#341d1d",W,"#614040","#ff5e5e2c","#583535","#ff6b6b","#ffd740"],
  comfy:     [W,  "#f2e8e0","#c04e2f","#fdddd0",  "#6e4531","#d4b0a0", "#c04e2f28",  "#b08878", "#d96040", "#558b2f"],
  neon:      ["#fcfcf5","#f7f8f9","#80ec27","#e9f3eb","#1f2937","#bed3c3","#80ec2722","#8a9a88",RE,"#ff6b35"],
  temporal:  ["#122127","#14252e","#27d1f4","#242f52","#f1f5f9","#6366f1","#27d1f42e","#3a4870","#f472b6","#fb923c"],
  latte:     [W,  "#faf8f4","#6f3d18","#f2eddf",  "#1a1208","#d8c8a8", "#6f3d1826",  "#9e8f78", "#c07a38", "#4a90d9"],
  forest:    ["#0c1a10","#0f2016","#4ade80","#162b1e","#e2f5e8","#255038","#4ade8028","#1d3c2a","#86efac","#fb923c"],
};
