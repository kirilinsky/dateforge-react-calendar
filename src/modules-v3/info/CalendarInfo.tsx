import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { differenceInDays } from "../../core-v3/calendar-date";
import {
  type AnyCalendarValue,
  toPublicValue,
} from "../../core-v3/public-value";
import { today as getToday } from "../../core-v3/timezone-boundary";
import { useToday } from "../../hooks/use-today";
import { ClearIcon, HomeIcon } from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./info.module.css";

export type CalendarInfoRangeStyle = "days" | "duration";
export type CalendarInfoAlign = "left" | "center" | "right";

/** Custom summary renderer. Receives the v3 PUBLIC value — the exact shape the
 *  root `onChange` emits for the configured `unit × mode` (v2 passed its own
 *  ad-hoc shape; unified in v3 — intentional break, covered by migration docs). */
export type CalendarInfoFormatter = (value: AnyCalendarValue) => ReactNode;

export type CalendarInfoProps = {
  /** Show the clear (×) action when something is selected. */
  allowClear?: boolean;
  /** Show the "jump to current month" action. */
  showHome?: boolean;
  /** Placeholder content while nothing is selected. */
  emptyLabel?: ReactNode;
  /** Custom summary renderer (overrides the built-in text). */
  formatter?: CalendarInfoFormatter;
  /** Relative line under the summary: "in 5 days" / "yesterday" (Intl). */
  showRelative?: boolean;
  /** Range summary: whole days (default) or days+hours+minutes duration. */
  rangeStyle?: CalendarInfoRangeStyle;
  /** Toggle the built-in summary text (actions stay). Default true. */
  showSummary?: boolean;
  /** Animate height when content appears/disappears. Default true. */
  animated?: boolean;
  /** Horizontal alignment of the text block. Default "left". */
  align?: CalendarInfoAlign;
  /** Node rendered before the summary text (icon, label). */
  prefix?: ReactNode;
  /** Override for the clear action aria-label (registry key `clear`). */
  clearLabel?: string;
  /** Override for the home action aria-label (registry key `home`). */
  homeLabel?: string;
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
};

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

const ALIGN_TO_JUSTIFY: Record<CalendarInfoAlign, string> = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
};

const hasRenderableNode = (node: ReactNode) =>
  node !== null &&
  node !== undefined &&
  node !== "" &&
  typeof node !== "boolean";

const isActionKey = (key: string) =>
  key === "ArrowLeft" ||
  key === "ArrowRight" ||
  key === "ArrowUp" ||
  key === "ArrowDown" ||
  key === "Home" ||
  key === "End";

/** `Intl.NumberFormat` unit style → localized "5 days" / "5 дней" / "5 jours". */
function formatUnit(
  value: number,
  unit: "day" | "hour" | "minute",
  locale?: string,
): string {
  try {
    return new Intl.NumberFormat(locale, {
      maximumFractionDigits: 0,
      style: "unit",
      unit,
      unitDisplay: "long",
    }).format(value);
  } catch {
    return String(value);
  }
}

function formatDuration(durationMs: number, locale?: string): string {
  const ms = Math.abs(durationMs);
  const days = Math.floor(ms / DAY_MS);
  const hours = Math.floor((ms % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((ms % HOUR_MS) / MINUTE_MS);
  const parts: string[] = [];
  if (days > 0) parts.push(formatUnit(days, "day", locale));
  if (hours > 0) parts.push(formatUnit(hours, "hour", locale));
  if (parts.length === 0) parts.push(formatUnit(minutes, "minute", locale));
  return parts.join(" ");
}

export function CalendarInfo({
  allowClear = false,
  showHome = false,
  emptyLabel,
  formatter,
  showRelative = false,
  rangeStyle = "days",
  showSummary = true,
  animated = true,
  align = "left",
  prefix,
  clearLabel,
  homeLabel,
  theme,
  scheme,
  col,
  className,
}: CalendarInfoProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { clear, navigateTo } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);

  // SSR-safe: null on the server, resolved after mount — the home action stays
  // disabled until the client knows the real current month (v2 `useToday`).
  const todayDate = useToday();
  const todayCal = useMemo(
    () => (todayDate ? getToday(config.timeZone) : null),
    [todayDate, config.timeZone],
  );

  const isCurrentMonth =
    !!todayCal &&
    todayCal.year === viewDate.year &&
    todayCal.month === viewDate.month;

  const hasSelection =
    selection.shape === "point"
      ? selection.dates.length > 0
      : selection.ranges.length > 0;

  // The wall-clock anchor for the relative line: first point date, else the
  // range start (mirrors v2's `selectedDate ?? dates[0] ?? rangeStart ?? End`).
  const relativeDiff = useMemo((): number | null => {
    if (!showRelative || !todayCal) return null;
    const anchor =
      selection.shape === "point"
        ? selection.dates[0]?.date
        : (selection.ranges[0]?.start ?? selection.ranges[0]?.end);
    if (!anchor) return null;
    return differenceInDays(anchor, todayCal);
  }, [showRelative, todayCal, selection]);

  const summary = useMemo((): ReactNode => {
    if (!hasSelection || !showSummary) return null;
    if (formatter) return formatter(toPublicValue(selection, config));

    if (selection.shape === "point") {
      const { dates } = selection;
      if (dates.length === 1) {
        // Wall-clock: the cell's calendar fields, no timezone re-shift.
        const d = dates[0].date;
        return new Intl.DateTimeFormat(config.locale, {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(d.year, d.month - 1, d.day));
      }
      return formatUnit(dates.length, "day", config.locale);
    }

    const { ranges } = selection;
    if (ranges.length > 1) {
      return t("infoRanges", { count: ranges.length });
    }
    const [range] = ranges;
    if (rangeStyle === "duration") {
      const days = differenceInDays(range.end, range.start);
      const from = selection.fromTime;
      const to = selection.toTime;
      const timeMs =
        from && to
          ? (to.hour - from.hour) * HOUR_MS +
            (to.minute - from.minute) * MINUTE_MS
          : 0;
      const totalMs = days * DAY_MS + timeMs;
      // A single-day range with no time bounds is a zero in checkout−checkin
      // arithmetic — but the user selected one whole day, not "0 minutes".
      if (totalMs === 0) return formatUnit(1, "day", config.locale);
      return formatDuration(totalMs, config.locale);
    }
    return formatUnit(
      differenceInDays(range.end, range.start) + 1,
      "day",
      config.locale,
    );
  }, [hasSelection, showSummary, formatter, selection, config, rangeStyle, t]);

  const relativeSummary = useMemo((): ReactNode => {
    if (relativeDiff === null || !hasSelection) return null;
    try {
      return new Intl.RelativeTimeFormat(config.locale, {
        numeric: "auto",
      }).format(relativeDiff, "day");
    } catch {
      return formatUnit(relativeDiff, "day", config.locale);
    }
  }, [relativeDiff, hasSelection, config.locale]);

  const showEmptyState = !hasSelection && hasRenderableNode(emptyLabel);
  const hasSummaryNode = showEmptyState || hasRenderableNode(summary);
  const hasRelativeNode = hasRenderableNode(relativeSummary);
  const hasTextContent = hasSummaryNode || hasRelativeNode;
  const hasPrefix =
    !showEmptyState && hasRenderableNode(summary) && hasRenderableNode(prefix);
  const hasClearBtn = allowClear && hasSelection;
  const hasActionGroup = showHome || hasClearBtn;
  const hasContent = hasTextContent || hasActionGroup;

  // ── Animated height (v2 parity) ────────────────────────────────────────────
  // Transition to the MEASURED content height, so the bar animates not only on
  // show/hide but also when the content reflows (e.g. the relative line wraps
  // to a second row in a narrow container) — pure 0fr/1fr can't cover that.
  const innerRef = useRef<HTMLDivElement>(null);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!animated) {
      setInnerHeight(null);
      return;
    }
    if (!hasContent) {
      setInnerHeight(0);
      return;
    }
    const inner = innerRef.current;
    if (!inner) return;
    // scrollHeight = content + padding; with border-box that's the target height.
    const measure = () => setInnerHeight(inner.scrollHeight);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    for (const child of inner.children) ro.observe(child);
    return () => ro.disconnect();
  }, [animated, hasContent, summary, relativeSummary, hasClearBtn, showHome]);

  // ── Action group: roving arrows/Home/End + focus restore (v2 parity) ──────
  const homeBtnRef = useRef<HTMLButtonElement>(null);
  const clearBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  const enabledActionButtons = () =>
    [homeBtnRef.current, clearBtnRef.current].filter(
      (b): b is HTMLButtonElement => !!b && !b.disabled,
    );

  const onActionsKeyDown = (event: KeyboardEvent) => {
    if (!isActionKey(event.key)) return;
    const current = (event.target as HTMLElement | null)?.closest("button");
    const buttons = enabledActionButtons();
    const index = current ? buttons.indexOf(current as HTMLButtonElement) : -1;
    if (index < 0 || buttons.length < 2) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : event.key === "ArrowRight" || event.key === "ArrowDown"
            ? Math.min(buttons.length - 1, index + 1)
            : Math.max(0, index - 1);
    buttons[next]?.focus();
  };

  // When the focused clear button disappears (selection cleared), hand focus
  // to the first remaining action instead of dropping it on <body>.
  useLayoutEffect(() => {
    if (!restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    enabledActionButtons()[0]?.focus();
  }, [hasClearBtn]);

  const onClear = () => {
    if (config.readOnly) return;
    if (
      typeof document !== "undefined" &&
      document.activeElement === clearBtnRef.current
    ) {
      restoreFocusRef.current = true;
    }
    clear();
  };

  if (!animated && !hasContent) return null;

  return (
    <div
      data-dateforge-info=""
      data-area="calendar-info"
      data-theme={theme}
      data-scheme={scheme}
      data-collapsed={animated && !hasContent ? "" : undefined}
      className={[styles.container, animated && styles.animated, className]
        .filter(Boolean)
        .join(" ")}
      style={getGridSlotStyle(col)}
    >
      <div
        ref={innerRef}
        className={styles.inner}
        style={
          animated && innerHeight !== null
            ? ({ "--cal-info-h": `${innerHeight}px` } as CSSProperties)
            : undefined
        }
      >
        <div
          className={styles.contentGroup}
          role={hasTextContent ? "status" : undefined}
          aria-live={hasTextContent ? "polite" : undefined}
          aria-atomic={hasTextContent ? "true" : undefined}
          style={{ justifyContent: ALIGN_TO_JUSTIFY[align] }}
        >
          {hasSummaryNode && (
            <div
              className={[styles.summary, showEmptyState && styles.empty]
                .filter(Boolean)
                .join(" ")}
            >
              {hasPrefix && <span className={styles.prefix}>{prefix}</span>}
              {showEmptyState ? emptyLabel : summary}
            </div>
          )}
          {hasRelativeNode && (
            <div className={styles.summary}>{relativeSummary}</div>
          )}
        </div>
        {hasActionGroup && (
          <div className={styles.actions} onKeyDown={onActionsKeyDown}>
            {showHome && (
              <UIButton
                ref={homeBtnRef}
                variant="ghost"
                size="sm"
                aria-label={t("home", undefined, homeLabel)}
                disabled={!todayCal || isCurrentMonth}
                onClick={() => navigateTo(getToday(config.timeZone))}
              >
                <HomeIcon />
              </UIButton>
            )}
            {hasClearBtn && (
              <UIButton
                ref={clearBtnRef}
                variant="ghost"
                size="sm"
                aria-label={t("clear", undefined, clearLabel)}
                disabled={config.readOnly}
                onClick={onClear}
              >
                <ClearIcon size={12} />
              </UIButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
