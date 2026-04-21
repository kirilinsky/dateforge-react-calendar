export type AppearanceTokens = {
  radius: string;
  containerRadius: string;
  border: string;
  spacing: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
};

export const APPEARANCE_TOKEN_TO_VAR: Record<keyof AppearanceTokens, string> = {
  radius:          "--cal-radius",
  containerRadius: "--cal-container-radius",
  border:          "--cal-border",
  spacing:         "--cal-spacing",
  shadowSm:        "--cal-shadow-sm",
  shadowMd:        "--cal-shadow-md",
  shadowLg:        "--cal-shadow-lg",
};

export type CustomAppearance = {
  readonly __type: "custom-appearance";
  readonly vars: Record<string, string>;
};

export type BuiltInAppearance = "default" | "soft" | "compact" | "square" | "bubble";

export type CalendarAppearance =
  | BuiltInAppearance
  | CustomAppearance
  | (string & {});
