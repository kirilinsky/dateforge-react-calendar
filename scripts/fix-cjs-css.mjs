/**
 * Post-build repair for the CJS output (runs right after tsdown in `build`).
 *
 * tsdown's CSS pipeline (@tsdown/css, still broken as of 0.22.3) damages the
 * CJS pass in two ways when shared CSS is code-split:
 *   1. it leaves an ESM `import "./style.css"` statement inside .cjs chunks
 *      (SyntaxError under require()), and
 *   2. it keeps a side-effect `require("./layers-<hash>.cjs")` pointing to a
 *      CSS-facade chunk that is never written to disk (MODULE_NOT_FOUND —
 *      the bug that shipped in 3.0.0 and killed the root/prebuilt/modules
 *      CJS entries).
 *
 * Both are safe to strip. The CJS CSS CONTRACT (documented in README /
 * DOCUMENTATION): CJS consumers import the stylesheet once, manually —
 * `require("@dateforge/react-calendar/style.css")` (or a bundler import).
 * ESM keeps its bundler-resolved `import "./style.css"` statements.
 *
 * Safety rails:
 * - only SIDE-EFFECT requires are stripped (statement position: after `;`,
 *   `{`, `}`, file start, or inside a comma sequence) and only when the
 *   target file is genuinely missing; value-position requires
 *   (`const x = require(...)`) are never touched, so a future upstream
 *   regression stays a loud MODULE_NOT_FOUND instead of silent corruption;
 * - template-literal specifiers with `${...}` interpolation are never
 *   treated as paths;
 * - after repair, every remaining local specifier is re-resolved — any
 *   still-missing reference FAILS the build (exit 1);
 * - `dist/style.css` must open with the `@layer` order statement (the
 *   project-wide cascade invariant); if the bundler dropped it, it is
 *   re-pinned here.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DIST = "dist";
const LAYER_ORDER =
  "@layer cal-base, cal-themes, cal-appearances, cal-modules, cal-user;";

const files = readdirSync(DIST, { recursive: true })
  .map((f) => join(DIST, String(f)))
  .filter((f) => {
    try {
      return statSync(f).isFile();
    } catch {
      return false;
    }
  });

const exists = (p) => {
  try {
    statSync(p);
    return true;
  } catch {
    return false;
  }
};

// A local specifier we can safely reason about: relative, no template
// interpolation, no quotes inside.
const SPEC = String.raw`(\.[^"'\`$]*)`;

let fixedFiles = 0;
let strippedImports = 0;
let strippedRequires = 0;

for (const file of files.filter((f) => f.endsWith(".cjs"))) {
  const src = readFileSync(file, "utf8");
  let out = src;

  // 1. ESM css-import statements have no place in a CJS module. Statement
  //    position: file start or right after `;`, `{`, `}` or a newline.
  out = out.replace(
    new RegExp(String.raw`(?:^|(?<=[;{}\n]))\s*import\s*["'\`][^"'\`]+\.css["'\`];?`, "g"),
    () => {
      strippedImports++;
      return "";
    },
  );

  // 2. Side-effect requires of local chunks that were never emitted (the
  //    phantom CSS-facade chunks). Only statement/sequence positions; only
  //    when the target file is genuinely missing.
  const dropIfMissing = (pattern) => {
    out = out.replace(pattern, (match, target) => {
      if (exists(resolve(dirname(file), target))) return match;
      strippedRequires++;
      return "";
    });
  };
  // mid/tail of a comma sequence: `a(),require(x);` / `a(),require(x),b()`
  dropIfMissing(new RegExp(String.raw`,\s*require\(\s*["'\`]${SPEC}["'\`]\s*\)(?=[,;])`, "g"));
  // head of a comma sequence in statement position: `;require(x),b()`
  dropIfMissing(
    new RegExp(String.raw`(?<=^|[;{}\n])require\(\s*["'\`]${SPEC}["'\`]\s*\)\s*,`, "g"),
  );
  // standalone statement: `;require(x);`
  dropIfMissing(
    new RegExp(String.raw`(?<=^|[;{}\n])require\(\s*["'\`]${SPEC}["'\`]\s*\);?`, "g"),
  );

  if (out !== src) {
    writeFileSync(file, out);
    fixedFiles++;
  }
}

// ── Post-repair audit: any remaining unresolved local reference is a build
// failure, not something to discover in a consumer's node_modules. ──────────
const broken = [];
for (const file of files.filter((f) => f.endsWith(".cjs") || f.endsWith(".mjs"))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(
    new RegExp(String.raw`(?:require\(|from\s*|import\()\s*["'\`]${SPEC}["'\`]`, "g"),
  )) {
    if (!exists(resolve(dirname(file), m[1]))) broken.push(`${file} -> ${m[1]}`);
  }
}
if (broken.length > 0) {
  console.error(`✗ fix-cjs-css: ${broken.length} unresolved local reference(s) remain:`);
  for (const b of broken) console.error(`  ${b}`);
  process.exit(1);
}

// ── Layer-order pin: the cascade invariant must hold on the shipped
// stylesheet (it is public API via the ./style.css export). ─────────────────
const styleCss = join(DIST, "style.css");
if (exists(styleCss)) {
  const css = readFileSync(styleCss, "utf8");
  if (!css.trimStart().startsWith("@layer cal-base")) {
    writeFileSync(styleCss, `${LAYER_ORDER}\n${css}`);
    console.log("✓ fix-cjs-css: re-pinned the @layer order statement in style.css");
  }
} else {
  console.error("✗ fix-cjs-css: dist/style.css missing (it is a public export)");
  process.exit(1);
}

if (strippedImports === 0 && strippedRequires === 0) {
  console.warn(
    "⚠ fix-cjs-css: nothing to repair — the upstream @tsdown/css bug may be " +
      "fixed; consider removing this script (entrypoint smoke still guards).",
  );
} else {
  console.log(
    `✓ fix-cjs-css: ${fixedFiles} file(s) repaired ` +
      `(${strippedImports} css import(s), ${strippedRequires} phantom require(s))`,
  );
}
