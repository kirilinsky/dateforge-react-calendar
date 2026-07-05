/**
 * Generates `src/styles/themes.css` from the v2 theme source of truth
 * (`src/styles/theme-source.ts`, 28 families with WCAG-checked light/dark companions).
 *
 * Each family becomes one `[data-theme="<name>"]` block in the `cal-themes`
 * layer, with every token emitted as `light-dark(light, dark)` — the active
 * side follows the root's `color-scheme` (the `scheme` prop), no JS, no
 * duplicated dark blocks.
 *
 * v2 → v3 key mapping (see src/styles/theme-tokens.ts for the rationale):
 *   highlight → accent, accent → focusRing, tone → tone, rest 1:1.
 *
 * Run: npx tsx scripts/generate-theme.ts  (wired into `npm run build`).
 */
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  THEME_FAMILIES_DATA,
  type ThemeTokens as V2ThemeTokens,
} from "../src/styles/theme-source";
import {
  TOKEN_TO_VAR,
  type ThemeTokens as V3ThemeTokens,
} from "../src/styles/theme-tokens";

const V2_TO_V3_KEY: Record<keyof V2ThemeTokens, keyof V3ThemeTokens> = {
  accent: "focusRing",
  activeText: "activeText",
  todayDot: "todayDot",
  backdrop: "backdrop",
  highlight: "accent",
  tone: "tone",
  text: "text",
  stroke: "stroke",
  shadow: "shadow",
  disabled: "disabled",
  mutedText: "mutedText",
  disabledText: "disabledText",
  weekend: "weekend",
  range: "range",
  error: "error",
  outOfMonth: "outOfMonth",
};

const V3_KEYS = Object.keys(TOKEN_TO_VAR) as (keyof V3ThemeTokens)[];

// todayDot is intentionally not emitted: the CSS defaults to var(--c-accent),
// which is legible on any backdrop. V2 todayDot values were derived for the
// accent surface (activeText semantics), making them invisible in dark mode.
const SKIP_V2_KEYS = new Set<keyof V2ThemeTokens>(["todayDot"]);

function remap(v2: V2ThemeTokens): Partial<V3ThemeTokens> {
  const out: Partial<V3ThemeTokens> = {};
  for (const [v2Key, v3Key] of Object.entries(V2_TO_V3_KEY) as [
    keyof V2ThemeTokens,
    keyof V3ThemeTokens,
  ][]) {
    if (SKIP_V2_KEYS.has(v2Key)) continue;
    const value = v2[v2Key];
    if (value != null) out[v3Key] = value;
  }
  return out;
}

const lines: string[] = [
  "/*",
  " * GENERATED — do not edit by hand. Run: npx tsx scripts/generate-theme.ts",
  " * Source: src/styles/theme-source.ts (THEME_FAMILIES_DATA).",
  " *",
  " * One block per family; tokens use light-dark() so the active side follows",
  " * the root color-scheme (scheme prop: light/dark force, auto = OS). Tokens",
  " * are registered as typed <color> properties in tokens.css, which makes",
  " * theme and scheme switches crossfade via the paint transitions.",
  " */",
  "@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;",
  "",
  "@layer cal-themes {",
];

const names = Object.keys(THEME_FAMILIES_DATA).sort();

for (const name of names) {
  const family = THEME_FAMILIES_DATA[name];
  const light = remap(family.light);
  const dark = remap(family.dark);
  lines.push(`  [data-theme="${name}"] {`);
  for (const key of V3_KEYS) {
    const l = light[key];
    const d = dark[key];
    if (l == null || d == null) continue;
    const value = l === d ? l : `light-dark(${l}, ${d})`;
    lines.push(`    ${TOKEN_TO_VAR[key]}: ${value};`);
  }
  lines.push("  }");
  lines.push("");
}

// Drop the trailing blank line inside the layer block.
lines.pop();
lines.push("}");
lines.push("");

writeFileSync("./src/styles/themes.css", lines.join("\n"));

console.log(`✓ ${names.length} theme families → src/styles/themes.css`);

// ── Named theme OBJECTS (themes.ts) ──────────────────────────────────────────
// Same remapped tokens as the CSS, but as importable `ThemeFamily` objects so a
// consumer can `import { dracula } from "…/themes"` and tree-shake a single
// theme (v2 parity; consistent with the appearance objects). Raw per-side vars;
// `themeFamilyToVars` merges them to the identical light-dark() set at apply.

/** Build the per-side `vars` record from a family's remapped tokens. */
function sideVars(side: Partial<V3ThemeTokens>): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const key of V3_KEYS) {
    const v = side[key];
    if (v != null) vars[`${TOKEN_TO_VAR[key]}`] = v;
  }
  return vars;
}

const tsLines: string[] = [
  "/*",
  " * GENERATED — do not edit by hand. Run: npx tsx scripts/generate-theme.ts",
  " * Source: src/styles/theme-source.ts (THEME_FAMILIES_DATA).",
  " *",
  " * Named ThemeFamily objects (the same palettes as themes.css). Pass one as",
  " * `<Calendar theme={dracula} />` to tree-shake a single theme, or use the",
  ' * string form `theme="dracula"` to ride the generated stylesheet instead.',
  " */",
  'import { THEME_BRAND, type ThemeFamily } from "./theme-tokens";',
  "",
];

for (const name of names) {
  const family = THEME_FAMILIES_DATA[name];
  const light = sideVars(remap(family.light));
  const dark = sideVars(remap(family.dark));
  const varsLiteral = (vars: Record<string, string>) =>
    `{ ${Object.entries(vars)
      .map(([k, v]) => `"${k}": "${v}"`)
      .join(", ")} }`;
  tsLines.push(`export const ${name}: ThemeFamily = {`);
  tsLines.push(`  kind: "family",`);
  tsLines.push(
    `  light: { [THEME_BRAND]: true, vars: ${varsLiteral(light)} },`,
  );
  tsLines.push(`  dark: { [THEME_BRAND]: true, vars: ${varsLiteral(dark)} },`);
  tsLines.push("};");
}

tsLines.push("");
tsLines.push("/** All built-in theme families, keyed by name. */");
tsLines.push(
  `export const THEMES: Record<string, ThemeFamily> = { ${names.join(", ")} };`,
);
tsLines.push("");

writeFileSync("./src/styles/themes.ts", tsLines.join("\n"));
// Keep the generated file biome-clean, or every `build` would fail the next
// `check` (verify runs check before build, so a stale unformatted output trips
// the following run).
execSync("npx biome format --write ./src/styles/themes.ts", {
  stdio: "ignore",
});
console.log(`✓ ${names.length} theme families → src/styles/themes.ts`);

// ── Contrast audit (report-only) ─────────────────────────────────────────────
// Guards the WCAG quality bar without rewriting palettes: any pair below its
// target is listed so a regression in theme-source.ts is visible at build
// time. Targets: 4.5:1 for primary ink pairs (AA normal text), 3:1 for
// secondary/muted ink (AA large text / UI).

const hexToRgb = (hex: string): [number, number, number] | null => {
  const value = hex.replace("#", "").slice(0, 6);
  if (!/^[0-9a-f]{6}$/i.test(value)) return null;
  return [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
};

const channelToLinear = (value: number): number => {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex: string): number | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(channelToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (fg: string, bg: string): number => {
  const f = luminance(fg);
  const b = luminance(bg);
  if (f == null || b == null) return 0;
  return (Math.max(f, b) + 0.05) / (Math.min(f, b) + 0.05);
};

type Pair = [fg: keyof V3ThemeTokens, bg: keyof V3ThemeTokens, min: number];
const PAIRS: Pair[] = [
  ["text", "backdrop", 4.5],
  ["text", "tone", 4.5],
  ["activeText", "accent", 4.5],
  ["mutedText", "backdrop", 3],
  ["error", "backdrop", 3],
  ["weekend", "backdrop", 3],
  // Out-of-month day numbers and disabled ink render directly on the backdrop;
  // 3:1 = AA for large/UI text (they are de-emphasized by design, never body).
  ["outOfMonth", "backdrop", 3],
  ["disabledText", "backdrop", 3],
];

const violations: string[] = [];
for (const name of names) {
  const family = THEME_FAMILIES_DATA[name];
  for (const side of ["light", "dark"] as const) {
    const tokens = remap(family[side]);
    for (const [fg, bg, min] of PAIRS) {
      const f = tokens[fg];
      const b = tokens[bg];
      if (!f || !b) continue;
      const ratio = contrast(f, b);
      if (ratio > 0 && ratio < min) {
        violations.push(
          `${name}.${side}: ${fg}/${bg} ${ratio.toFixed(2)} < ${min}`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  console.warn(`⚠ contrast audit: ${violations.length} pair(s) below target`);
  for (const v of violations) console.warn(`  ${v}`);
} else {
  console.log("✓ contrast audit: all families pass");
}
