import type { Preview } from "@storybook/react-vite";
import * as appearances from "../appearances/index";
import { STORY_LOCALES } from "../src/stories/_helpers/resolve-globals";
import * as themes from "../themes/index";
import "../dist/style.css";

const themeNames = ["auto", "light", "dark", ...Object.keys(themes)];
const appearanceNames = ["default", ...Object.keys(appearances)];
const localeNames = [...STORY_LOCALES];

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Calendar theme",
      defaultValue: "auto",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: themeNames,
        dynamicTitle: true,
      },
    },
    appearance: {
      description: "Calendar appearance",
      defaultValue: "default",
      toolbar: {
        title: "Appearance",
        icon: "component",
        items: appearanceNames,
        dynamicTitle: true,
      },
    },
    locale: {
      description: "Calendar locale",
      defaultValue: "default",
      toolbar: {
        title: "Locale",
        icon: "globe",
        items: localeNames,
        dynamicTitle: true,
      },
    },
    gradient: {
      description: "Calendar gradient",
      defaultValue: "off",
      toolbar: {
        title: "Gradient",
        icon: "lightning",
        items: ["gradient off", "gradient on"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, ctx) => (
      <div style={{ padding: 20, width: ctx.parameters.storyWidth ?? 305 }}>
        <Story
          key={`${ctx.globals.theme}-${ctx.globals.appearance}-${ctx.globals.locale}-${ctx.globals.gradient}`}
        />
      </div>
    ),
  ],
  parameters: {
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
    layout: "centered",
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
