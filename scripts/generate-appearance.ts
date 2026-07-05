/**
 * Generates `src/styles/appearances.css` from the token records in
 * `src/styles/appearances.ts` (the single source). One
 * `[data-appearance="<name>"]` block per appearance in the `cal-appearances`
 * layer; each token maps to its `--cal-*` var via `APPEARANCE_TOKEN_TO_VAR`.
 *
 * Keeps the string form (`appearance="loft"`) in sync with the object form
 * (`appearance={loft}`) — both derive from the same records.
 *
 * Run: npx tsx scripts/generate-appearance.ts  (wired into `npm run build`).
 */
import { writeFileSync } from "node:fs";
import {
  APPEARANCE_TOKEN_TO_VAR,
  type AppearanceTokens,
} from "../src/styles/appearance-tokens";
import { APPEARANCES } from "../src/styles/appearances";

const KEYS = Object.keys(APPEARANCE_TOKEN_TO_VAR) as (keyof AppearanceTokens)[];

const lines: string[] = [
  "/*",
  " * GENERATED — do not edit by hand.",
  " * Run: npx tsx scripts/generate-appearance.ts",
  " * Source: src/styles/appearances.ts (APPEARANCES).",
  " *",
  " * One block per appearance; the cal-base bridge feeds these --cal-* vars into",
  ' * the vars the modules read. "No appearance" = the v3 default look.',
  " */",
  "@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;",
  "",
  "@layer cal-appearances {",
];

const names = Object.keys(APPEARANCES).sort();

for (const name of names) {
  const tokens = APPEARANCES[name];
  lines.push(`  [data-appearance="${name}"] {`);
  for (const key of KEYS) {
    const value = tokens[key];
    if (value == null) continue;
    lines.push(`    ${APPEARANCE_TOKEN_TO_VAR[key]}: ${value};`);
  }
  lines.push("  }");
  lines.push("");
}

lines.pop();
lines.push("}");
lines.push("");

writeFileSync("./src/styles/appearances.css", lines.join("\n"));

console.log(`✓ ${names.length} appearances → src/styles/appearances.css`);
