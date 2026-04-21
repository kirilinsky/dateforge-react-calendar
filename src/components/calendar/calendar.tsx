import React, { useEffect, useRef, useState } from "react";
import "@/styles/layers.css";
import { CalendarMode, CalendarProps } from "@/types/calendar";
import { DARK_THEMES, CustomTheme } from "@/types/themes";
import { CustomAppearance } from "@/types/appearances";
import { CalendarProvider } from "@/components/provider/provider";
import { CalendarLayout } from "../layout/layout";

const isCustomTheme = (t: unknown): t is CustomTheme =>
  typeof t === "object" && t !== null && (t as CustomTheme).__type === "custom";

const isCustomAppearance = (a: unknown): a is CustomAppearance =>
  typeof a === "object" && a !== null && (a as CustomAppearance).__type === "custom-appearance";

export function Calendar<M extends CalendarMode = "single">({
  width = "100%",
  theme: themeProp,
  appearance: appearanceProp,
  hour12 = false,
  locale = "en",
  gradient = false,
  mode,
  max,
  cols,
  children,
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
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [isToggled, setIsToggled] = useState(false);

  const systemTheme = useState<"light" | "dark">(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  )[0];

  const customTheme = isCustomTheme(themeProp) ? themeProp : undefined;
  const themeKey = customTheme
    ? customTheme.base
    : (themeProp as string | undefined);

  const baseTheme = !themeKey || themeKey === "auto" ? systemTheme : themeKey;

  useEffect(() => {
    setIsToggled(false);
  }, [themeProp]);

  const isBaseDark =
    baseTheme === "dark" ||
    (DARK_THEMES as readonly string[]).includes(baseTheme);

  const activeTheme = isToggled ? (isBaseDark ? "light" : "dark") : baseTheme;
  const toggleTheme = () => setIsToggled((v) => !v);

  const customAppearance = isCustomAppearance(appearanceProp) ? appearanceProp : undefined;
  const appearanceKey = customAppearance ? undefined : (appearanceProp as string | undefined);
  const customThemeVars = customTheme?.vars as React.CSSProperties | undefined;
  const customAppearanceVars = customAppearance?.vars as React.CSSProperties | undefined;

  return (
    <CalendarProvider
      locale={locale}
      hour12={hour12}
      appearance={appearanceProp}
      gradient={gradient}
      isDark={
        activeTheme === "dark" ||
        (DARK_THEMES as readonly string[]).includes(activeTheme)
      }
      width={width}
      mode={mode}
      max={max}
      containerWidth={containerWidth}
      toggleTheme={toggleTheme}
      {...(restProps as import("@/types/calendar").CalendarProps<CalendarMode>)}
    >
      <div
        ref={wrapperRef}
        data-theme={activeTheme}
        style={{ containerType: "inline-size", width, ...customThemeVars }}
      >
        <CalendarLayout
          appearanceKey={appearanceKey}
          customAppearanceVars={customAppearanceVars}
          cols={cols}
          modules={children}
        />
      </div>
    </CalendarProvider>
  );
}
