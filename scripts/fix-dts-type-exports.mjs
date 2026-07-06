/**
 * Post-build repair for bundled declaration files (runs after tsdown).
 *
 * rolldown's dts bundling emits export lists without `type` modifiers —
 * `export { CalendarDays, CalendarDaysProps }` — even when a name is a pure
 * type. Under `verbatimModuleSyntax`/`isolatedModules` consumers then keep
 * the import at runtime (undefined) and their re-exports break.
 *
 * Two-pass repair across the WHOLE dist:
 *   pass 1 — for every .d.ts/.d.cts/.d.mts, record each locally declared
 *            name's kind (type-only vs value), including `export type X`/
 *            `export interface X`/`export declare const X` forms;
 *   pass 2 — rewrite export lists, resolving IMPORTED names through the
 *            source file's declarations (entry d.ts re-exporting a chunk's
 *            `import { p as CalendarDaysProps } from "./chunk.js"` gets
 *            tagged from the chunk's own kind of `p`) — the cross-chunk case
 *            a single-file scan misses.
 *
 * Backstop: `check-entrypoints.mjs` cross-checks every subpath's d.cts
 * value-exports against the actual require() namespace, so an untagged type
 * (or a stripped value) fails CI instead of shipping.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DIST = "dist";

const dtsFiles = readdirSync(DIST, { recursive: true })
  .map((f) => join(DIST, String(f)))
  .filter((f) => /\.d\.(ts|cts|mts)$/.test(f))
  .filter((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  });

const TYPE_DECL =
  /(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?(?:type|interface)\s+([A-Za-z_$][\w$]*)/g;
const VALUE_DECL =
  /(?:^|\n)\s*(?:export\s+)?(?:declare\s+)?(?:const|let|var|function|class|enum|namespace)\s+([A-Za-z_$][\w$]*)/g;
const IMPORT_STMT =
  /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;

/** kinds per file: Map<absPath, Map<localName, "type"|"value">> */
const kinds = new Map();
const sources = new Map();

for (const file of dtsFiles) {
  const src = readFileSync(file, "utf8");
  sources.set(file, src);
  const map = new Map();
  for (const m of src.matchAll(TYPE_DECL)) map.set(m[1], "type");
  for (const m of src.matchAll(VALUE_DECL)) map.set(m[1], "value"); // value wins
  // Keyed by ABSOLUTE path — resolveDts compares resolve()d candidates.
  kinds.set(resolve(file), map);
}

/** Resolve an import specifier to one of our dts files (chunk .js ↔ .d.ts). */
function resolveDts(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec).replace(/\.(js|mjs|cjs)$/, "");
  for (const ext of [".d.ts", ".d.cts", ".d.mts"]) {
    const candidate = base + ext;
    if (kinds.has(candidate)) return candidate;
  }
  return null;
}

let taggedNames = 0;
let fixedFiles = 0;

// Fold imported names into each file's kind map — `import { p as X } from
// "./chunk.js"` gives X the kind the chunk EXPORTS under `p` (chunks alias:
// `export { type CalendarToolbarProps as p }`). Entries re-export through
// intermediate barrels (index → days.d.ts → chunk), so iterate to a fixpoint:
// each round recomputes export-alias maps and propagates kinds one hop.
const EXPORT_LIST = /export\s*\{([^}]*)\}/g;
const exportedOf = new Map();
for (let round = 0; round < 10; round++) {
  let changed = false;
  // Recompute each file's exported-name → kind map from its current locals.
  for (const file of dtsFiles) {
    const abs = resolve(file);
    const local = kinds.get(abs);
    const exported = new Map();
    for (const m of sources.get(file).matchAll(EXPORT_LIST)) {
      for (const raw of m[1].split(",")) {
        const item = raw.trim();
        if (!item) continue;
        const isType = item.startsWith("type ");
        const [localName, alias] = item
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .map((s) => s.trim());
        const kind = isType ? "type" : local.get(localName);
        if (kind) exported.set(alias ?? localName, kind);
      }
    }
    exportedOf.set(abs, exported);
  }
  // Propagate through imports.
  for (const file of dtsFiles) {
    const local = kinds.get(resolve(file));
    for (const m of sources.get(file).matchAll(IMPORT_STMT)) {
      const isTypeImport = /import\s+type\s/.test(m[0]);
      const sourceFile = resolveDts(file, m[2]);
      for (const raw of m[1].split(",")) {
        const item = raw.trim();
        if (!item) continue;
        const [srcName, alias] = item
          .replace(/^type\s+/, "")
          .split(/\s+as\s+/)
          .map((s) => s.trim());
        const localName = alias ?? srcName;
        if (local.has(localName)) continue; // already known
        let kind;
        if (isTypeImport || item.startsWith("type ")) kind = "type";
        else if (sourceFile) {
          kind =
            exportedOf.get(sourceFile)?.get(srcName) ??
            kinds.get(sourceFile).get(srcName);
        }
        if (kind) {
          local.set(localName, kind);
          changed = true;
        }
      }
    }
  }
  if (!changed) break;
}

let unresolved = 0;
for (const file of dtsFiles) {
  const src = sources.get(file);
  const local = kinds.get(resolve(file));

  // Anything still unknown after the fixpoint is an unverified export kind.
  for (const m of src.matchAll(IMPORT_STMT)) {
    for (const raw of m[1].split(",")) {
      const item = raw.trim();
      if (!item) continue;
      const localName = (item.replace(/^type\s+/, "").split(/\s+as\s+/)[1] ?? item.replace(/^type\s+/, "").split(/\s+as\s+/)[0]).trim();
      if (!local.has(localName)) unresolved++;
    }
  }

  const out = src.replace(/export\s*\{([^}]*)\}(?!\s*from)/g, (_whole, body) => {
    const items = body
      .split(",")
      .map((raw) => {
        const item = raw.trim();
        if (!item || item.startsWith("type ")) return item;
        const localName = item.split(/\s+as\s+/)[0].trim();
        if (local.get(localName) !== "type") return item;
        taggedNames++;
        return `type ${item}`;
      })
      .filter(Boolean);
    return `export { ${items.join(", ")} }`;
  });

  if (out !== src) {
    writeFileSync(file, out);
    fixedFiles++;
  }
}

if (unresolved > 0) {
  console.warn(
    `⚠ fix-dts-type-exports: ${unresolved} imported name(s) could not be ` +
      "resolved to a declaration — their export kind is unverified.",
  );
}
if (taggedNames === 0) {
  console.warn(
    "⚠ fix-dts-type-exports: nothing to tag — the upstream dts emit may be " +
      "fixed; consider removing this script (check-entrypoints still " +
      "cross-checks d.cts value exports).",
  );
} else {
  console.log(
    `✓ fix-dts-type-exports: ${taggedNames} type export(s) tagged in ${fixedFiles} file(s)`,
  );
}
