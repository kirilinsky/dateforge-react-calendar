/**
 * Post-build repair for bundled declaration files (runs after tsdown).
 *
 * rolldown's dts bundling emits the final export list of a SUBPATH entry
 * (dist/modules/*.d.ts etc.) without `type` modifiers — `export {
 * CalendarDays, CalendarDaysProps }` — even though `CalendarDaysProps` is a
 * pure type. Under `verbatimModuleSyntax`/`isolatedModules` consumers then
 * keep the import at runtime (undefined) and their re-exports break. The
 * root barrel is unaffected only because its SOURCE spells `export { type X }`.
 *
 * Repair: within each .d.ts/.d.cts, collect identifiers declared ONLY as
 * types (`type X =` / `interface X`) — never also as a value (const/function/
 * class/enum/namespace) — and prefix them with `type` inside the export lists.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const DIST = "dist";

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

const TYPE_DECL = /(?:^|\n)\s*(?:declare\s+)?(?:type|interface)\s+([A-Za-z_$][\w$]*)/g;
const VALUE_DECL =
  /(?:^|\n)\s*(?:declare\s+)?(?:const|let|var|function|class|enum|namespace)\s+([A-Za-z_$][\w$]*)/g;

let fixedFiles = 0;
let taggedNames = 0;

for (const file of walk(DIST).filter(
  (f) => f.endsWith(".d.ts") || f.endsWith(".d.cts") || f.endsWith(".d.mts"),
)) {
  const src = readFileSync(file, "utf8");

  const typeNames = new Set([...src.matchAll(TYPE_DECL)].map((m) => m[1]));
  for (const m of src.matchAll(VALUE_DECL)) typeNames.delete(m[1]); // value wins
  if (typeNames.size === 0) continue;

  // Rewrite every export list: `export { A, B as C }` → tag type-only names.
  const out = src.replace(
    /export\s*\{([^}]*)\}/g,
    (_whole, body) =>
      `export { ${body
        .split(",")
        .map((raw) => {
          const item = raw.trim();
          if (!item || item.startsWith("type ")) return item;
          const local = item.split(/\s+as\s+/)[0].trim();
          if (!typeNames.has(local)) return item;
          taggedNames++;
          return `type ${item}`;
        })
        .filter(Boolean)
        .join(", ")} }`,
  );

  if (out !== src) {
    writeFileSync(file, out);
    fixedFiles++;
  }
}

console.log(
  `✓ fix-dts-type-exports: ${taggedNames} type export(s) tagged in ${fixedFiles} file(s)`,
);
