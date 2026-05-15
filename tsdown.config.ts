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

const externalizeContextsPlugin = {
  name: "externalize-contexts",
  resolveId(id: string) {
    if (id.startsWith("@/context/")) {
      return { id: "@dateforge/react-calendar/context", external: true };
    }
  },
};

export default defineConfig([
  // ── Main + context: ESM (with CSS inject) ────────────────────────────────
  {
    ...sharedBase,
    entry: { index: "src/index.ts", context: "src/context/index.ts" },
    outDir: "dist",
    clean: true,
    format: ["esm"],
    outExtensions: () => ({ dts: ".d.ts" }),
    dts: true,
    css: { inject: true, minify: true },
    deps: sharedDeps,
  },
  // ── Main + context: CJS (no CSS inject — avoids ESM syntax in .cjs) ──────
  {
    ...sharedBase,
    entry: { index: "src/index.ts", context: "src/context/index.ts" },
    outDir: "dist",
    format: ["cjs"],
    outExtensions: () => ({ dts: ".d.cts" }),
    dts: true,
    css: { inject: false, minify: true },
    deps: sharedDeps,
  },
  // ── Modules: ESM ─────────────────────────────────────────────────────────
  {
    ...sharedBase,
    entry: {
      index: "src/modules/index.ts",
      info: "src/modules/info/index.tsx",
      days: "src/modules/days/index.tsx",
      nav: "src/modules/nav/index.tsx",
      "months-grid": "src/modules/months-grid/index.tsx",
      time: "src/modules/time/index.tsx",
      presets: "src/modules/presets/index.tsx",
      "selected-dates": "src/modules/selected-dates/index.tsx",
      "manual-input": "src/modules/manual-input/index.tsx",
      "years-track": "src/modules/years-track/index.tsx",
      "months-track": "src/modules/months-track/index.tsx",
      "days-track": "src/modules/days-track/index.tsx",
      "years-grid": "src/modules/years-grid/index.tsx",
    },
    outDir: "dist/modules",
    format: ["esm"],
    outExtensions: () => ({ dts: ".d.ts" }),
    dts: true,
    css: { inject: true, minify: true },
    plugins: [externalizeContextsPlugin],
    deps: {
      neverBundle: [
        ...sharedDeps.neverBundle,
        "@dateforge/react-calendar",
        "@dateforge/react-calendar/context",
      ],
    },
  },
  // ── Modules: CJS ─────────────────────────────────────────────────────────
  {
    ...sharedBase,
    entry: {
      index: "src/modules/index.ts",
      info: "src/modules/info/index.tsx",
      days: "src/modules/days/index.tsx",
      nav: "src/modules/nav/index.tsx",
      "months-grid": "src/modules/months-grid/index.tsx",
      time: "src/modules/time/index.tsx",
      presets: "src/modules/presets/index.tsx",
      "selected-dates": "src/modules/selected-dates/index.tsx",
      "manual-input": "src/modules/manual-input/index.tsx",
      "years-track": "src/modules/years-track/index.tsx",
      "months-track": "src/modules/months-track/index.tsx",
      "days-track": "src/modules/days-track/index.tsx",
      "years-grid": "src/modules/years-grid/index.tsx",
    },
    outDir: "dist/modules",
    format: ["cjs"],
    outExtensions: () => ({ dts: ".d.cts" }),
    dts: true,
    css: { inject: false, minify: true },
    plugins: [externalizeContextsPlugin],
    deps: {
      neverBundle: [
        ...sharedDeps.neverBundle,
        "@dateforge/react-calendar",
        "@dateforge/react-calendar/context",
      ],
    },
  },
]);
