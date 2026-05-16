import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const srcDir = "./appearances";
const distDir = "./dist/appearances";
const srcIndexFile = "./appearances/index.ts";
mkdirSync(distDir, { recursive: true });

const BRAND_EXPR = `Symbol.for("rcd.appearance.custom")`;

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".css") && !f.startsWith("_"))
  .sort();

type ParsedAppearance = { name: string; vars: Record<string, string> };
const parsed: ParsedAppearance[] = [];

for (const file of files) {
  const src = readFileSync(`${srcDir}/${file}`, "utf8");

  const nameMatch = src.match(/\[data-appearance="([^"]+)"\]/);
  if (!nameMatch) continue;
  const name = nameMatch[1];

  const blockMatch = src.match(/\[data-appearance="[^"]+"\]\s*\{([^}]*)\}/);
  if (!blockMatch) continue;

  const vars: Record<string, string> = {};
  for (const line of blockMatch[1].split("\n")) {
    const m = line.match(/^\s*(--[\w-]+)\s*:\s*(.+?)\s*;/);
    if (m) vars[m[1]] = m[2];
  }

  parsed.push({ name, vars });
}

const names = parsed.map((p) => p.name);

// ── Per-appearance JS ─────────────────────────────────────────────────────────

for (const { name, vars } of parsed) {
  const varsStr = Object.entries(vars)
    .map(([k, v]) => `"${k}":"${v}"`)
    .join(",");

  writeFileSync(
    `${distDir}/${name}.mjs`,
    `const B=${BRAND_EXPR};export const ${name}={[B]:true,vars:{${varsStr}}};`,
  );

  writeFileSync(
    `${distDir}/${name}.cjs`,
    `"use strict";Object.defineProperty(exports,"__esModule",{value:true});const B=${BRAND_EXPR};exports.${name}={[B]:true,vars:{${varsStr}}};`,
  );

  const dts = `import type{CustomAppearance}from"@dateforge/react-calendar";\nexport declare const ${name}:CustomAppearance;\n`;
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

// ── Regenerate appearances/index.ts (CSS = single source of truth) ────────────

const srcIndex = [
  `// generated — do not edit manually, run: npm run build`,
  `import { CUSTOM_APPEARANCE_BRAND } from "../src/types/appearances";`,
  `import type { CustomAppearance } from "../src/types/appearances";`,
  ``,
  ...parsed.map(({ name, vars }) => {
    const varsStr = Object.entries(vars)
      .map(([k, v]) => `"${k}": "${v}"`)
      .join(", ");
    return `export const ${name}: CustomAppearance = { [CUSTOM_APPEARANCE_BRAND]: true, vars: { ${varsStr} } };`;
  }),
  ``,
].join("\n");

writeFileSync(srcIndexFile, srcIndex);

console.log(`✓ ${names.length} appearances → ${distDir}/`);
