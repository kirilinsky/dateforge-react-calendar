import { TOKEN_TO_VAR, THEMES_DATA, ThemeTokens } from "../themes/themes";
import { writeFileSync, mkdirSync } from "fs";

const distDir = "./dist/themes";
const srcGenFile = "./src/themes.gen.css";
mkdirSync(distDir, { recursive: true });

const TOKEN_KEYS = Object.keys(TOKEN_TO_VAR) as (keyof ThemeTokens)[];

function toVars(tokens: ThemeTokens): string {
  return TOKEN_KEYS.map((key) => `${TOKEN_TO_VAR[key]}:${tokens[key]}`).join(
    ";",
  );
}

const names = Object.keys(THEMES_DATA);
const allRules = names
  .map((n) => `[data-theme="${n}"]{${toVars(THEMES_DATA[n])}}`)
  .join("\n");

for (const name of names) {
  writeFileSync(
    `${distDir}/${name}.css`,
    `@layer themes{[data-theme="${name}"]{${toVars(THEMES_DATA[name])}}}`,
  );
}

writeFileSync(`${distDir}/index.css`, `@layer themes{\n${allRules}\n}`);

writeFileSync(
  srcGenFile,
  `/* generated — do not edit manually, run: npm run build */\n@layer themes{\n${allRules}\n}`,
);

console.log(`\u2713 ${names.length} themes \u2192 ${distDir}/ + ${srcGenFile}`);
