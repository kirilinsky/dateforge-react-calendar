/**
 * Entry-point smoke: `require()` AND `import()` every subpath in the package
 * exports map against the local `dist/`. Catches what publint/attw can't —
 * they don't execute the files, so a chunk that requires a missing sibling
 * (the 3.0.0 CJS `layers-*.cjs` MODULE_NOT_FOUND) sails through both.
 * Wired into `check:exports` after the resolvability linters.
 */
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import pkg from "../package.json" with { type: "json" };

const require = createRequire(import.meta.url);

// GlobalThis stubs: the injected-CSS path and React internals never run —
// we only need module RESOLUTION + top-level evaluation to succeed.
const failures = [];
let checked = 0;

for (const [subpath, entry] of Object.entries(pkg.exports)) {
  if (typeof entry === "string" || subpath.endsWith(".css")) continue; // asset passthroughs
  const cjs = entry.require?.default;
  const esm = entry.import?.default;

  if (cjs) {
    checked++;
    try {
      require(`../${cjs}`);
    } catch (error) {
      failures.push(`require ${subpath} (${cjs}): ${error.message.split("\n")[0]}`);
    }
  }
  if (esm) {
    checked++;
    try {
      await import(
        pathToFileURL(new URL(`../${esm}`, import.meta.url).pathname).href
      );
    } catch (error) {
      // The ESM output deliberately carries `import "./style.css"` statements
      // for bundlers; bare node can't load .css. Resolution reaching the CSS
      // file IS the pass condition — anything else is a real failure.
      const msg = String(error.message ?? error);
      if (error.code === "ERR_UNKNOWN_FILE_EXTENSION" && msg.includes(".css")) {
        continue;
      }
      failures.push(`import ${subpath} (${esm}): ${msg.split("\n")[0]}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ entrypoint smoke: ${failures.length} of ${checked} failed`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`✓ entrypoint smoke: all ${checked} entries load (require + import)`);
