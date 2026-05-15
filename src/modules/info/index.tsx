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
  type CalendarInfoFormatHelpers,
  type CalendarInfoRangeStyle,
  type CalendarInfoRelativeTarget,
  type CalendarInfoSelectionCountFormatter,
  type CalendarInfoUnitFormatter,
  createCalendarInfoFormatters,
  formatCalendarInfoRangeSummary,
  getCalendarDayIndex,
  getRelativeTargetDate,
  getTargetPaddingY,
  isValidDate,
} from "./utils";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type CalendarInfoVariant = "summary" | "relative";
export type {
  CalendarInfoFormatContext,
  CalendarInfoFormatHelpers,
  CalendarInfoRangeStyle,
  CalendarInfoRelativeTarget,
  CalendarInfoUnit,
} from "./utils";

export interface CalendarInfoFormatterContext
  extends CalendarInfoFormatHelpers {
  hour12: boolean;
  locale: string;
  timeZone?: string;
  selectedDate: Date | null;
  selectedDates: Date[];
  rangeStart: Date | null;
  rangeEnd: Date | null;
  relativeBaseDate: Date | null;
}

export interface CalendarInfoRangeFormatterContext
  extends CalendarInfoFormatterContext {
  from: Date;
  to: Date;
  durationDays: number;
  durationMs: number;
  nights: number;
}

export interface CalendarInfoCountFormatterContext
  extends CalendarInfoFormatterContext {
  count: number;
}

export interface CalendarInfoSingleFormatterContext
  extends CalendarInfoFormatterContext {
  date: Date;
}

export interface CalendarInfoProps {
  allowClear?: boolean;
  align?: AlignValue;
  animated?: boolean;
  col?: number | string;
  emptyLabel?: React.ReactNode;
  formatter?: (context: CalendarInfoFormatterContext) => React.ReactNode;
  label?: React.ReactNode;
  multipleFormatter?: (
    context: CalendarInfoCountFormatterContext,
  ) => React.ReactNode;
  rangeDateOptions?: Intl.DateTimeFormatOptions;
  rangeFormatter?: (
    context: CalendarInfoRangeFormatterContext,
  ) => React.ReactNode;
  rangeLabel?: string;
  rangeStyle?: CalendarInfoRangeStyle;
  relativeBaseDate?: Date;
  relativeTarget?: CalendarInfoRelativeTarget;
  showDurationInDays?: boolean;
  showHome?: boolean;
  showNights?: boolean;
  showRangeDates?: boolean;
  singleFormatter?: (
    context: CalendarInfoSingleFormatterContext,
  ) => React.ReactNode;
  selectionCountFormatter?: (
    ...args: Parameters<CalendarInfoSelectionCountFormatter>
  ) => ReturnType<CalendarInfoSelectionCountFormatter>;
  unitFormatter?: (
    ...args: Parameters<CalendarInfoUnitFormatter>
  ) => ReturnType<CalendarInfoUnitFormatter>;
  variant?: CalendarInfoVariant;
}

export const CalendarInfo: React.FC<CalendarInfoProps> = ({
  allowClear = false,
  align = "left",
  animated = true,
  col,
  emptyLabel = null,
  formatter,
  label,
  multipleFormatter,
  rangeDateOptions,
  rangeFormatter,
  rangeLabel,
  rangeStyle = "nights",
  relativeBaseDate,
  relativeTarget = "selected",
  showDurationInDays,
  showHome = false,
  showNights,
  showRangeDates = false,
  singleFormatter,
  selectionCountFormatter,
  unitFormatter,
  variant = "summary",
}) => {
  const [innerHeight, setInnerHeight] = useState<number | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const contentGroupRef = useRef<HTMLDivElement>(null);
  const { hour12, locale, multiselect, range, readOnly, timeZone } =
    useConfig();
  const { viewDate, navigateTo } = useNavigation();
  const today = useToday();
  const { selectedDate, selectedDates, rangeStart, rangeEnd } =
    useSelectionValue();
  const { onChangeDate, onDatesSet, onRangeSet } = useSelectionActions();

  const resolvedRelativeBaseDate = relativeBaseDate ?? today;
  const helpers = useMemo(
    () =>
      createCalendarInfoFormatters({
        hour12,
        locale,
        relativeBaseDate: resolvedRelativeBaseDate,
        selectionCountFormatter,
        timeZone,
        unitFormatter,
      }),
    [
      hour12,
      locale,
      resolvedRelativeBaseDate,
      selectionCountFormatter,
      timeZone,
      unitFormatter,
    ],
  );

  const context: CalendarInfoFormatterContext = {
    ...helpers,
    hour12,
    locale,
    timeZone,
    selectedDate,
    selectedDates,
    rangeStart,
    rangeEnd,
    relativeBaseDate: resolvedRelativeBaseDate,
  };

  const hasSelection = range
    ? !!(rangeStart || rangeEnd)
    : selectedDates.length > 0;
  const isCurrentMonth =
    !!today &&
    viewDate.getFullYear() === today.getFullYear() &&
    viewDate.getMonth() === today.getMonth();
  const emptyStateLabel = label ?? emptyLabel;
  const shouldShowEmptyStateLabel =
    !hasSelection &&
    emptyStateLabel !== null &&
    emptyStateLabel !== undefined &&
    emptyStateLabel !== "";

  const content = shouldShowEmptyStateLabel
    ? emptyStateLabel
    : formatter
      ? formatter(context)
      : (() => {
          if (variant === "relative") {
            const targetDate = getRelativeTargetDate(relativeTarget, context);
            if (!isValidDate(targetDate)) return emptyStateLabel;
            const relative = helpers.formatRelative(targetDate);
            return relative || emptyStateLabel;
          }

          if (range) {
            if (rangeStart && rangeEnd) {
              const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
              const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
              const nights = Math.abs(
                getCalendarDayIndex(to, timeZone) -
                  getCalendarDayIndex(from, timeZone),
              );
              const rangeContext: CalendarInfoRangeFormatterContext = {
                ...context,
                from,
                to,
                durationDays: nights,
                durationMs: to.getTime() - from.getTime(),
                nights,
              };
              if (rangeFormatter) return rangeFormatter(rangeContext);
              return formatCalendarInfoRangeSummary({
                context: rangeContext,
                hour12,
                helpers,
                locale,
                rangeDateOptions,
                rangeLabel,
                rangeStyle,
                showDurationInDays,
                showNights,
                showRangeDates,
                timeZone,
              });
            }
            return rangeStart || rangeEnd
              ? helpers.formatSelectionCount(1)
              : emptyStateLabel;
          }

          if (multiselect) {
            if (selectedDates.length === 0) return emptyStateLabel;
            const multipleContext: CalendarInfoCountFormatterContext = {
              ...context,
              count: selectedDates.length,
            };
            return multipleFormatter
              ? multipleFormatter(multipleContext)
              : helpers.formatSelectionCount(selectedDates.length);
          }

          if (!selectedDate) return emptyStateLabel;
          const singleContext: CalendarInfoSingleFormatterContext = {
            ...context,
            date: selectedDate,
          };
          return singleFormatter
            ? singleFormatter(singleContext)
            : helpers.formatSelectionCount(1);
        })();

  const hasContent =
    content !== null && content !== undefined && content !== "";

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
      const contentHeight = contentGroup.scrollHeight;

      setInnerHeight(Math.ceil(contentHeight + paddingY));
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(contentGroup);

    return () => resizeObserver.disconnect();
  }, [animated, hasContent, align, content]);

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
          style={{ justifyContent: alignToJustify[align] }}
        >
          {hasContent && (
            <div className={styles.infoText} role="status" aria-live="polite">
              {content}
            </div>
          )}
        </div>
        {showHome && (
          <button
            type="button"
            aria-label="Go to current month"
            className={`${styles.actionBtn} ${shared.interactive} ${shared.hovered} ${!today || isCurrentMonth ? styles.actionBtnDisabled : ""}`}
            onClick={goHome}
            disabled={!today || isCurrentMonth}
          >
            <Home />
          </button>
        )}
        {allowClear && hasSelection && (
          <button
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
