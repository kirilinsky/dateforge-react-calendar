import path, { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

const dirname =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.stories.*",
        "src/**/*.module.css",
        "src/__tests__/**",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          environment: "happy-dom",
          globals: true,
          setupFiles: ["./src/__tests__/setup.ts"],
          typecheck: {
            tsconfig: "./tsconfig.test.json",
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        // storybook 10.5's addon-vitest setup file pulls @testing-library/dom's
        // CJS deps with named imports; vite must prebundle them or browser mode
        // throws "does not provide an export named ..." on import.
        optimizeDeps: {
          include: [
            "aria-query",
            "lz-string",
            "dom-accessibility-api",
            "pretty-format",
            "@testing-library/dom",
            "@testing-library/user-event",
          ],
        },
        test: {
          name: "storybook",
          retry: 2,
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});
