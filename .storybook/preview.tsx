import type { Preview } from "@storybook/react-vite";
import * as themes from "../themes/index";
import * as appearances from "../appearances/index";
import "../dist/style.css";

const themeNames = ["auto", "light", "dark", ...Object.keys(themes)];
const appearanceNames = ["default", ...Object.keys(appearances)];

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
  },
  decorators: [
    (Story, ctx) => (
      <div style={{ padding: 20, width: ctx.parameters.storyWidth ?? 305 }}>
        <Story key={`${ctx.globals.theme}-${ctx.globals.appearance}`} />
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
      test: "todo",
    },
    layout: "centered",
  },
};

export default preview;
