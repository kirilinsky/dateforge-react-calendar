import React, { useEffect, useMemo, useRef, useState } from "react";
import { CalendarProps } from "@/types/calendar";
import { CalendarProvider } from "@/components/provider/provider";
import { getGridLayout, getLayoutMode } from "@/helpers/get-grid-layout";
import { CalendarLayout } from "../layout/layout";

export const Calendar: React.FC<CalendarProps> = ({
  width = "100%",
  theme = "paper",
  presets = false,
  compactMonths = false,
  compactYears = true,
  years = false,
  time = true,
  timeGrid = false,
  months = true,
  hour12 = false,
  monthsGrid = false,
  locale = "en",
  startOfWeek = 1,
  brutalism = false,
  gradient = false,
  highlightWeekends = true,
  mode,
  max,
  showSelectedDates = false,
  twoMonthsLayout = false,
  monthsColumn = false,
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

  const layoutMode = getLayoutMode(containerWidth, { monthsGrid, timeGrid, twoMonthsLayout, monthsColumn });

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
      brutalism={brutalism}
      gradient={gradient}
      highlightWeekends={highlightWeekends}
      theme={theme}
      width={width}
      mode={mode}
      max={max}
      showSelectedDates={showSelectedDates}
      twoMonthsLayout={twoMonthsLayout}
      monthsColumn={monthsColumn}
      containerWidth={containerWidth}
      {...restProps}
    >
      <div
        ref={wrapperRef}
        data-theme={theme}
        data-layout={layoutMode}
        style={{ containerType: "inline-size", width }}
      >
        <CalendarLayout containerStyle={containerStyle} brutalism={brutalism} />
      </div>
    </CalendarProvider>
  );
};
