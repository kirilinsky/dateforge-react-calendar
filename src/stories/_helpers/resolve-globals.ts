import * as appearances from "../../../appearances/index";
import * as themes from "../../../themes/index";
import type { CalendarAppearance } from "../../types/appearances";
import type { CalendarTheme } from "../../types/themes";

export const resolveStoryTheme = (key: unknown): CalendarTheme | undefined => {
  if (key === "default" || typeof key !== "string") return undefined;
  return (themes as Record<string, CalendarTheme>)[key];
};

export const resolveStoryThemeMode = (
  key: unknown,
): { light?: boolean; dark?: boolean } => {
  if (key === "dark" || key === "dark mode") return { dark: true };
  return { light: true };
};

export const resolveStoryAppearance = (
  key: unknown,
): CalendarAppearance | undefined => {
  if (key === "default" || typeof key !== "string") return undefined;
  return (appearances as Record<string, CalendarAppearance>)[key];
};

export const STORY_LOCALES = [
  "default",
  "en-US",
  "en-GB",
  "ru-RU",
  "de-DE",
  "fr-FR",
  "es-ES",
  "it-IT",
  "ja-JP",
  "zh-CN",
  "ar-EG",
] as const;

export const resolveStoryLocale = (key: unknown): string | undefined => {
  if (key === "default" || typeof key !== "string") return undefined;
  return key;
};

export const resolveStoryGradient = (key: unknown): boolean | undefined => {
  if (key === "on" || key === "gradient on") return true;
  if (key === "off" || key === "gradient off") return false;
  return undefined;
};
