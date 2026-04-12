import { defineConfig } from "tsdown";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  format: ["cjs", "esm"],
  outExtensions: () => ({
    dts: ".d.ts",
  }),
  clean: true,
  minify: true,
  dts: true,
  treeshake: true,
  target: "es2022",
  deps: {
    neverBundle: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      ...Object.keys(pkg.peerDependencies || {}),
    ],
  },
  css: {
    inject: true,
    minify: true,
  },
});
