export type AppearanceTokens = {
  radius: string;
  containerRadius: string;
  border: string;
  containerGap: string;
  spacing: string;
  headerPadding: string;
  headerMinHeight: string;
  navButtonBg: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  transition: string;
  font: string;
  fontSize: string;
  dayFontSize: string;
  dayWeight: string;
  controlFontSize: string;
  daysSpacing: string;
  trackHeight: string;
  dayRatio: string;
  popupPadding: string;
  chipSize: string;
  trackItemSize: string;
  opacityDisabled: string;
  opacityMuted: string;
  opacityHover: string;
  letterSpacing: string;
  todayOutlineWidth: string;
  selectedDayWeight: string;
  selectedTextDotSize: string;
  selectedTextDotOffset: string;
};

export const APPEARANCE_TOKEN_TO_VAR: Record<keyof AppearanceTokens, string> = {
  radius: "--cal-radius",
  containerRadius: "--cal-container-radius",
  border: "--cal-border",
  containerGap: "--cal-container-gap",
  spacing: "--cal-spacing",
  headerPadding: "--header-padding",
  headerMinHeight: "--header-min-height",
  navButtonBg: "--cal-nav-button-bg",
  shadowSm: "--cal-shadow-sm",
  shadowMd: "--cal-shadow-md",
  shadowLg: "--cal-shadow-lg",
  transition: "--cal-transition",
  font: "--cal-font",
  fontSize: "--cal-font-size",
  dayFontSize: "--cal-text-day",
  dayWeight: "--cal-day-weight",
  controlFontSize: "--cal-text-lg",
  daysSpacing: "--cal-days-padding",
  trackHeight: "--cal-track-height",
  dayRatio: "--cal-day-ratio",
  popupPadding: "--cal-popup-padding",
  chipSize: "--cal-size-chip",
  trackItemSize: "--cal-size-track-item",
  opacityDisabled: "--cal-opacity-disabled",
  opacityMuted: "--cal-opacity-muted",
  opacityHover: "--cal-opacity-hover",
  letterSpacing: "--cal-letter-spacing",
  todayOutlineWidth: "--cal-today-outline-width",
  selectedDayWeight: "--cal-selected-day-weight",
  selectedTextDotSize: "--cal-selected-text-dot-size",
  selectedTextDotOffset: "--cal-selected-text-dot-offset",
};

export const CUSTOM_APPEARANCE_BRAND = Symbol.for("rcd.appearance.custom");

export type CustomAppearance = {
  readonly [CUSTOM_APPEARANCE_BRAND]: true;
  readonly vars: Record<string, string>;
};

export type CalendarAppearance = CustomAppearance | (string & {});
