import type { Preview } from "@storybook/react-vite";
import * as appearances from "../appearances/index";
import { STORY_LOCALES } from "../src/stories/_helpers/resolve-globals";
import * as themes from "../themes/index";
import "../dist/style.css";

const themeNames = ["default", ...Object.keys(themes)];
const appearanceNames = ["default", ...Object.keys(appearances)];
const localeNames = [...STORY_LOCALES];
const toToolbarItems = (label: string, values: readonly string[]) =>
  values.map((value) => ({
    value,
    title: `${label}: ${value}`,
  }));

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Calendar theme family",
      defaultValue: "default",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: toToolbarItems("theme", themeNames),
        dynamicTitle: true,
      },
    },
    themeMode: {
      description: "Calendar theme mode",
      defaultValue: "light",
      toolbar: {
        title: "Mode",
        icon: "circlehollow",
        items: toToolbarItems("mode", ["light", "dark"]),
        dynamicTitle: true,
      },
    },
    appearance: {
      description: "Calendar appearance",
      defaultValue: "default",
      toolbar: {
        title: "Appearance",
        icon: "component",
        items: toToolbarItems("appearance", appearanceNames),
        dynamicTitle: true,
      },
    },
    locale: {
      description: "Calendar locale",
      defaultValue: "default",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: toToolbarItems("locale", localeNames),
        dynamicTitle: true,
      },
    },
    gradient: {
      description: "Calendar gradient",
      defaultValue: "off",
      toolbar: {
        title: "Gradient",
        icon: "lightning",
        items: toToolbarItems("gradient", ["off", "on"]),
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => {
      const viewportActive = Boolean(
        (ctx.globals.viewport as { value?: string } | undefined)?.value,
      );
      const style: React.CSSProperties = viewportActive
        ? { padding: 8, width: "100%", boxSizing: "border-box" }
        : { padding: 20, width: ctx.parameters.storyWidth ?? 305 };
      return (
        <div style={style}>
          <Story
            key={`${ctx.globals.theme}-${ctx.globals.themeMode}-${ctx.globals.appearance}-${ctx.globals.locale}-${ctx.globals.gradient}`}
          />
        </div>
      );
    },
  ],
  parameters: {
    viewport: {
      // Tuned to the calendar's container-query breakpoints
      // (13.75em / 16.25em / 21.25em ≈ 220 / 260 / 340 px at 16px root).
      options: {
        narrow: {
          name: "Narrow (220px)",
          styles: { width: "220px", height: "640px" },
          type: "mobile",
        },
        compact: {
          name: "Compact (260px)",
          styles: { width: "260px", height: "640px" },
          type: "mobile",
        },
        medium: {
          name: "Medium (340px)",
          styles: { width: "340px", height: "720px" },
          type: "mobile",
        },
        comfortable: {
          name: "Comfortable (480px)",
          styles: { width: "480px", height: "720px" },
          type: "tablet",
        },
        full: {
          name: "Full (800px)",
          styles: { width: "800px", height: "900px" },
          type: "desktop",
        },
      },
    },
    controls: {
      disableSaveFromUI: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "error",
      // `aria-hidden` elements are excluded from the accessibility tree, so
      // their visual contrast is not consumed by assistive tech. Axe still
      // flags `color-contrast` on them by default (e.g. opacity-faded
      // decorations in TimeTrack drum picker). Skip the rule for them.
      config: {
        rules: [
          {
            id: "color-contrast",
            selector: '*:not([aria-hidden="true"], [aria-hidden="true"] *)',
          },
        ],
      },
    },
    // Default Storybook layout is "padded". We avoid "centered" globally
    // because it wraps `<body>` in a flex container that collapses our
    // viewport-driven `width: 100%` wrapper to 0px (storybook-root is itself
    // a flex child with no intrinsic width).
    layout: "padded",
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Compositions",
          "Modes",
          "Modules",
          "Patterns",
          "Timezone",
          "Theming",
        ],
        locales: "en-US",
      },
    },
  },
};

export default preview;
