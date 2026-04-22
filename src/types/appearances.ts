export type AppearanceTokens = {
  radius: string;
  containerRadius: string;
  border: string;
  spacing: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  transition: string;
  font: string;
  fontSize: string;
  daysSpacing: string;
  trackHeight: string;
};

export const APPEARANCE_TOKEN_TO_VAR: Record<keyof AppearanceTokens, string> = {
  radius:          "--cal-radius",
  containerRadius: "--cal-container-radius",
  border:          "--cal-border",
  spacing:         "--cal-spacing",
  shadowSm:        "--cal-shadow-sm",
  shadowMd:        "--cal-shadow-md",
  shadowLg:        "--cal-shadow-lg",
  transition:      "--cal-transition",
  font:            "--cal-font",
  fontSize:        "--cal-font-size",
  daysSpacing:     "--cal-days-padding",
  trackHeight:     "--cal-track-height",
};

export const CUSTOM_APPEARANCE_BRAND = Symbol.for("rcd.appearance.custom");

export type CustomAppearance = {
  readonly [CUSTOM_APPEARANCE_BRAND]: true;
  readonly vars: Record<string, string>;
};

export type BuiltInAppearance = "default" | "soft" | "compact" | "square" | "bubble";

export type CalendarAppearance =
  | BuiltInAppearance
  | CustomAppearance
  | (string & {});
