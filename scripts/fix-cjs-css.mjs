/**
 * Post-build repair for the CJS output (runs right after tsdown in `build`).
 *
 * tsdown's CSS pipeline (@tsdown/css, still broken as of 0.22.3) damages the
 * CJS pass in two ways when shared CSS is code-split:
 *   1. it leaves an ESM `import "./style.css"` statement inside a .cjs chunk
 *      (SyntaxError under require()), and
 *   2. it keeps a side-effect `require("./layers-<hash>.cjs")` pointing to a
 *      CSS-facade chunk that is never written to disk (MODULE_NOT_FOUND —
 *      the bug that shipped in 3.0.0 and killed the root/prebuilt/modules
 *      CJS entries).
 *
 * Both are safe to strip: the CSS itself ships as `dist/style.css` (exported
 * as "./style.css") and, for ESM consumers, as `import "./style.css"`
 * statements bundlers resolve. CJS consumers import the stylesheet once,
 * manually. `check-entrypoints.mjs` smoke-requires every subpath in CI so a
 * regression can't ship again.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const DIST = "dist";

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
  );
}

let fixedFiles = 0;
let strippedImports = 0;
let strippedRequires = 0;

for (const file of walk(DIST).filter((f) => f.endsWith(".cjs"))) {
  const src = readFileSync(file, "utf8");
  let out = src;

  // 1. ESM css-import statements have no place in a CJS module.
  out = out.replace(/(?:^|(?<=;))import\s*[`'"][^`'"]+\.css[`'"];?/g, () => {
    strippedImports++;
    return "";
  });

  // 2. Bare side-effect requires of local chunks that were never emitted
  //    (the phantom CSS-facade chunks). Only requires whose target file is
  //    genuinely missing are dropped — real chunks are left untouched. The
  //    minifier can park the call inside a comma sequence (`a(),require(x);`)
  //    or leave it standalone (`require(x);`) — cover both without breaking
  //    the surrounding expression.
  const missing = (target) => {
    try {
      statSync(resolve(dirname(file), target));
      return false;
    } catch {
      return true;
    }
  };
  const dropIfMissing = (pattern) => {
    out = out.replace(pattern, (match, target) => {
      if (!missing(target)) return match;
      strippedRequires++;
      return "";
    });
  };
  dropIfMissing(/,\s*require\(\s*[`'"](\.[^`'"]+)[`'"]\s*\)(?=[,;)])/g); // mid/tail of a sequence
  dropIfMissing(/require\(\s*[`'"](\.[^`'"]+)[`'"]\s*\)\s*,/g); // head of a sequence
  dropIfMissing(/require\(\s*[`'"](\.[^`'"]+)[`'"]\s*\);?/g); // standalone statement

  if (out !== src) {
    writeFileSync(file, out);
    fixedFiles++;
  }
}

console.log(
  `✓ fix-cjs-css: ${fixedFiles} file(s) repaired ` +
    `(${strippedImports} css import(s), ${strippedRequires} phantom require(s))`,
);
