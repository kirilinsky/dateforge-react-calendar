import { type ReactNode, useMemo } from "react";
import { today } from "../../core-v3/timezone-boundary";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import styles from "./toolbar.module.css";

/**
 * Composable toolbar primitives (the v3 take on v2's `@dateforge/.../toolbar`):
 * small parts you arrange yourself rather than one monolithic navbar. Each part
 * pulls actions/state from the store, so any layout works
 * (`<CalendarToolbar><Prev/><Label/><Next/></CalendarToolbar>`).
 */

type WithClass = { className?: string; children?: ReactNode };

function cx(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

/** Toolbar container. */
export function CalendarToolbar({ className, children }: WithClass) {
  return (
    <div
      role="toolbar"
      data-dateforge-toolbar=""
      className={cx(styles.toolbar, className)}
    >
      {children}
    </div>
  );
}

/** Visual grouping of toolbar parts. */
export function CalendarToolbarGroup({ className, children }: WithClass) {
  return <div className={cx(styles.group, className)}>{children}</div>;
}

type StepProps = WithClass & {
  /** Navigate by whole months (default) or years. */
  step?: "month" | "year";
  /** Accessible label. */
  label?: string;
};

/** Step the view backward. */
export function CalendarToolbarPrev({
  step = "month",
  label = "Previous",
  className,
  children,
}: StepProps) {
  const { navigateBy } = useCalendarActions();
  return (
    <button
      type="button"
      aria-label={label}
      data-toolbar-prev=""
      className={cx(styles.nav, className)}
      onClick={() => navigateBy(step, -1)}
    >
      {children ?? "‹"}
    </button>
  );
}

/** Step the view forward. */
export function CalendarToolbarNext({
  step = "month",
  label = "Next",
  className,
  children,
}: StepProps) {
  const { navigateBy } = useCalendarActions();
  return (
    <button
      type="button"
      aria-label={label}
      data-toolbar-next=""
      className={cx(styles.nav, className)}
      onClick={() => navigateBy(step, 1)}
    >
      {children ?? "›"}
    </button>
  );
}

/** Jump the view to today. */
export function CalendarToolbarHome({
  label = "Today",
  className,
  children,
}: WithClass & { label?: string }) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  return (
    <button
      type="button"
      aria-label={label}
      data-toolbar-home=""
      className={cx(styles.nav, className)}
      onClick={() => navigateTo(today(store.getConfig().timeZone))}
    >
      {children ?? "•"}
    </button>
  );
}

type LabelProps = WithClass & {
  /** Intl options for the label. Default: long month + numeric year. */
  options?: Intl.DateTimeFormatOptions;
};

const FULL_LABEL: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
};
const MONTH_ONLY: Intl.DateTimeFormatOptions = { month: "long" };
const YEAR_ONLY: Intl.DateTimeFormatOptions = { year: "numeric" };

/** Shared view-label renderer: formats the current view with Intl options. */
function ViewLabel({
  options,
  className,
  attr,
}: LabelProps & { attr: string }) {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const view = useStoreSelector(store, (s) => s.view.viewDate);
  const text = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, options).format(
        // Day 1 is enough for month/year; presentation-only Date at the edge.
        new Date(view.year, view.month - 1, 1),
      ),
    [view.year, view.month, locale, options],
  );
  return (
    <span {...{ [attr]: "" }} className={cx(styles.label, className)}>
      {text}
    </span>
  );
}

/** Live "Month Year" label for the current view. */
export function CalendarToolbarLabel({ options, className }: LabelProps) {
  return (
    <ViewLabel
      options={options ?? FULL_LABEL}
      className={className}
      attr="data-toolbar-label"
    />
  );
}

/** Month-only label for the current view. */
export function CalendarToolbarMonthLabel({ options, className }: LabelProps) {
  return (
    <ViewLabel
      options={options ?? MONTH_ONLY}
      className={className}
      attr="data-toolbar-month-label"
    />
  );
}

/** Year-only label for the current view. */
export function CalendarToolbarYearLabel({ options, className }: LabelProps) {
  return (
    <ViewLabel
      options={options ?? YEAR_ONLY}
      className={className}
      attr="data-toolbar-year-label"
    />
  );
}

/** Clear the whole selection. */
export function CalendarToolbarClear({
  label = "Clear",
  className,
  children,
}: WithClass & { label?: string }) {
  const { clear } = useCalendarActions();
  return (
    <button
      type="button"
      aria-label={label}
      data-toolbar-clear=""
      className={cx(styles.nav, className)}
      onClick={() => clear()}
    >
      {children ?? "✕"}
    </button>
  );
}
