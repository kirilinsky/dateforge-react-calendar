/**
 * Entry-point smoke: `require()` AND `import()` every subpath in the package
 * exports map against the local `dist/`, plus a declaration cross-check.
 * Catches what publint/attw can't:
 *  - a chunk that requires a missing sibling (the 3.0.0 CJS MODULE_NOT_FOUND)
 *    — they never execute the files;
 *  - a d.cts that exports a VALUE the runtime namespace doesn't actually have
 *    (an untagged type export, or a fixer that stripped a real value) — they
 *    never compare declarations against the loaded module.
 * Wired into `check:exports` after the resolvability linters.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import pkg from "../package.json" with { type: "json" };

const require = createRequire(import.meta.url);

const failures = [];
let checked = 0;

/** Value-export names promised by a bundled declaration file. */
function declaredValueExports(dtsPath) {
  let src;
  try {
    src = readFileSync(new URL(`../${dtsPath}`, import.meta.url), "utf8");
  } catch {
    return null;
  }
  const names = new Set();
  for (const m of src.matchAll(/export\s*\{([^}]*)\}(?!\s*from)/g)) {
    for (const raw of m[1].split(",")) {
      const item = raw.trim();
      if (!item || item.startsWith("type ")) continue;
      const [, alias] = item.split(/\s+as\s+/).map((s) => s.trim());
      names.add(alias ?? item);
    }
  }
  return names;
}

const esmChecks = [];

for (const [subpath, entry] of Object.entries(pkg.exports)) {
  if (typeof entry === "string" || subpath.endsWith(".css")) continue; // asset passthroughs
  const cjs = entry.require?.default;
  const esm = entry.import?.default;
  const dcts = entry.require?.types;

  if (cjs) {
    checked++;
    try {
      const ns = require(`../${cjs}`);
      // Declaration cross-check: every value the d.cts promises must exist
      // at runtime (an untagged TYPE here breaks isolatedModules consumers).
      const declared = dcts ? declaredValueExports(dcts) : null;
      if (declared) {
        for (const name of declared) {
          if (!(name in ns)) {
            failures.push(
              `${subpath}: d.cts exports value "${name}" but require() namespace lacks it (untagged type?)`,
            );
          }
        }
      }
    } catch (error) {
      failures.push(
        `require ${subpath} (${cjs}): ${String(error.message).split("\n")[0]}`,
      );
    }
  }

  if (esm) {
    checked++;
    esmChecks.push(
      import(new URL(`../${esm}`, import.meta.url).href).catch((error) => {
        // The ESM output deliberately carries `import "./style.css"` for
        // bundlers; bare node can't load .css. Resolution reaching the CSS
        // file IS the pass condition — anything else is a real failure.
        const msg = String(error.message ?? error);
        if (error.code === "ERR_UNKNOWN_FILE_EXTENSION" && msg.includes(".css")) {
          return;
        }
        failures.push(`import ${subpath} (${esm}): ${msg.split("\n")[0]}`);
      }),
    );
  }
}

await Promise.all(esmChecks);

if (failures.length > 0) {
  console.error(`✗ entrypoint smoke: ${failures.length} of ${checked} failed`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `✓ entrypoint smoke: all ${checked} entries load (require + import), d.cts value exports verified`,
);
