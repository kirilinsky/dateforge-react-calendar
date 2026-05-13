import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { isSameDay } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { type AlignValue, alignToJustify } from "@/utils/layout-utils";
import styles from "./selected-dates.module.css";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const getRangeSep = (
  fmt: Intl.DateTimeFormat,
  start: Date,
  end: Date,
): string => {
  try {
    const parts = fmt.formatRangeToParts(start, end) as Array<
      Intl.DateTimeFormatPart & { source: "startRange" | "endRange" | "shared" }
    >;
    const sources = parts.map((p) => p.source);
    const afterStart = sources.lastIndexOf("startRange") + 1;
    const beforeEnd = sources.indexOf("endRange");
    if (afterStart > 0 && beforeEnd > afterStart) {
      return parts
        .slice(afterStart, beforeEnd)
        .map((p) => p.value)
        .join("");
    }
    return " – ";
  } catch {
    return " – ";
  }
};

// TODO: per-chip remove (× icon on each chip). Useful in mode="multiple" to drop one
// date without wiping the whole selection, and in mode="range" to clear from/to
// individually via onRangeBoundSet(bound, null). Gate behind a new prop, e.g. `chipRemove`.
export interface CalendarSelectedDatesProps {
  allowClear?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: AlignValue;
  maxVisibleChips?: number;
  overflowLabel?: string;
  showTime?: boolean;
  col?: number | string;
}

const formatOverflowLabel = (label: string, count: number) =>
  label.replaceAll("{count}", String(count));

export const CalendarSelectedDates: React.FC<CalendarSelectedDatesProps> = ({
  allowClear = false,
  allowNavigate = true,
  animated = true,
  align = "left",
  maxVisibleChips,
  overflowLabel = "+{count}",
  showTime = false,
  col,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const chipsGroupRef = useRef<HTMLDivElement>(null);
  const clearBtnRef = useRef<HTMLButtonElement>(null);
  const { locale, range, hour12, timeZone, readOnly } = useConfig();
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate } = useSelectionActions();

  const dateFmt = getDateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(timeZone && { timeZone }),
  });

  const timeFmt = showTime
    ? getDateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        hour12,
        ...(timeZone && { timeZone }),
      })
    : null;

  const fmtChip = (d: Date) =>
    timeFmt ? `${dateFmt.format(d)} | ${timeFmt.format(d)}` : dateFmt.format(d);

  const hasContent = range ? !!rangeStart : selectedDates.length > 0;
  const gridSlot = getGridSlotStyle(col);

  const visibleChipsCount =
    maxVisibleChips === undefined || !Number.isFinite(maxVisibleChips)
      ? selectedDates.length
      : Math.max(0, Math.floor(maxVisibleChips));

  const hasOverflow = selectedDates.length > visibleChipsCount;
  const shouldCollapseChips = hasOverflow && !isExpanded;
  const visibleSelectedDates = shouldCollapseChips
    ? selectedDates.slice(0, visibleChipsCount)
    : selectedDates;
  const overflowCount = shouldCollapseChips
    ? selectedDates.length - visibleSelectedDates.length
    : 0;

  useEffect(() => {
    setIsExpanded(false);
  }, [maxVisibleChips, selectedDates.length]);

  useIsoLayoutEffect(() => {
    if (!animated || !hasContent) {
      setInnerHeight(null);
      return;
    }

    const inner = innerRef.current;
    const chipsGroup = chipsGroupRef.current;
    if (!inner || !chipsGroup) return;

    const measure = () => {
      const computedStyle = window.getComputedStyle(inner);
      const paddingY =
        Number.parseFloat(computedStyle.paddingTop) +
        Number.parseFloat(computedStyle.paddingBottom);
      const contentHeight = Math.max(
        chipsGroup.scrollHeight,
        clearBtnRef.current?.offsetHeight ?? 0,
      );

      setInnerHeight(Math.ceil(contentHeight + paddingY));
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(chipsGroup);
    if (clearBtnRef.current) {
      resizeObserver.observe(clearBtnRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [
    animated,
    hasContent,
    visibleSelectedDates.length,
    overflowCount,
    allowClear,
    align,
    showTime,
    overflowLabel,
    locale,
    hour12,
    timeZone,
  ]);

  if (!animated && !hasContent) return null;

  const isCurrentMonth = (d: Date) =>
    d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();

  const chipClass = (d: Date) =>
    [
      styles.chip,
      shared.interactive,
      shared.hovered,
      isCurrentMonth(d) && allowNavigate
        ? shared.activeItem
        : styles.inactiveChip,
    ]
      .filter(Boolean)
      .join(" ");

  const handleClear = () => {
    if (readOnly) return;
    onChangeDate(null);
  };

  const clearBtn = allowClear ? (
    <button
      ref={clearBtnRef}
      type="button"
      aria-label="Clear"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hovered}`}
      onClick={handleClear}
      disabled={readOnly}
    >
      ×
    </button>
  ) : null;

  const chipsContent = range ? (
    rangeStart ? (
      <>
        <button
          type="button"
          onClick={() => allowNavigate && navigateTo(rangeStart)}
          className={chipClass(rangeStart)}
        >
          {fmtChip(rangeStart)}
        </button>
        <span className={styles.rangeSep}>
          {rangeEnd ? getRangeSep(dateFmt, rangeStart, rangeEnd) : "…"}
        </span>
        {rangeEnd && (
          <button
            type="button"
            onClick={() => allowNavigate && navigateTo(rangeEnd)}
            className={chipClass(rangeEnd)}
          >
            {fmtChip(rangeEnd)}
          </button>
        )}
      </>
    ) : null
  ) : (
    <>
      {visibleSelectedDates.map((d, index) => {
        const isActive = isSameDay(d, date);
        const isRevealedChip =
          isExpanded && hasOverflow && index >= visibleChipsCount;
        return (
          <button
            key={d.getTime()}
            type="button"
            data-active={isActive || undefined}
            data-selected-date-chip="true"
            onClick={() => allowNavigate && navigateTo(d)}
            className={[
              styles.chip,
              shared.interactive,
              shared.hovered,
              isActive ? shared.activeItem : styles.inactiveChip,
              isActive ? styles.activeChip : "",
              isRevealedChip ? styles.revealedChip : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {fmtChip(d)}
          </button>
        );
      })}
      {overflowCount > 0 && (
        <button
          type="button"
          className={`${styles.chip} ${styles.overflowChip} ${shared.interactive} ${shared.hovered}`}
          aria-label={`Show ${overflowCount} more selected dates`}
          onClick={() => setIsExpanded(true)}
          title={`${overflowCount} more selected dates`}
        >
          {formatOverflowLabel(overflowLabel, overflowCount)}
        </button>
      )}
    </>
  );

  const innerStyle =
    animated && innerHeight !== null
      ? ({
          "--selected-dates-inner-height": `${innerHeight}px`,
        } as React.CSSProperties)
      : undefined;

  return (
    <div
      className={[
        styles.selectedContainer,
        animated ? styles.animated : "",
        animated && hasContent ? styles.visible : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-area="selected-dates"
      style={gridSlot}
    >
      <div ref={innerRef} className={styles.inner} style={innerStyle}>
        <div
          ref={chipsGroupRef}
          className={styles.chipsGroup}
          style={{ justifyContent: alignToJustify[align] }}
        >
          {chipsContent}
        </div>
        {clearBtn}
      </div>
    </div>
  );
};
