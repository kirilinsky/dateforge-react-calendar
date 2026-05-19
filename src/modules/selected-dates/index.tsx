import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { Clear } from "@/Icons";
import {
  DEFAULT_CALENDAR_ACTION_LABELS,
  resolveActionLabel,
} from "@/utils/action-labels";
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

export interface CalendarSelectedDatesProps {
  allowClear?: boolean;
  allowClearPerChip?: boolean;
  allowNavigate?: boolean;
  animated?: boolean;
  align?: AlignValue;
  clearLabel?: string;
  maxVisibleChips?: number;
  overflowLabel?: string;
  showTime?: boolean;
  col?: number | string;
}

const formatOverflowLabel = (label: string, count: number) =>
  label.replaceAll("{count}", String(count));

const getTargetPaddingY = (
  inner: HTMLDivElement,
  fallbackStyle: CSSStyleDeclaration,
): number => {
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.pointerEvents = "none";
  probe.style.paddingTop = "var(--cal-spacing)";
  probe.style.paddingBottom = "var(--cal-spacing)";
  inner.appendChild(probe);

  const probeStyle = window.getComputedStyle(probe);
  const targetPaddingTop = Number.parseFloat(probeStyle.paddingTop);
  const targetPaddingBottom = Number.parseFloat(probeStyle.paddingBottom);
  probe.remove();

  const targetPaddingY =
    (Number.isFinite(targetPaddingTop) ? targetPaddingTop : 0) +
    (Number.isFinite(targetPaddingBottom) ? targetPaddingBottom : 0);

  if (targetPaddingY > 0) return targetPaddingY;

  const paddingTop = Number.parseFloat(fallbackStyle.paddingTop);
  const paddingBottom = Number.parseFloat(fallbackStyle.paddingBottom);
  return (
    (Number.isFinite(paddingTop) ? paddingTop : 0) +
    (Number.isFinite(paddingBottom) ? paddingBottom : 0)
  );
};

export const CalendarSelectedDates: React.FC<CalendarSelectedDatesProps> = ({
  allowClear = false,
  allowClearPerChip = false,
  allowNavigate = true,
  animated = true,
  align = "left",
  clearLabel,
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
  const {
    locale,
    range,
    multiselect,
    hour12,
    timeZone,
    readOnly,
    actionLabels,
  } = useConfig();
  const resolvedClearLabel = resolveActionLabel(
    clearLabel,
    actionLabels.clearLabel,
    DEFAULT_CALENDAR_ACTION_LABELS.clearLabel,
  );
  const { viewDate: date, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate, onDatesSet, onRangeSet } = useSelectionActions();

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
    if (!animated) {
      setInnerHeight(null);
      return;
    }

    if (!hasContent) {
      setInnerHeight(0);
      return;
    }

    const inner = innerRef.current;
    const chipsGroup = chipsGroupRef.current;
    if (!inner || !chipsGroup) return;

    const measure = () => {
      const computedStyle = window.getComputedStyle(inner);
      const paddingY = getTargetPaddingY(inner, computedStyle);
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
    allowClearPerChip,
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
      allowClearPerChip ? styles.chipWithRemove : shared.interactive,
      !allowClearPerChip && shared.hovered,
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

  const removeDate = (d: Date, bound?: "from" | "to") => {
    if (readOnly) return;

    if (range) {
      if (bound === "from") {
        onRangeSet(null, rangeEnd);
      } else {
        onRangeSet(rangeStart, null);
      }
      return;
    }

    if (multiselect) {
      onDatesSet(selectedDates.filter((selected) => !isSameDay(selected, d)));
    } else {
      onChangeDate(null);
    }
  };

  const renderDateChip = ({
    d,
    key,
    className,
    label,
    onNavigate,
    removeLabel,
    bound,
    dataActive,
    dataSelectedDateChip,
  }: {
    d: Date;
    key?: React.Key;
    className: string;
    label: string;
    onNavigate: () => void;
    removeLabel: string;
    bound?: "from" | "to";
    dataActive?: boolean;
    dataSelectedDateChip?: boolean;
  }) =>
    allowClearPerChip ? (
      <span
        key={key}
        className={className}
        data-active={dataActive || undefined}
        data-selected-date-chip={dataSelectedDateChip ? "true" : undefined}
      >
        <button type="button" className={styles.chipMain} onClick={onNavigate}>
          {label}
        </button>
        <button
          type="button"
          className={styles.chipRemoveBtn}
          onClick={(event) => {
            event.stopPropagation();
            removeDate(d, bound);
          }}
          aria-label={removeLabel}
          disabled={readOnly}
        >
          <Clear />
        </button>
      </span>
    ) : (
      <button
        key={key}
        type="button"
        data-active={dataActive || undefined}
        data-selected-date-chip={dataSelectedDateChip ? "true" : undefined}
        onClick={onNavigate}
        className={className}
      >
        {label}
      </button>
    );

  const clearBtn =
    allowClear && hasContent ? (
      <button
        ref={clearBtnRef}
        type="button"
        aria-label={resolvedClearLabel}
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
        {renderDateChip({
          d: rangeStart,
          key: "range-start",
          className: chipClass(rangeStart),
          label: fmtChip(rangeStart),
          onNavigate: () => allowNavigate && navigateTo(rangeStart),
          removeLabel: "Remove range start",
          bound: "from",
        })}
        <span className={styles.rangeSep}>
          {rangeEnd ? getRangeSep(dateFmt, rangeStart, rangeEnd) : "…"}
        </span>
        {rangeEnd &&
          renderDateChip({
            d: rangeEnd,
            key: "range-end",
            className: chipClass(rangeEnd),
            label: fmtChip(rangeEnd),
            onNavigate: () => allowNavigate && navigateTo(rangeEnd),
            removeLabel: "Remove range end",
            bound: "to",
          })}
      </>
    ) : null
  ) : (
    <>
      {visibleSelectedDates.map((d, index) => {
        const isActive = isSameDay(d, date);
        const isRevealedChip =
          isExpanded && hasOverflow && index >= visibleChipsCount;
        return renderDateChip({
          d,
          key: d.getTime(),
          dataActive: isActive,
          dataSelectedDateChip: true,
          label: fmtChip(d),
          onNavigate: () => allowNavigate && navigateTo(d),
          removeLabel: "Remove selected date",
          className: [
            styles.chip,
            allowClearPerChip ? styles.chipWithRemove : shared.interactive,
            !allowClearPerChip && shared.hovered,
            isActive ? shared.activeItem : styles.inactiveChip,
            isActive ? styles.activeChip : "",
            isRevealedChip ? styles.revealedChip : "",
          ]
            .filter(Boolean)
            .join(" "),
        });
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

  const innerStyle = animated
    ? ({
        "--selected-dates-inner-height": `${innerHeight ?? 0}px`,
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
