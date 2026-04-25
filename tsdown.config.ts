import { defineConfig } from "tsdown";
import type { Plugin } from "rolldown";
import pkg from "./package.json" with { type: "json" };

const peers = Object.keys(pkg.peerDependencies || {});

const sharedDeps = {
  neverBundle: ["react", "react-dom", "react/jsx-runtime", ...peers],
};

const sharedOptions = {
  format: ["cjs", "esm"] satisfies import("tsdown").UserConfig["format"],
  outExtensions: () => ({ dts: ".d.ts" }),
  minify: true,
  dts: true,
  treeshake: true,
  target: "es2022" as const,
  css: { inject: true, minify: true },
};

const externalizeContextsPlugin: Plugin = {
  name: "externalize-contexts",
  resolveId(id) {
    if (id.startsWith("@/context/")) {
      return { id: "react-calendar-datetime/context", external: true };
    }
  },
};

export default defineConfig([
  {
    ...sharedOptions,
    entry: { index: "src/index.ts", context: "src/context/index.ts" },
    outDir: "dist",
    clean: true,
    deps: sharedDeps,
  },
  {
    ...sharedOptions,
    entry: { index: "themes/index.ts" },
    outDir: "dist/themes",
    clean: false,
    css: { inject: false },
    deps: sharedDeps,
  },
  {
    ...sharedOptions,
    entry: { index: "appearances/index.ts" },
    outDir: "dist/appearances",
    clean: false,
    css: { inject: false },
    deps: sharedDeps,
  },
  {
    ...sharedOptions,
    entry: {
      "index":          "src/modules/index.ts",
      "days":           "src/modules/days/index.tsx",
      "nav":            "src/modules/nav/index.tsx",
      "months":         "src/modules/months/index.tsx",
      "time":           "src/modules/time/index.tsx",
      "presets":        "src/modules/presets/index.tsx",
      "selected-dates": "src/modules/selected-dates/index.tsx",
      "manual-select":  "src/modules/manual-select/index.tsx",
      "years-track":    "src/modules/years-track/index.tsx",
      "months-track":   "src/modules/months-track/index.tsx",
      "days-track":     "src/modules/days-track/index.tsx",
      "years-grid":     "src/modules/years-grid/index.tsx",
    },
    outDir: "dist/modules",
    plugins: [externalizeContextsPlugin],
    deps: {
      neverBundle: [
        ...sharedDeps.neverBundle,
        "react-calendar-datetime",
        "react-calendar-datetime/context",
      ],
    },
  },
]);
