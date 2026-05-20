import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const SRC_DIR = join(ROOT, "src");

const IMPORTANT_ALLOWLIST = {
  "src/global/global.module.css": 5,
  "src/modules/days/days.module.css": 34,
  "src/modules/selected-dates/selected-dates.module.css": 5,
};

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
const seen = new Set();

for (const file of collectCssModules(SRC_DIR)) {
  const rel = relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  const count = source.match(/!important/g)?.length ?? 0;
  const allowed = IMPORTANT_ALLOWLIST[rel] ?? 0;

  if (count !== allowed) {
    failures.push(`${rel}: expected ${allowed}, found ${count}`);
  }

  if (count > 0) {
    seen.add(rel);
  }
}

for (const rel of Object.keys(IMPORTANT_ALLOWLIST)) {
  if (!seen.has(rel) && IMPORTANT_ALLOWLIST[rel] > 0) {
    failures.push(`${rel}: allowlist entry is stale`);
  }
}

if (failures.length > 0) {
  console.error("CSS !important allowlist mismatch:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  console.error(
    "Remove the declaration or update IMPORTANT_ALLOWLIST as part of the cleanup PR.",
  );
  process.exit(1);
}

console.log("CSS !important allowlist OK");
