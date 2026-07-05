/**
 * Bridge from the Storybook top-toolbar globals (Theme / Mode dropdowns,
 * defined in .storybook/preview.tsx) to v3 `<Calendar>` props.
 *
 * The dropdown lists v2 family names, but v2 and v3 themes are generated from
 * the same `styles-v3/theme-source.ts` data, so the names match the v3 `data-theme`
 * families 1:1. `"default"` keeps the story's own theme (v3 default `noir`).
 */
/** Locales offered by the Storybook toolbar Locale dropdown. */
export const STORY_LOCALES = [
  "default",
  "en-US",
  "en-GB",
  "de-DE",
  "fr-FR",
  "es-ES",
  "it-IT",
  "pt-BR",
  "ru-RU",
  "pl-PL",
  "tr-TR",
  "ar-EG",
  "he-IL",
  "fa-IR",
  "ja-JP",
  "ko-KR",
  "zh-CN",
  "hi-IN",
  "th-TH",
] as const;

export type V3StoryThemeProps = {
  theme?: string;
  appearance?: string;
  gradient?: boolean;
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
    gradient: globals.gradient === "on" || undefined,
    scheme: globals.themeMode === "dark" ? "dark" : "light",
  };
}

/**
 * Resolve the Storybook `locale` global into `CalendarConfig` overrides. Spread
 * into a story's `buildConfig({ ...storyLocale(ctx.globals), … })` so the header
 * Locale dropdown drives every v3 story's Intl formatting (month/weekday names,
 * digits, direction). `"default"` (or an unset global) returns `undefined` — the
 * story keeps its own locale.
 *
 * Also re-derives `firstDayOfWeek` from the locale via `Intl.Locale.getWeekInfo`
 * (where supported), so switching to e.g. `en-US` moves the week start to Sunday
 * — not just the labels. Falls back to leaving `firstDayOfWeek` to the story.
 */
export function storyLocale(
  globals: Record<string, unknown>,
): { locale: string; firstDayOfWeek?: number } | undefined {
  const value = globals.locale;
  if (typeof value !== "string" || value === "default") return undefined;
  let firstDayOfWeek: number | undefined;
  try {
    // getWeekInfo().firstDay is 1=Mon‥7=Sun; our config is 0=Sun‥6=Sat.
    // Not in the TS lib types yet, so reach for it defensively.
    const loc = new Intl.Locale(value) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
    };
    const info = loc.getWeekInfo?.();
    if (info) firstDayOfWeek = info.firstDay % 7;
  } catch {
    // Older engines: leave the week start to the story's config.
  }
  return firstDayOfWeek === undefined
    ? { locale: value }
    : { locale: value, firstDayOfWeek };
}
