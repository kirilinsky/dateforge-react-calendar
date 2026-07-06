import { codecovRollupPlugin } from "@codecov/rollup-plugin";
import { defineConfig } from "tsdown";

import pkg from "./package.json" with { type: "json" };

const peers = Object.keys(pkg.peerDependencies || {});

const sharedDeps = {
  neverBundle: ["react", "react-dom", "react/jsx-runtime", ...peers],
};

const sharedBase = {
  minify: true,
  treeshake: true,
  target: "es2022" as const,
};

// ── v3 entry map ──────────────────────────────────────────────────────────────
// Root + context + every module + the theme/appearance palettes. All entries
// build in ONE pass per format, so rolldown auto-extracts the shared shell/core
// (store, hooks, UI primitives) into common chunks that the tiny per-module
// entries import — no manual externalization plugin (the v2 approach). Modules
// stay their own subpath bundles; a consumer pulls only what it imports.
const M = "src/modules";
const entry = {
  index: "src/react/index.ts",
  context: "src/react/context.ts",
  prebuilt: "src/react/prebuilt.tsx",
  "modules/index": `${M}/index.ts`,
  "modules/days": `${M}/days/CalendarDays.tsx`,
  "modules/days-track": `${M}/days-track/CalendarDaysTrack.tsx`,
  "modules/info": `${M}/info/CalendarInfo.tsx`,
  "modules/lunar": `${M}/lunar/CalendarLunar.tsx`,
  "modules/manual-input": `${M}/manual-input/CalendarManualInput.tsx`,
  "modules/months-grid": `${M}/months-grid/CalendarMonthsGrid.tsx`,
  "modules/months-track": `${M}/months-track/CalendarMonthsTrack.tsx`,
  "modules/months-wheel": `${M}/months-wheel/CalendarMonthsWheel.tsx`,
  "modules/presets": `${M}/presets/CalendarPresets.tsx`,
  "modules/selected-dates": `${M}/selected-dates/CalendarSelectedDates.tsx`,
  "modules/time": `${M}/time/CalendarTimeWheel.tsx`,
  "modules/toolbar": `${M}/toolbar/CalendarToolbar.tsx`,
  "modules/years-grid": `${M}/years-grid/CalendarYearsGrid.tsx`,
  "modules/years-track": `${M}/years-track/CalendarYearsTrack.tsx`,
  "modules/years-wheel": `${M}/years-wheel/CalendarYearsWheel.tsx`,
  themes: "src/styles/themes.ts",
  appearances: "src/styles/appearances.ts",
};

const codecovToken = process.env.CODECOV_TOKEN;
const codecov = (bundleName: string) =>
  codecovRollupPlugin({
    enableBundleAnalysis: !!codecovToken,
    bundleName,
    uploadToken: codecovToken,
    gitService: "github",
  });

export default defineConfig([
  // ── ESM (CSS injected into the JS at import time) ──────────────────────────
  {
    ...sharedBase,
    entry,
    outDir: "dist",
    clean: true,
    format: ["esm"],
    outExtensions: () => ({ dts: ".d.ts" }),
    dts: true,
    css: { inject: true, minify: true },
    plugins: [codecov("dateforge-v3")],
    deps: sharedDeps,
  },
  // ── CJS. THE CSS CONTRACT (documented in README/DOCUMENTATION): CJS output
  // carries NO css references — a CJS consumer imports the stylesheet once,
  // manually: `@dateforge/react-calendar/style.css` (exported subpath). There
  // is no runtime injector in tsdown: `inject: true` only preserves ESM
  // `import "./style.css"` statements, which are a SyntaxError under
  // require(). So: inject stays off here, @tsdown/css still leaves a phantom
  // `require("./layers-*.cjs")` (broken through 0.22.3 — the 3.0.0
  // MODULE_NOT_FOUND bug), and `scripts/fix-cjs-css.mjs` strips it after the
  // build. `scripts/check-entrypoints.mjs` smoke-requires every subpath in
  // CI so a dead entry can't ship again. ─────────────────────────────────────
  {
    ...sharedBase,
    entry,
    outDir: "dist",
    format: ["cjs"],
    outExtensions: () => ({ dts: ".d.cts" }),
    dts: true,
    css: { inject: false, minify: true },
    deps: sharedDeps,
  },
]);
