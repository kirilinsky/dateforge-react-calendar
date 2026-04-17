/**
 * token keys map directly to CSS variable suffixes: --c-{key}
 * accent=a, backdrop=b, highlight=h, tone=t, text=c, stroke=s, shadow=x, disabled=d, weekend=we, range=r
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
};

const W = "#ffffff";
const RE = "#e53935";

export const THEMES_DATA: Record<string, ThemeTokens> = {
  industrial: { accent: W,         backdrop: "#111111", highlight: "#e85d00", tone: "#1c1c1c",  text: "#d4d4d4", stroke: "#2a2a2a", shadow: "#e85d0030", disabled: "#505050", weekend: "#ff7043", range: "#f1c40f" },
  graphite:   { accent: W,         backdrop: "#f7f8f9", highlight: "#f1a01d", tone: "#eeeff1",  text: "#1a1a1a", stroke: "#e2e4e8", shadow: "#f1a01d1e", disabled: "#9aa0aa", weekend: RE,        range: "#4a90d9" },
  crimson:    { accent: "#161111", backdrop: "#0d0909", highlight: "#f92f2f", tone: "#3a1616",  text: W,         stroke: "#2b1a1a", shadow: "#f92f2f2c", disabled: "#5a3535", weekend: "#ff6b6b", range: "#ff9800" },
  amethyst:   { accent: W,         backdrop: "#f5f3f7", highlight: "#681c9e", tone: "#ebdff4",  text: "#2b2533", stroke: "#ddd5e6", shadow: "#681c9e22", disabled: "#b0a0be", weekend: RE,        range: "#2196f3" },
  cyber:      { accent: "#0d0d15", backdrop: "#07070b", highlight: "#00f3ff", tone: "#301649",  text: W,         stroke: "#303050", shadow: "#00f3ff2c", disabled: "#282840", weekend: "#e040fb", range: "#ff6d00" },
  phosphor:   { accent: "#020602", backdrop: "#010401", highlight: "#76ff03", tone: "#1a1f1a",  text: "#00e676", stroke: "#1a4428", shadow: "#76ff0328", disabled: "#1a4020", weekend: "#ff6d00", range: "#00bcd4" },
  midnight:   { accent: "#141721", backdrop: "#1a1e2b", highlight: "#3559e0", tone: "#212638",  text: W,         stroke: "#444b68", shadow: "#3559e02c", disabled: "#3a4060", weekend: RE,        range: "#00bcd4" },
  sandstone:  { accent: "#1c1a17", backdrop: "#1f1c18", highlight: "#e3ae5c", tone: "#2f2b24",  text: "#fdfbf7", stroke: "#5d5448", shadow: "#e3ae5c24", disabled: "#504840", weekend: RE,        range: "#8bc34a" },
  mint:       { accent: W,         backdrop: "#f8f9fc", highlight: "#60d276", tone: "#eaedf4",  text: "#171827", stroke: "#b8c0d1", shadow: "#60d27620", disabled: "#8898aa", weekend: RE,        range: "#7c4dff" },
  rosa:       { accent: W,         backdrop: "#fef0f4", highlight: "#d64c7f", tone: "#fce4ed",  text: "#2a1520", stroke: "#f0b8cc", shadow: "#d64c7f28", disabled: "#c09aaa", weekend: "#ff6b95", range: "#8e44ad" },
  snow:       { accent: W,         backdrop: "#e2e5e9", highlight: "#3a60d6", tone: "#eceff4",  text: "#212630", stroke: "#acb9cb", shadow: "#3a60d624", disabled: "#8898a8", weekend: RE,        range: "#26c6da" },
  solar:      { accent: W,         backdrop: "#fffbe8", highlight: "#e67e22", tone: "#fff3c4",  text: "#1e1a08", stroke: "#d4aa5a", shadow: "#e67e2224", disabled: "#b09060", weekend: "#f59e0b", range: "#27ae60" },
  dracula:    { accent: "#1a0f0f", backdrop: "#1c1111", highlight: "#ff5e5e", tone: "#341d1d",  text: W,         stroke: "#614040", shadow: "#ff5e5e2c", disabled: "#583535", weekend: "#ff6b6b", range: "#ffd740" },
  comfy:      { accent: W,         backdrop: "#f2e8e0", highlight: "#c04e2f", tone: "#fdddd0",  text: "#6e4531", stroke: "#d4b0a0", shadow: "#c04e2f28", disabled: "#b08878", weekend: "#d96040", range: "#558b2f" },
  neon:       { accent: "#fcfcf5", backdrop: "#f7f8f9", highlight: "#80ec27", tone: "#e9f3eb",  text: "#1f2937", stroke: "#bed3c3", shadow: "#80ec2722", disabled: "#8a9a88", weekend: RE,        range: "#ff6b35" },
  temporal:   { accent: "#122127", backdrop: "#14252e", highlight: "#27d1f4", tone: "#242f52",  text: "#f1f5f9", stroke: "#6366f1", shadow: "#27d1f42e", disabled: "#3a4870", weekend: "#f472b6", range: "#fb923c" },
  latte:      { accent: W,         backdrop: "#faf8f4", highlight: "#6f3d18", tone: "#f2eddf",  text: "#1a1208", stroke: "#d8c8a8", shadow: "#6f3d1826", disabled: "#9e8f78", weekend: "#c07a38", range: "#4a90d9" },
  forest:     { accent: "#0c1a10", backdrop: "#0f2016", highlight: "#4ade80", tone: "#162b1e",  text: "#e2f5e8", stroke: "#255038", shadow: "#4ade8028", disabled: "#1d3c2a", weekend: "#86efac", range: "#fb923c" },
  nebula:     { accent: "#090812", backdrop: "#0b0a16", highlight: "#b388ff", tone: "#18103a",  text: "#ede7f6", stroke: "#3d2f70", shadow: "#b388ff28", disabled: "#3a2d60", weekend: "#ff8a65", range: "#29b6f6" },
  aurora:     { accent: "#07091a", backdrop: "#0b0e24", highlight: "#3de0a0", tone: "#131838",  text: "#e0f9f0", stroke: "#2a1f5a", shadow: "#3de0a028", disabled: "#2d3560", weekend: "#ff5fa2", range: "#00d4f5" },
  slate:      { accent: W,         backdrop: "#f1f5f9", highlight: "#475569", tone: "#e2e8f0",  text: "#0f172a", stroke: "#cbd5e1", shadow: "#47556920", disabled: "#94a3b8", weekend: RE,        range: "#0ea5e9" },
  scarlet:    { accent: W,         backdrop: "#fff5f5", highlight: "#d92121", tone: "#ffe4e4",  text: "#1c0808", stroke: "#f4b4b4", shadow: "#d9212124", disabled: "#c89898", weekend: "#ff6b6b", range: "#ff9800" },
};
