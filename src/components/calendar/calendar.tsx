import React, { useEffect, useRef, useState } from "react";
import "@/styles/layers.css";
import { CalendarMode, CalendarProps } from "@/types/calendar";
import { CustomTheme, CUSTOM_THEME_BRAND } from "@/types/themes";
import { CustomAppearance, CUSTOM_APPEARANCE_BRAND } from "@/types/appearances";
import { CalendarProvider } from "@/core/provider";
import { CalendarLayout } from "@/core/layout";
import { validateTheme } from "@/core/dev-warn";

const isCustomTheme = (t: unknown): t is CustomTheme =>
  typeof t === "object" && t !== null && CUSTOM_THEME_BRAND in (t as object);

const isCustomAppearance = (a: unknown): a is CustomAppearance =>
  typeof a === "object" && a !== null && CUSTOM_APPEARANCE_BRAND in (a as object);

export function Calendar<M extends CalendarMode = "single">({
  width = "100%",
  theme: themeProp,
  appearance: appearanceProp,
  hour12 = false,
  locale = "en",
  gradient = false,
  mode,
  maxDates,
  cols,
  children,
  readOnly = false,
  ...restProps
}: CalendarProps<M>) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(() => {
    if (typeof width === "number") return width;
    if (typeof width === "string" && width.endsWith("px"))
      return parseFloat(width);
    return 800;
  });

  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [isToggled, setIsToggled] = useState(false);

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

  const customTheme = isCustomTheme(themeProp) ? themeProp : undefined;
  const rawThemeKey = customTheme ? undefined : (themeProp as string | undefined);
  const themeKey =
    rawThemeKey === "auto" ||
    rawThemeKey === "light" ||
    rawThemeKey === "dark" ||
    rawThemeKey === undefined
      ? rawThemeKey
      : undefined;
  const isAutoTheme = !themeKey || themeKey === "auto";
  // baseTheme used only when systemTheme is resolved (post-mount) or theme is
  // explicit. Pre-mount auto skips this branch via activeTheme === "auto".
  const baseTheme: "light" | "dark" =
    isAutoTheme ? (systemTheme ?? "light") : (themeKey as "light" | "dark");

  useEffect(() => {
    setIsToggled(false);
    validateTheme(themeProp);
  }, [themeProp]);

  const isBaseDark = baseTheme === "dark";
  const activeTheme: "light" | "dark" | "auto" = customTheme
    ? baseTheme
    : isAutoTheme && systemTheme === null && !isToggled
      ? "auto"
      : isToggled
        ? (isBaseDark ? "light" : "dark")
        : baseTheme;
  const toggleTheme = () => setIsToggled((v) => !v);

  const customAppearance = isCustomAppearance(appearanceProp) ? appearanceProp : undefined;
  const customThemeVars = customTheme?.vars as React.CSSProperties | undefined;
  const customAppearanceVars = customAppearance?.vars as React.CSSProperties | undefined;

  return (
    <CalendarProvider
      locale={locale}
      hour12={hour12}
      gradient={gradient}

      width={width}
      mode={mode}
      maxDates={maxDates}
      readOnly={readOnly}
      containerWidth={containerWidth}
      toggleTheme={toggleTheme}
      {...(restProps as import("@/types/calendar").CalendarProps<CalendarMode>)}
    >
      <div
        ref={wrapperRef}
        data-theme={activeTheme}
        data-readonly={readOnly || undefined}
        style={{ containerType: "inline-size", width, ...customThemeVars }}
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
