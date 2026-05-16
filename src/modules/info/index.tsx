import type React from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { useToday } from "@/hooks/use-today";
import { Home } from "@/Icons";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { type AlignValue, alignToJustify } from "@/utils/layout-utils";
import styles from "./info.module.css";
import {
  type CalendarInfoRangeStyle,
  formatCalendarInfoRangeSummary,
  formatCalendarInfoRelative,
  formatCalendarInfoSelectionSummary,
  getCalendarDayIndex,
  getTargetPaddingY,
  isValidDate,
} from "./utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const hasRenderableNode = (node: React.ReactNode) =>
  node !== null &&
  node !== undefined &&
  node !== "" &&
  typeof node !== "boolean";

export type { CalendarInfoRangeStyle } from "./utils";

export interface CalendarInfoRangeValue {
  from: Date | null;
  to: Date | null;
}

export type CalendarInfoValue = Date | Date[] | CalendarInfoRangeValue | null;

export type CalendarInfoFormatter = (
  value: CalendarInfoValue,
) => React.ReactNode;

export interface CalendarInfoProps {
  allowClear?: boolean;
  align?: AlignValue;
  animated?: boolean;
  col?: number | string;
  emptyLabel?: React.ReactNode;
  formatter?: CalendarInfoFormatter;
  prefix?: React.ReactNode;
  rangeStyle?: CalendarInfoRangeStyle;
  showHome?: boolean;
  showRelative?: boolean;
  showSummary?: boolean;
}

export const CalendarInfo: React.FC<CalendarInfoProps> = ({
  allowClear = false,
  align = "left",
  animated = true,
  col,
  emptyLabel = null,
  formatter,
  prefix,
  rangeStyle = "days",
  showHome = false,
  showRelative = false,
  showSummary = true,
}) => {
  const [innerHeight, setInnerHeight] = useState<number | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const contentGroupRef = useRef<HTMLDivElement>(null);
  const homeBtnRef = useRef<HTMLButtonElement>(null);
  const clearBtnRef = useRef<HTMLButtonElement>(null);
  const { locale, multiselect, range, readOnly, timeZone } = useConfig();
  const { viewDate, navigateTo } = useNavigation();
  const today = useToday();
  const { selectedDate, selectedDates, rangeStart, rangeEnd } =
    useSelectionValue();
  const { onChangeDate, onDatesSet, onRangeSet } = useSelectionActions();

  const selectedValue = useMemo<CalendarInfoValue>(() => {
    if (range) {
      return rangeStart || rangeEnd ? { from: rangeStart, to: rangeEnd } : null;
    }
    if (multiselect) return selectedDates.length > 0 ? selectedDates : null;
    return selectedDate;
  }, [multiselect, range, rangeEnd, rangeStart, selectedDate, selectedDates]);

  const relativeDate = useMemo(
    () => selectedDate ?? selectedDates[0] ?? rangeStart ?? rangeEnd,
    [rangeEnd, rangeStart, selectedDate, selectedDates],
  );

  const hasSelection = selectedValue !== null;
  const isCurrentMonth =
    !!today &&
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();
  const shouldShowEmptyStateLabel =
    !hasSelection && hasRenderableNode(emptyLabel);

  const summary = useMemo(() => {
    if (shouldShowEmptyStateLabel) return emptyLabel;
    if (!showSummary || !hasSelection) return null;
    if (formatter) return formatter(selectedValue);

    if (range) {
      if (!rangeStart || !rangeEnd) return null;
      const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
      const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
      const durationDays = Math.abs(
        getCalendarDayIndex(to, timeZone) - getCalendarDayIndex(from, timeZone),
      );
      return formatCalendarInfoRangeSummary({
        durationDays,
        durationMs: to.getTime() - from.getTime(),
        locale,
        rangeStyle,
      });
    }

    if (Array.isArray(selectedValue)) {
      return formatCalendarInfoSelectionSummary(selectedValue.length, locale);
    }

    return formatCalendarInfoSelectionSummary(1, locale);
  }, [
    emptyLabel,
    formatter,
    hasSelection,
    locale,
    range,
    rangeEnd,
    rangeStart,
    rangeStyle,
    selectedValue,
    shouldShowEmptyStateLabel,
    showSummary,
    timeZone,
  ]);

  const relativeSummary = useMemo(
    () =>
      showRelative && hasSelection && isValidDate(relativeDate)
        ? formatCalendarInfoRelative({
            baseDate: today,
            locale,
            targetDate: relativeDate,
            timeZone,
          })
        : null,
    [hasSelection, locale, relativeDate, showRelative, today, timeZone],
  );

  const hasSummary = hasRenderableNode(summary);
  const hasRelativeSummary = hasRenderableNode(relativeSummary);
  const hasPrefix =
    !shouldShowEmptyStateLabel && hasSummary && hasRenderableNode(prefix);
  const hasClearBtn = allowClear && hasSelection;
  const hasTextContent = hasSummary || hasRelativeSummary;
  const hasContent = hasTextContent || showHome || hasClearBtn;

  useIsoLayoutEffect(() => {
    if (!animated) {
      setInnerHeight(null);
      return;
    }

    if (!hasContent) {
      setInnerHeight(0);
      return;
    }

    const inner = innerRef.current;
    const contentGroup = contentGroupRef.current;
    if (!inner || !contentGroup) return;

    const measure = () => {
      const computedStyle = window.getComputedStyle(inner);
      const paddingY = getTargetPaddingY(inner, computedStyle);
      const contentHeight = Math.max(
        contentGroup.scrollHeight,
        homeBtnRef.current?.offsetHeight ?? 0,
        clearBtnRef.current?.offsetHeight ?? 0,
      );

      setInnerHeight(Math.ceil(contentHeight + paddingY));
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(contentGroup);
    if (homeBtnRef.current) resizeObserver.observe(homeBtnRef.current);
    if (clearBtnRef.current) resizeObserver.observe(clearBtnRef.current);

    return () => resizeObserver.disconnect();
  }, [
    animated,
    hasContent,
    align,
    summary,
    relativeSummary,
    hasPrefix,
    hasClearBtn,
    showHome,
  ]);

  const handleClear = () => {
    if (readOnly) return;
    if (range) {
      onRangeSet(null, null);
      return;
    }
    if (multiselect) {
      onDatesSet([]);
      return;
    }
    onChangeDate(null);
  };

  const goHome = () => {
    if (!today) return;
    const next = new Date(viewDate);
    next.setFullYear(today.getFullYear());
    next.setMonth(today.getMonth(), 1);
    navigateTo(next);
  };

  if (!animated && !hasContent) return null;

  const innerStyle = animated
    ? ({
        "--calendar-info-inner-height": `${innerHeight ?? 0}px`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={[
        styles.infoContainer,
        animated ? styles.animated : "",
        animated && hasContent ? styles.visible : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-area="calendar-info"
      style={getGridSlotStyle(col)}
    >
      <div ref={innerRef} className={styles.inner} style={innerStyle}>
        <div
          ref={contentGroupRef}
          className={styles.contentGroup}
          role={hasTextContent ? "status" : undefined}
          aria-live={hasTextContent ? "polite" : undefined}
          style={{ justifyContent: alignToJustify[align] }}
        >
          {hasSummary && (
            <div className={styles.infoText}>
              {hasPrefix && <span className={styles.prefix}>{prefix}</span>}
              {summary}
            </div>
          )}
          {hasRelativeSummary && (
            <div className={styles.infoText}>{relativeSummary}</div>
          )}
        </div>
        {showHome && (
          <button
            ref={homeBtnRef}
            type="button"
            aria-label="Go to current month"
            className={`${styles.actionBtn} ${shared.interactive} ${shared.hovered} ${!today || isCurrentMonth ? styles.actionBtnDisabled : ""}`}
            onClick={goHome}
            disabled={!today || isCurrentMonth}
          >
            <Home />
          </button>
        )}
        {hasClearBtn && (
          <button
            ref={clearBtnRef}
            type="button"
            aria-label="Clear"
            className={`${styles.clearBtn} ${styles.actionBtn} ${shared.interactive} ${shared.hovered}`}
            onClick={handleClear}
            disabled={readOnly}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};
