import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarProps } from "@/types/calendar";
import { DARK_THEMES, CustomTheme } from "@/types/themes";
import { CustomAppearance } from "@/types/appearances";
import { CalendarProvider } from "@/components/provider/provider";
import { getGridLayout, getLayoutMode } from "@/helpers/get-grid-layout";
import { CalendarLayout } from "../layout/layout";

const isCustomTheme = (t: unknown): t is CustomTheme =>
  typeof t === "object" && t !== null && (t as CustomTheme).__type === "custom";

const isCustomAppearance = (a: unknown): a is CustomAppearance =>
  typeof a === "object" && a !== null && (a as CustomAppearance).__type === "custom-appearance";

export const Calendar: React.FC<CalendarProps> = ({
  width = "100%",
  theme: themeProp,
  appearance: appearanceProp,
  presets = false,
  compactMonths = false,
  manualSelect = false,
  compactYears = true,
  years = false,
  time = true,
  timeGrid = false,
  months = true,
  hour12 = false,
  monthsGrid = false,
  locale = "en",
  startOfWeek = 1,
  gradient = false,
  highlightWeekends = true,
  mode,
  max,
  showSelectedDates = false,
  twoMonthsLayout = false,
  monthsColumn = false,
  highlightToday = true,
  ...restProps
}) => {
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

  const containerStyle = useMemo(
    () =>
      ({
        width,
        ...getGridLayout(
          {
            presets,
            compactMonths,
            manualSelect,
            compactYears,
            years,
            timeGrid,
            time,
            months,
            monthsGrid,
            selectedDates: showSelectedDates,
            twoMonthsLayout,
            monthsColumn,
          },
          containerWidth,
        ),
      }) as React.CSSProperties,
    [
      width,
      presets,
      compactYears,
      compactMonths,
      manualSelect,
      years,
      time,
      timeGrid,
      months,
      monthsGrid,
      showSelectedDates,
      twoMonthsLayout,
      monthsColumn,
      containerWidth,
    ],
  );

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

  const layoutMode = getLayoutMode(containerWidth, {
    monthsGrid,
    timeGrid,
    twoMonthsLayout,
    monthsColumn,
  });

  const customAppearance = isCustomAppearance(appearanceProp) ? appearanceProp : undefined;
  const appearanceKey = customAppearance ? undefined : (appearanceProp as string | undefined);
  const customThemeVars = customTheme?.vars as React.CSSProperties | undefined;
  const customAppearanceVars = customAppearance?.vars as React.CSSProperties | undefined;

  return (
    <CalendarProvider
      locale={locale}
      presets={presets}
      compactMonths={compactMonths}
      compactYears={compactYears}
      years={years}
      time={time}
      hour12={hour12}
      timeGrid={timeGrid}
      months={months}
      monthsGrid={monthsGrid}
      startOfWeek={startOfWeek}
      appearance={appearanceProp}
      gradient={gradient}
      highlightWeekends={highlightWeekends}
      theme={themeProp}
      width={width}
      mode={mode}
      max={max}
      showSelectedDates={showSelectedDates}
      manualSelect={manualSelect}
      twoMonthsLayout={twoMonthsLayout}
      monthsColumn={monthsColumn}
      highlightToday={highlightToday}
      containerWidth={containerWidth}
      toggleTheme={toggleTheme}
      {...restProps}
    >
      <div
        ref={wrapperRef}
        data-theme={activeTheme}
        data-layout={layoutMode}
        style={{ containerType: "inline-size", width, ...customThemeVars }}
      >
        <CalendarLayout
          containerStyle={containerStyle}
          appearanceKey={appearanceKey}
          customAppearanceVars={customAppearanceVars}
        />
      </div>
    </CalendarProvider>
  );
};
