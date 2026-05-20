import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import "@/styles/layers.css";
import "@/styles/tokens.css";
import { validateTheme, validateThemeModeFlags } from "@/core/dev-warn";
import { CalendarLayout } from "@/core/layout";
import { CalendarProvider } from "@/core/provider";
import {
  CUSTOM_APPEARANCE_BRAND,
  type CustomAppearance,
} from "@/types/appearances";
import type {
  CalendarActionLabels,
  CalendarMode,
  CalendarProps,
} from "@/types/calendar";
import { isThemeFamily } from "@/utils/resolve-theme-scope";

const isCustomAppearance = (a: unknown): a is CustomAppearance =>
  typeof a === "object" &&
  a !== null &&
  CUSTOM_APPEARANCE_BRAND in (a as object);

export function Calendar<M extends CalendarMode = "single">({
  width = "100%",
  theme: themeProp,
  light = false,
  dark = false,
  appearance: appearanceProp,
  hour12 = false,
  locale = "en",
  gradient = false,
  motion = "none",
  mode,
  maxDates,
  cols,
  children,
  readOnly = false,
  "data-testid": testId = "dateforge-calendar",
  ...restProps
}: CalendarProps<M>) {
  const reactId = useId();
  const [isToggled, setIsToggled] = useState(false);
  const motionNames = useMemo(() => {
    const id = reactId.replace(/[^a-zA-Z0-9_-]/g, "");
    return {
      days: `cal-${id}-days`,
      popup: `cal-${id}-popup`,
    };
  }, [reactId]);

  // Resolved system theme — known only after mount via matchMedia. Before mount
  // we render `data-theme="auto"` so CSS handles the light/dark choice via
  // `@media (prefers-color-scheme: dark)` — no white flash on dark systems.
  const [systemTheme, setSystemTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mq.matches ? "dark" : "light");
    const handler = (e: MediaQueryListEvent) =>
      setSystemTheme(e.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const customThemeFamily = isThemeFamily(themeProp) ? themeProp : undefined;
  const rawThemeKey = customThemeFamily
    ? undefined
    : (themeProp as string | undefined);
  const themeKeyFromProp =
    rawThemeKey === "auto" ||
    rawThemeKey === "light" ||
    rawThemeKey === "dark" ||
    rawThemeKey === undefined
      ? rawThemeKey
      : undefined;
  const themeKey = dark ? "dark" : light ? "light" : themeKeyFromProp;
  const isAutoTheme = !themeKey || themeKey === "auto";
  // baseTheme used only when systemTheme is resolved (post-mount) or theme is
  // explicit. Pre-mount auto skips this branch via activeTheme === "auto".
  const baseTheme: "light" | "dark" = isAutoTheme
    ? (systemTheme ?? "light")
    : (themeKey as "light" | "dark");

  useEffect(() => {
    setIsToggled(false);
    validateTheme(themeProp);
    validateThemeModeFlags(light, dark);
  }, [themeProp, light, dark]);

  const isBaseDark = baseTheme === "dark";
  const toggledTheme: "light" | "dark" = isBaseDark ? "light" : "dark";
  const resolvedTheme: "light" | "dark" = isToggled ? toggledTheme : baseTheme;
  const activeTheme: "light" | "dark" | "auto" = customThemeFamily
    ? resolvedTheme
    : isAutoTheme && systemTheme === null && !isToggled
      ? "auto"
      : resolvedTheme;
  const toggleTheme = () => setIsToggled((v) => !v);

  const customAppearance = isCustomAppearance(appearanceProp)
    ? appearanceProp
    : undefined;
  const resolvedThemeVariant =
    customThemeFamily && activeTheme !== "auto"
      ? customThemeFamily[activeTheme]
      : undefined;
  const themeVariantVars = resolvedThemeVariant?.vars as
    | React.CSSProperties
    | undefined;
  const customAppearanceVars = customAppearance?.vars as
    | React.CSSProperties
    | undefined;

  return (
    <CalendarProvider
      locale={locale}
      hour12={hour12}
      gradient={gradient}
      width={width}
      mode={mode}
      maxDates={maxDates}
      readOnly={readOnly}
      toggleTheme={toggleTheme}
      activeTheme={activeTheme}
      motion={motion}
      motionNames={motionNames}
      actionLabels={restProps as CalendarActionLabels}
      {...(restProps as import("@/types/calendar").CalendarProps<CalendarMode>)}
    >
      <div
        data-theme={activeTheme}
        data-readonly={readOnly || undefined}
        data-testid={testId}
        style={{ containerType: "inline-size", width, ...themeVariantVars }}
      >
        <CalendarLayout
          customAppearanceVars={customAppearanceVars}
          cols={cols}
          modules={children}
        />
      </div>
    </CalendarProvider>
  );
}
