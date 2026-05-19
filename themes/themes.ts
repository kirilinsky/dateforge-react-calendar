/**
 * token keys map directly to CSS variable suffixes: --c-{key}
 * accent=a, activeText=at, todayDot=t-d, backdrop=b, highlight=h, tone=t, text=c, stroke=s, shadow=x, disabled=d,
 * mutedText=m, disabledText=dt, weekend=we, range=r, error=e, outOfMonth=oom
 */
export type ThemeTokens = {
  accent: string;
  activeText: string;
  todayDot: string;
  backdrop: string;
  highlight: string;
  tone: string;
  text: string;
  stroke: string;
  shadow: string;
  disabled: string;
  mutedText: string;
  disabledText: string;
  weekend: string;
  range: string;
  error: string;
  outOfMonth?: string;
};

export const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  accent:      "--c-a",
  activeText:  "--c-at",
  todayDot:    "--c-t-d",
  backdrop:    "--c-b",
  highlight:   "--c-h",
  tone:        "--c-t",
  text:        "--c-c",
  stroke:      "--c-s",
  shadow:      "--c-x",
  disabled:    "--c-d",
  mutedText:   "--c-m",
  disabledText:"--c-dt",
  weekend:     "--c-we",
  range:       "--c-r",
  error:       "--c-e",
  outOfMonth:  "--c-oom",
};

const W = "#ffffff";
const RE = "#c62828";

export const THEMES_DATA: Record<string, ThemeTokens> = {
  industrial: { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#111111", highlight: "#e85d00", tone: "#1c1c1c",  text: "#d4d4d4", stroke: "#2a2a2a", shadow: "#e85d0030", disabled: "#505050", mutedText: "#868686", disabledText: "#8c8c8c", weekend: "#ff7043", range: "#f1c40f", error: "#ef4444", outOfMonth: "#8c8c8c" },
  graphite:   { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#f7f8f9", highlight: "#f1a01d", tone: "#eeeff1",  text: "#1a1a1a", stroke: "#e2e4e8", shadow: "#f1a01d1e", disabled: "#9aa0aa", mutedText: "#6a6b6b", disabledText: "#656566", weekend: RE,        range: "#4a90d9", error: "#dc2626", outOfMonth: "#656566" },
  crimson:    { accent: "#161111", activeText: "#0d0909", todayDot: "#0d0909", backdrop: "#0d0909", highlight: "#f92f2f", tone: "#3a1616",  text: W,         stroke: "#2b1a1a", shadow: "#f92f2f2c", disabled: "#5a3535", mutedText: "#8b8989", disabledText: "#929090", weekend: "#ff6b6b", range: "#ff9800", error: "#fbbf24", outOfMonth: "#929090" },
  amethyst:   { accent: W,         activeText: W, todayDot: W,         backdrop: "#f5f3f7", highlight: "#681c9e", tone: "#ebdff4",  text: "#2b2533", stroke: "#ddd5e6", shadow: "#681c9e22", disabled: "#b0a0be", mutedText: "#67626d", disabledText: "#615c68", weekend: "#b91c1c", range: "#2196f3", error: "#dc2626", outOfMonth: "#615c68" },
  cyber:      { accent: "#0d0d15", activeText: "#07070b", todayDot: "#07070b", backdrop: "#07070b", highlight: "#00f3ff", tone: "#301649",  text: W,         stroke: "#303050", shadow: "#00f3ff2c", disabled: "#282840", mutedText: "#8c8c8d", disabledText: "#929294", weekend: "#e040fb", range: "#ff6d00", error: "#ff1744", outOfMonth: "#929294" },
  espresso:   { accent: "#f8f0f4", activeText: W, todayDot: W,         backdrop: "#0c0608", highlight: "#a05878", tone: "#1e0e14",  text: "#e8c8d4", stroke: "#341424", shadow: "#a0587828", disabled: "#2e1020",  mutedText: "#8f7981", disabledText: "#967f88", weekend: "#c07028", range: "#4a90d9", error: "#ff6b6b", outOfMonth: "#967f88" },
  ember:      { accent: "#fdf8e8", activeText: "#0e0b04", todayDot: "#0e0b04", backdrop: "#0e0b04", highlight: "#c89020", tone: "#1e1808",  text: "#f0d878", stroke: "#342a08", shadow: "#c8902028", disabled: "#2e2208",  mutedText: "#928348", disabledText: "#99894b", weekend: "#ff8a50", range: "#558b2f", error: "#ff6b6b", outOfMonth: "#99894b" },
  phosphor:   { accent: "#020602", activeText: "#010401", todayDot: "#010401", backdrop: "#010401", highlight: "#76ff03", tone: "#1a1f1a",  text: "#00e676", stroke: "#1a4428", shadow: "#76ff0328", disabled: "#1a4020", mutedText: "#009b4f", disabledText: "#00a353", weekend: "#ff6d00", range: "#00bcd4", error: "#ff5252", outOfMonth: "#00a353" },
  midnight:   { accent: "#141721", activeText: W, todayDot: W,         backdrop: "#1a1e2b", highlight: "#3559e0", tone: "#212638",  text: W,         stroke: "#444b68", shadow: "#3559e02c", disabled: "#3a4060", mutedText: "#8d8f96", disabledText: "#94969c", weekend: "#ff6b6b", range: "#00bcd4", error: "#ef4444", outOfMonth: "#94969c" },
  sandstone:  { accent: "#1c1a17", activeText: "#111111", todayDot: "#111111", backdrop: "#1f1c18", highlight: "#e3ae5c", tone: "#2f2b24",  text: "#fdfbf7", stroke: "#5d5448", shadow: "#e3ae5c24", disabled: "#504840", mutedText: "#969490", disabledText: "#9d9b97", weekend: "#ff7a59", range: "#8bc34a", error: "#ff6b6b", outOfMonth: "#9d9b97" },
  mint:       { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#f8f9fc", highlight: "#60d276", tone: "#eaedf4",  text: "#171827", stroke: "#b8c0d1", shadow: "#60d27620", disabled: "#8898aa", mutedText: "#686974", disabledText: "#62636e", weekend: RE,        range: "#7c4dff", error: "#dc2626", outOfMonth: "#62636e" },
  tide:       { accent: W,         activeText: "#062b2f", todayDot: "#062b2f", backdrop: "#f0fdff", highlight: "#14b8a6", tone: "#dff7f8",  text: "#082f36", stroke: "#a7e3e6", shadow: "#14b8a620", disabled: "#84bfc4", mutedText: "#4f6f75", disabledText: "#4a686e", weekend: "#b91c1c", range: "#0ea5e9", error: "#dc2626", outOfMonth: "#4a686e" },
  rosa:       { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#fef0f4", highlight: "#d64c7f", tone: "#fce4ed",  text: "#2a1520", stroke: "#f0b8cc", shadow: "#d64c7f28", disabled: "#c09aaa", mutedText: "#75636b", disabledText: "#705d66", weekend: "#be123c", range: "#8e44ad", error: "#b91c1c", outOfMonth: "#705d66" },
  snow:       { accent: W,         activeText: W, todayDot: W,         backdrop: "#e2e5e9", highlight: "#3a60d6", tone: "#eceff4",  text: "#212630", stroke: "#acb9cb", shadow: "#3a60d624", disabled: "#8898a8", mutedText: "#60656d", disabledText: "#5b5f68", weekend: "#b91c1c", range: "#26c6da", error: "#dc2626", outOfMonth: "#5b5f68" },
  solar:      { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#fffbe8", highlight: "#e67e22", tone: "#fff3c4",  text: "#1e1a08", stroke: "#d4aa5a", shadow: "#e67e2224", disabled: "#b09060", mutedText: "#716d5b", disabledText: "#6c6855", weekend: "#9a3412", range: "#27ae60", error: "#dc2626", outOfMonth: "#6c6855" },
  dracula:    { accent: "#1a0f0f", activeText: "#111111", todayDot: "#111111", backdrop: "#1c1111", highlight: "#ff5e5e", tone: "#341d1d",  text: W,         stroke: "#614040", shadow: "#ff5e5e2c", disabled: "#583535", mutedText: "#908b8b", disabledText: "#969191", weekend: "#ff6b6b", range: "#ffd740", error: "#fbbf24", outOfMonth: "#969191" },
  comfy:      { accent: W,         activeText: W, todayDot: W,         backdrop: "#f2e8e0", highlight: "#c04e2f", tone: "#fdddd0",  text: "#6e4531", stroke: "#d4b0a0", shadow: "#c04e2f28", disabled: "#b08878", mutedText: "#805c49", disabledText: "#7c5643", weekend: "#8f2f1f", range: "#558b2f", error: "#dc2626", outOfMonth: "#7c5643" },
  neon:       { accent: "#fcfcf5", activeText: "#111111", todayDot: "#111111", backdrop: "#f7f8f9", highlight: "#80ec27", tone: "#e9f3eb",  text: "#1f2937", stroke: "#bed3c3", shadow: "#80ec2722", disabled: "#8a9a88", mutedText: "#656c76", disabledText: "#5f6771", weekend: RE,        range: "#ff6b35", error: "#dc2626", outOfMonth: "#5f6771" },
  temporal:   { accent: "#122127", activeText: "#111111", todayDot: "#111111", backdrop: "#14252e", highlight: "#27d1f4", tone: "#242f52",  text: "#f1f5f9", stroke: "#6366f1", shadow: "#27d1f42e", disabled: "#3a4870", mutedText: "#929ba2", disabledText: "#99a2a8", weekend: "#f472b6", range: "#fb923c", error: "#ef4444", outOfMonth: "#99a2a8" },
  latte:      { accent: W,         activeText: W, todayDot: W,         backdrop: "#faf8f4", highlight: "#6f3d18", tone: "#f2eddf",  text: "#1a1208", stroke: "#d8c8a8", shadow: "#6f3d1826", disabled: "#9e8f78", mutedText: "#6f6961", disabledText: "#69635b", weekend: "#7c3f12", range: "#4a90d9", error: "#dc2626", outOfMonth: "#69635b" },
  prism:      { accent: "#0a1525", activeText: "#111111", todayDot: "#111111", backdrop: "#f0f9ff", highlight: "#0ea5e9", tone: "#e0f2fe",  text: "#0c2340", stroke: "#bae6fd", shadow: "#0ea5e920", disabled: "#90c4d8",  mutedText: "#5b6d82", disabledText: "#55677d", weekend: "#7c3aed", range: "#06b6d4", error: "#dc2626", outOfMonth: "#55677d" },
  meadow:     { accent: "#071a10", activeText: "#111111", todayDot: "#111111", backdrop: "#f2faf7", highlight: "#059669", tone: "#d1fae5",  text: "#052e16", stroke: "#a7f3d0", shadow: "#05966920", disabled: "#6ee7b7",  mutedText: "#547261", disabledText: "#4e6d5c", weekend: "#be123c", range: "#0ea5e9", error: "#dc2626", outOfMonth: "#4e6d5c" },
  forest:     { accent: "#0c1a10", activeText: "#111111", todayDot: "#111111", backdrop: "#0f2016", highlight: "#4ade80", tone: "#162b1e",  text: "#e2f5e8", stroke: "#255038", shadow: "#4ade8028", disabled: "#1d3c2a", mutedText: "#819488", disabledText: "#889a8e", weekend: "#86efac", range: "#fb923c", error: "#ef4444", outOfMonth: "#889a8e" },
  nebula:     { accent: "#090812", activeText: "#090812", todayDot: "#090812", backdrop: "#0b0a16", highlight: "#b388ff", tone: "#18103a",  text: "#ede7f6", stroke: "#3d2f70", shadow: "#b388ff28", disabled: "#3a2d60", mutedText: "#84808e", disabledText: "#8a8694", weekend: "#ff8a65", range: "#29b6f6", error: "#ff5252", outOfMonth: "#8a8694" },
  aurora:     { accent: "#07091a", activeText: "#07091a", todayDot: "#07091a", backdrop: "#0b0e24", highlight: "#3de0a0", tone: "#131838",  text: "#e0f9f0", stroke: "#2a1f5a", shadow: "#3de0a028", disabled: "#2d3560", mutedText: "#79878d", disabledText: "#7e8d92", weekend: "#ff5fa2", range: "#00d4f5", error: "#ff5252", outOfMonth: "#7e8d92" },
  slate:      { accent: W,         activeText: W, todayDot: W,         backdrop: "#f1f5f9", highlight: "#475569", tone: "#e2e8f0",  text: "#0f172a", stroke: "#cbd5e1", shadow: "#47556920", disabled: "#94a3b8", mutedText: "#606674", disabledText: "#5a616f", weekend: RE,        range: "#0ea5e9", error: "#dc2626", outOfMonth: "#5a616f" },
  scarlet:    { accent: W,         activeText: W, todayDot: W,         backdrop: "#fff5f5", highlight: "#d92121", tone: "#ffe4e4",  text: "#1c0808", stroke: "#f4b4b4", shadow: "#d9212124", disabled: "#c89898", mutedText: "#746464", disabledText: "#6f5f5f", weekend: "#b91c1c", range: "#ff9800", error: "#7f1d1d", outOfMonth: "#6f5f5f" },
  monsoon:    { accent: W,         activeText: W, todayDot: W,         backdrop: "#d5ded9", highlight: "#244a3d", tone: "#bfcdc5",  text: "#0a1a14", stroke: "#9aaea3", shadow: "#244a3d28", disabled: "#6a8078", mutedText: "#495651", disabledText: "#43514b", weekend: "#7c2d12", range: "#3c7e95", error: "#dc2626", outOfMonth: "#43514b" },
  pearl:      { accent: W,         activeText: W, todayDot: W,         backdrop: "#ecebed", highlight: "#3a2a42", tone: "#dedce0",  text: "#1f1624", stroke: "#c6c3ca", shadow: "#3a2a4226", disabled: "#9994a0", mutedText: "#645d67", disabledText: "#5e5862", weekend: "#9f3150", range: "#7b6d88", error: "#b91c1c", outOfMonth: "#5e5862" },
  chalk:      { accent: W,         activeText: W, todayDot: W,         backdrop: "#f0f0f3", highlight: "#2a2e5c", tone: "#e2e2e8",  text: "#0e1028", stroke: "#cbcbd4", shadow: "#2a2e5c22", disabled: "#999cab", mutedText: "#616272", disabledText: "#5b5d6d", weekend: "#a92847", range: "#5866a8", error: "#dc2626", outOfMonth: "#5b5d6d" },
  split:      { accent: W,         activeText: "#111111", todayDot: "#111111", backdrop: "#fafaf6", highlight: "#e8c43d", tone: "#f2f0ea",  text: "#1a1f2a", stroke: "#d4d0c4", shadow: "#e8c43d28", disabled: "#b5b0a4", mutedText: "#686c71", disabledText: "#63666c", weekend: "#1d4ed8", range: "#e83d9e", error: "#dc2626", outOfMonth: "#63666c" },
  riso:       { accent: "#fef7e8", activeText: W, todayDot: W,         backdrop: "#fef7e8", highlight: "#2b3fe0", tone: "#fdebf3",  text: "#1a1205", stroke: "#e5dcc8", shadow: "#2b3fe028", disabled: "#b8ab8c", mutedText: "#726a5d", disabledText: "#6c6557", weekend: "#be185d", range: "#2bce8b", error: "#dc2626", outOfMonth: "#6c6557" },
  flare:      { accent: "#0e0e10", activeText: "#0e0e10", todayDot: "#0e0e10", backdrop: "#141417", highlight: "#8a8a92", tone: "#1e1e22",  text: "#e8e8ec", stroke: "#2a2a30", shadow: "#8a8a9220", disabled: "#4a4a52", mutedText: "#87878b", disabledText: "#8d8d91", weekend: "#ff6028", range: "#3a3a40", error: "#ff5252", outOfMonth: "#8d8d91" },
  abyss:      { accent: "#09010e", activeText: "#060009", todayDot: "#060009", backdrop: "#060009", highlight: "#d400f0", tone: "#1c0030",  text: "#f0d0ff", stroke: "#2e0050", shadow: "#d400f028", disabled: "#2a0040", mutedText: "#8a7594", disabledText: "#917b9b", weekend: "#00ffee", range: "#ff6b35", error: "#ff1744", outOfMonth: "#917b9b" },
  cobalt:     { accent: "#e6f0ff", activeText: W, todayDot: W,         backdrop: "#061323", highlight: "#2563eb", tone: "#0d1f3a",  text: "#d8e8ff", stroke: "#173b72", shadow: "#2563eb2a", disabled: "#274260", mutedText: "#7b899d", disabledText: "#8190a4", weekend: "#ffb703", range: "#00c2a8", error: "#ff4d6d", outOfMonth: "#8190a4" },
  fjord:      { accent: "#eaf3f2", activeText: "#091113", todayDot: "#091113", backdrop: "#0e1416", highlight: "#2fa39b", tone: "#131c1f",  text: "#eaf3f2", stroke: "#223136", shadow: "#2fa39b26", disabled: "#5f6e6c", mutedText: "#8ea3a0", disabledText: "#788b88", weekend: "#d56d64", range: "#38b8ae", error: "#ff6b6b", outOfMonth: "#788b88" },
  velvet:     { accent: "#fff0f8", activeText: "#120711", todayDot: "#120711", backdrop: "#120711", highlight: "#ff4da6", tone: "#261127",  text: "#f9d8ea", stroke: "#4a2246", shadow: "#ff4da628", disabled: "#3b2339", mutedText: "#947d8b", disabledText: "#9b8391", weekend: "#ffc857", range: "#6ee7f9", error: "#ff6b6b", outOfMonth: "#9b8391" },
  eclipse:    { accent: "#f4ffd8", activeText: "#080d09", todayDot: "#080d09", backdrop: "#080d09", highlight: "#b7e000", tone: "#141a12",  text: "#e9f2c7", stroke: "#304024", shadow: "#b7e00024", disabled: "#3b442e", mutedText: "#7f866d", disabledText: "#858c72", weekend: "#ff5d8f", range: "#a78bfa", error: "#ff3d68", outOfMonth: "#858c72" },
  mono:       { accent: W,         activeText: W,         todayDot: W,         backdrop: W,         highlight: "#111111", tone: "#f5f5f5",  text: "#111111", stroke: "#e8e8e8", shadow: "#00000010", disabled: "#cccccc", mutedText: "#707070", disabledText: "#707070", weekend: "#111111", range: "#111111", error: "#cc0000", outOfMonth: "#707070" },
  noir:       { accent: "#111111", activeText: "#111111", todayDot: "#111111", backdrop: "#111111", highlight: W,         tone: "#1c1c1c",  text: "#e8e8e8", stroke: "#2a2a2a", shadow: "#ffffff08", disabled: "#444444", mutedText: "#858585", disabledText: "#858585", weekend: "#e8e8e8", range: "#e8e8e8", error: "#ff4444", outOfMonth: "#858585" },
atelier:    { accent: "#1a1c2a", activeText: "#ede2c2", todayDot: "#ede2c2", backdrop: "#ede2c2", highlight: "#1a1c2a", tone: "#e2d4ad",  text: "#1a1c2a", stroke: "#b29766", shadow: "#1a1c2a1c", disabled: "#c6b687", mutedText: "#4d4530", disabledText: "#5a4f30", weekend: "#971c14", range: "#d4a84a", error: "#9a1f17", outOfMonth: "#5a4f30" },
bauhaus:   { accent: "#d8d1b8", activeText: "#161420", todayDot: "#161420", backdrop: "#161420", highlight: "#d8d1b8", tone: "#21202e",  text: "#d8d1b8", stroke: "#363448", shadow: "#1614202a", disabled: "#2e2d3c", mutedText: "#9a98a8", disabledText: "#8a8898", weekend: "#ef6e58", range: "#5a7090", error: "#ff6b6b", outOfMonth: "#8a8898" },
};
