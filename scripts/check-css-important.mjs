import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

function collectCssModules(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectCssModules(path));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".module.css")) {
      files.push(path);
    }
  }

  return files;
}

const failures = [];

// Strip `/* ... */` block comments so mentions of `!important` inside docs
// don't trigger the hard ban.
const stripBlockComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "");

for (const file of collectCssModules(SRC_DIR)) {
  const rel = relative(ROOT, file);
  const source = stripBlockComments(readFileSync(file, "utf8"));
  const count = source.match(/!important/g)?.length ?? 0;
  if (count > 0) {
    failures.push(`${rel}: found ${count} !important — not allowed`);
  }
}

if (failures.length > 0) {
  console.error("CSS !important hard ban violated:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error(
    "src/**/*.module.css must contain zero !important. Raise specificity or restructure cascade.",
  );
  process.exit(1);
}

console.log("CSS !important hard ban OK (0 declarations)");
