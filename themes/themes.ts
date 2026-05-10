/**
 * token keys map directly to CSS variable suffixes: --c-{key}
 * accent=a, backdrop=b, highlight=h, tone=t, text=c, stroke=s, shadow=x, disabled=d, weekend=we, range=r, error=e
 */
export type ThemeTokens = {
  accent: string;
  backdrop: string;
  highlight: string;
  tone: string;
  text: string;
  stroke: string;
  shadow: string;
  disabled: string;
  weekend: string;
  range: string;
  error: string;
};

export const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  accent:   "--c-a",
  backdrop: "--c-b",
  highlight:"--c-h",
  tone:     "--c-t",
  text:     "--c-c",
  stroke:   "--c-s",
  shadow:   "--c-x",
  disabled: "--c-d",
  weekend:  "--c-we",
  range:    "--c-r",
  error:    "--c-e",
};

const W = "#ffffff";
const RE = "#e32825";

export const THEMES_DATA: Record<string, ThemeTokens> = {
  industrial: { accent: W,         backdrop: "#111111", highlight: "#e85d00", tone: "#1c1c1c",  text: "#d4d4d4", stroke: "#2a2a2a", shadow: "#e85d0030", disabled: "#505050", weekend: "#ff7043", range: "#f1c40f", error: "#ef4444" },
  graphite:   { accent: W,         backdrop: "#f7f8f9", highlight: "#f1a01d", tone: "#eeeff1",  text: "#1a1a1a", stroke: "#e2e4e8", shadow: "#f1a01d1e", disabled: "#9aa0aa", weekend: RE,        range: "#4a90d9", error: "#dc2626" },
  crimson:    { accent: "#161111", backdrop: "#0d0909", highlight: "#f92f2f", tone: "#3a1616",  text: W,         stroke: "#2b1a1a", shadow: "#f92f2f2c", disabled: "#5a3535", weekend: "#ff6b6b", range: "#ff9800", error: "#fbbf24" },
  amethyst:   { accent: W,         backdrop: "#f5f3f7", highlight: "#681c9e", tone: "#ebdff4",  text: "#2b2533", stroke: "#ddd5e6", shadow: "#681c9e22", disabled: "#b0a0be", weekend: RE,        range: "#2196f3", error: "#dc2626" },
  cyber:      { accent: "#0d0d15", backdrop: "#07070b", highlight: "#00f3ff", tone: "#301649",  text: W,         stroke: "#303050", shadow: "#00f3ff2c", disabled: "#282840", weekend: "#e040fb", range: "#ff6d00", error: "#ff1744" },
  espresso:   { accent: "#f8f0f4", backdrop: "#0c0608", highlight: "#a05878", tone: "#1e0e14",  text: "#e8c8d4", stroke: "#341424", shadow: "#a0587828", disabled: "#2e1020",  weekend: "#c07028", range: "#4a90d9", error: "#ff6b6b" },
  ember:      { accent: "#fdf8e8", backdrop: "#0e0b04", highlight: "#c89020", tone: "#1e1808",  text: "#f0d878", stroke: "#342a08", shadow: "#c8902028", disabled: "#2e2208",  weekend: "#c04e2f", range: "#558b2f", error: "#ff6b6b" },
  phosphor:   { accent: "#020602", backdrop: "#010401", highlight: "#76ff03", tone: "#1a1f1a",  text: "#00e676", stroke: "#1a4428", shadow: "#76ff0328", disabled: "#1a4020", weekend: "#ff6d00", range: "#00bcd4", error: "#ff5252" },
  midnight:   { accent: "#141721", backdrop: "#1a1e2b", highlight: "#3559e0", tone: "#212638",  text: W,         stroke: "#444b68", shadow: "#3559e02c", disabled: "#3a4060", weekend: RE,        range: "#00bcd4", error: "#ef4444" },
  sandstone:  { accent: "#1c1a17", backdrop: "#1f1c18", highlight: "#e3ae5c", tone: "#2f2b24",  text: "#fdfbf7", stroke: "#5d5448", shadow: "#e3ae5c24", disabled: "#504840", weekend: RE,        range: "#8bc34a", error: "#ff6b6b" },
  mint:       { accent: W,         backdrop: "#f8f9fc", highlight: "#60d276", tone: "#eaedf4",  text: "#171827", stroke: "#b8c0d1", shadow: "#60d27620", disabled: "#8898aa", weekend: RE,        range: "#7c4dff", error: "#dc2626" },
  rosa:       { accent: W,         backdrop: "#fef0f4", highlight: "#d64c7f", tone: "#fce4ed",  text: "#2a1520", stroke: "#f0b8cc", shadow: "#d64c7f28", disabled: "#c09aaa", weekend: "#ff6b95", range: "#8e44ad", error: "#b91c1c" },
  snow:       { accent: W,         backdrop: "#e2e5e9", highlight: "#3a60d6", tone: "#eceff4",  text: "#212630", stroke: "#acb9cb", shadow: "#3a60d624", disabled: "#8898a8", weekend: RE,        range: "#26c6da", error: "#dc2626" },
  solar:      { accent: W,         backdrop: "#fffbe8", highlight: "#e67e22", tone: "#fff3c4",  text: "#1e1a08", stroke: "#d4aa5a", shadow: "#e67e2224", disabled: "#b09060", weekend: "#f59e0b", range: "#27ae60", error: "#dc2626" },
  dracula:    { accent: "#1a0f0f", backdrop: "#1c1111", highlight: "#ff5e5e", tone: "#341d1d",  text: W,         stroke: "#614040", shadow: "#ff5e5e2c", disabled: "#583535", weekend: "#ff6b6b", range: "#ffd740", error: "#fbbf24" },
  comfy:      { accent: W,         backdrop: "#f2e8e0", highlight: "#c04e2f", tone: "#fdddd0",  text: "#6e4531", stroke: "#d4b0a0", shadow: "#c04e2f28", disabled: "#b08878", weekend: "#d96040", range: "#558b2f", error: "#dc2626" },
  neon:       { accent: "#fcfcf5", backdrop: "#f7f8f9", highlight: "#80ec27", tone: "#e9f3eb",  text: "#1f2937", stroke: "#bed3c3", shadow: "#80ec2722", disabled: "#8a9a88", weekend: RE,        range: "#ff6b35", error: "#dc2626" },
  temporal:   { accent: "#122127", backdrop: "#14252e", highlight: "#27d1f4", tone: "#242f52",  text: "#f1f5f9", stroke: "#6366f1", shadow: "#27d1f42e", disabled: "#3a4870", weekend: "#f472b6", range: "#fb923c", error: "#ef4444" },
  latte:      { accent: W,         backdrop: "#faf8f4", highlight: "#6f3d18", tone: "#f2eddf",  text: "#1a1208", stroke: "#d8c8a8", shadow: "#6f3d1826", disabled: "#9e8f78", weekend: "#c07a38", range: "#4a90d9", error: "#dc2626" },
  prism:      { accent: "#0a1525", backdrop: "#f0f9ff", highlight: "#0ea5e9", tone: "#e0f2fe",  text: "#0c2340", stroke: "#bae6fd", shadow: "#0ea5e920", disabled: "#90c4d8",  weekend: "#7c3aed", range: "#06b6d4", error: "#dc2626" },
  meadow:     { accent: "#071a10", backdrop: "#f2faf7", highlight: "#059669", tone: "#d1fae5",  text: "#052e16", stroke: "#a7f3d0", shadow: "#05966920", disabled: "#6ee7b7",  weekend: "#f43f5e", range: "#0ea5e9", error: "#dc2626" },
  forest:     { accent: "#0c1a10", backdrop: "#0f2016", highlight: "#4ade80", tone: "#162b1e",  text: "#e2f5e8", stroke: "#255038", shadow: "#4ade8028", disabled: "#1d3c2a", weekend: "#86efac", range: "#fb923c", error: "#ef4444" },
  nebula:     { accent: "#090812", backdrop: "#0b0a16", highlight: "#b388ff", tone: "#18103a",  text: "#ede7f6", stroke: "#3d2f70", shadow: "#b388ff28", disabled: "#3a2d60", weekend: "#ff8a65", range: "#29b6f6", error: "#ff5252" },
  aurora:     { accent: "#07091a", backdrop: "#0b0e24", highlight: "#3de0a0", tone: "#131838",  text: "#e0f9f0", stroke: "#2a1f5a", shadow: "#3de0a028", disabled: "#2d3560", weekend: "#ff5fa2", range: "#00d4f5", error: "#ff5252" },
  slate:      { accent: W,         backdrop: "#f1f5f9", highlight: "#475569", tone: "#e2e8f0",  text: "#0f172a", stroke: "#cbd5e1", shadow: "#47556920", disabled: "#94a3b8", weekend: RE,        range: "#0ea5e9", error: "#dc2626" },
  scarlet:    { accent: W,         backdrop: "#fff5f5", highlight: "#d92121", tone: "#ffe4e4",  text: "#1c0808", stroke: "#f4b4b4", shadow: "#d9212124", disabled: "#c89898", weekend: "#ff6b6b", range: "#ff9800", error: "#7f1d1d" },
  monsoon:    { accent: W,         backdrop: "#d5ded9", highlight: "#244a3d", tone: "#bfcdc5",  text: "#0a1a14", stroke: "#9aaea3", shadow: "#244a3d28", disabled: "#6a8078", weekend: "#c45e38", range: "#3c7e95", error: "#dc2626" },
  pearl:      { accent: W,         backdrop: "#ecebed", highlight: "#3a2a42", tone: "#dedce0",  text: "#1f1624", stroke: "#c6c3ca", shadow: "#3a2a4226", disabled: "#9994a0", weekend: "#b14464", range: "#7b6d88", error: "#b91c1c" },
  chalk:      { accent: W,         backdrop: "#f0f0f3", highlight: "#2a2e5c", tone: "#e2e2e8",  text: "#0e1028", stroke: "#cbcbd4", shadow: "#2a2e5c22", disabled: "#999cab", weekend: "#c03554", range: "#5866a8", error: "#dc2626" },
  split:      { accent: W,         backdrop: "#fafaf6", highlight: "#e8c43d", tone: "#f2f0ea",  text: "#1a1f2a", stroke: "#d4d0c4", shadow: "#e8c43d28", disabled: "#b5b0a4", weekend: "#3d9ee8", range: "#e83d9e", error: "#dc2626" },
  riso:       { accent: "#fef7e8", backdrop: "#fef7e8", highlight: "#2b3fe0", tone: "#fdebf3",  text: "#1a1205", stroke: "#e5dcc8", shadow: "#2b3fe028", disabled: "#b8ab8c", weekend: "#ff3e8e", range: "#2bce8b", error: "#dc2626" },
  flare:      { accent: "#0e0e10", backdrop: "#141417", highlight: "#8a8a92", tone: "#1e1e22",  text: "#e8e8ec", stroke: "#2a2a30", shadow: "#8a8a9220", disabled: "#4a4a52", weekend: "#ff6028", range: "#3a3a40", error: "#ff5252" },
  abyss:      { accent: "#09010e", backdrop: "#060009", highlight: "#d400f0", tone: "#1c0030",  text: "#f0d0ff", stroke: "#2e0050", shadow: "#d400f028", disabled: "#2a0040", weekend: "#00ffee", range: "#ff6b35", error: "#ff1744" },
  cobalt:     { accent: "#e6f0ff", backdrop: "#061323", highlight: "#2563eb", tone: "#0d1f3a",  text: "#d8e8ff", stroke: "#173b72", shadow: "#2563eb2a", disabled: "#274260", weekend: "#ffb703", range: "#00c2a8", error: "#ff4d6d" },
  velvet:     { accent: "#fff0f8", backdrop: "#120711", highlight: "#ff4da6", tone: "#261127",  text: "#f9d8ea", stroke: "#4a2246", shadow: "#ff4da628", disabled: "#3b2339", weekend: "#ffc857", range: "#6ee7f9", error: "#ff6b6b" },
  eclipse:    { accent: "#f4ffd8", backdrop: "#080d09", highlight: "#b7e000", tone: "#141a12",  text: "#e9f2c7", stroke: "#304024", shadow: "#b7e00024", disabled: "#3b442e", weekend: "#ff5d8f", range: "#a78bfa", error: "#ff3d68" },
};
