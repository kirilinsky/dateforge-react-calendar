import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";

const srcDir = "./appearances";
const distDir = "./dist/appearances";
const srcGenFile = "./src/appearances.gen.css";
mkdirSync(distDir, { recursive: true });

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith(".css"))
  .sort();

const innerBlocks: string[] = [];

for (const file of files) {
  const src = readFileSync(`${srcDir}/${file}`, "utf8");
  writeFileSync(`${distDir}/${file}`, src);

  // Extract content inside @layer appearances { ... }
  const match = src.match(/@layer appearances\s*\{([\s\S]*)\}/);
  if (match) innerBlocks.push(match[1].trim());
}

const combined = `@layer appearances {\n${innerBlocks.map((b) => `  ${b.replace(/\n/g, "\n  ")}`).join("\n\n")}\n}`;

writeFileSync(`${distDir}/index.css`, combined);
writeFileSync(
  srcGenFile,
  `/* generated — do not edit manually, run: npm run build */\n${combined}`,
);

console.log(`✓ ${files.length} appearances → ${distDir}/ + ${srcGenFile}`);
