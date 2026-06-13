/**
 * Bridge from the Storybook top-toolbar globals (Theme / Mode dropdowns,
 * defined in .storybook/preview.tsx) to v3 `<Calendar>` props.
 *
 * The dropdown lists v2 family names, but v2 and v3 themes are generated from
 * the same `themes/themes.ts` data, so the names match the v3 `data-theme`
 * families 1:1. `"default"` keeps the story's own theme (v3 default `noir`).
 */
export type V3StoryThemeProps = {
  theme?: string;
  appearance?: string;
  scheme: "light" | "dark";
};

export function storyThemeProps(
  globals: Record<string, unknown>,
): V3StoryThemeProps {
  const theme =
    typeof globals.theme === "string" && globals.theme !== "default"
      ? globals.theme
      : undefined;
  const appearance =
    typeof globals.appearance === "string" && globals.appearance !== "default"
      ? globals.appearance
      : undefined;
  return {
    theme,
    appearance,
    scheme: globals.themeMode === "dark" ? "dark" : "light",
  };
}
