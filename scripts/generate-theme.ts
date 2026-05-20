import { mkdirSync, writeFileSync } from "node:fs";
import { type ThemeTokens, TOKEN_TO_VAR } from "../src/types/theme-tokens";
import { THEME_FAMILIES_DATA } from "../themes/themes";

const distDir = "./dist/themes";
mkdirSync(distDir, { recursive: true });

const TOKEN_KEYS = Object.keys(TOKEN_TO_VAR) as (keyof ThemeTokens)[];
const BRAND_EXPR = `Symbol.for("rcd.theme.custom")`;

function toJsVarsObj(tokens: ThemeTokens): string {
  return TOKEN_KEYS.filter((k) => tokens[k] !== undefined)
    .map((k) => `"${TOKEN_TO_VAR[k]}":"${tokens[k]}"`)
    .join(",");
}

const names = Object.keys(THEME_FAMILIES_DATA);

function toThemeObj(tokens: ThemeTokens): string {
  return `{[B]:true,vars:{${toJsVarsObj(tokens)}}}`;
}

// ── Per-theme JS ──────────────────────────────────────────────────────────────

for (const name of names) {
  const family = THEME_FAMILIES_DATA[name];
  const light = toThemeObj(family.light);
  const dark = toThemeObj(family.dark);

  writeFileSync(
    `${distDir}/${name}.mjs`,
    `const B=${BRAND_EXPR};export const ${name}={kind:"family",light:${light},dark:${dark}};`,
  );

  writeFileSync(
    `${distDir}/${name}.cjs`,
    `"use strict";Object.defineProperty(exports,"__esModule",{value:true});const B=${BRAND_EXPR};exports.${name}={kind:"family",light:${light},dark:${dark}};`,
  );

  const dts = `import type{ThemeFamily}from"@dateforge/react-calendar";\nexport declare const ${name}:ThemeFamily;\n`;
  writeFileSync(`${distDir}/${name}.d.ts`, dts);
  writeFileSync(`${distDir}/${name}.d.cts`, dts);
}

// ── Barrel index ──────────────────────────────────────────────────────────────

writeFileSync(
  `${distDir}/index.mjs`,
  names.map((n) => `export{${n}}from"./${n}.mjs";`).join(""),
);

writeFileSync(
  `${distDir}/index.cjs`,
  `"use strict";Object.defineProperty(exports,"__esModule",{value:true});\n` +
    names
      .map((n) => `var _${n}=require("./${n}.cjs");exports.${n}=_${n}.${n};`)
      .join(""),
);

const barrelDts = `${names.map((n) => `export{${n}}from"./${n}.js";`).join("\n")}\n`;
writeFileSync(`${distDir}/index.d.ts`, barrelDts);
writeFileSync(`${distDir}/index.d.cts`, barrelDts);

// ── Regenerate themes/index.ts (dev / storybook source) ───────────────────────

const srcIndex = [
  `// generated — do not edit manually, run: npm run build`,
  `import { CUSTOM_THEME_BRAND } from "../src/types/themes";`,
  `import type { ThemeFamily } from "../src/types/themes";`,
  ``,
  ...names.map((n) => {
    const family = THEME_FAMILIES_DATA[n];
    const light = toJsVarsObj(family.light);
    const dark = toJsVarsObj(family.dark);
    return `export const ${n}: ThemeFamily = { kind: "family", light: { [CUSTOM_THEME_BRAND]: true, vars: { ${light} } }, dark: { [CUSTOM_THEME_BRAND]: true, vars: { ${dark} } } };`;
  }),
  ``,
].join("\n");

writeFileSync("./themes/index.ts", srcIndex);

console.log(`✓ ${names.length} theme families → ${distDir}/`);
