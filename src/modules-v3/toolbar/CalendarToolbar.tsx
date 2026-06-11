import { type ReactNode, useMemo, useRef, useState } from "react";
import { today } from "../../core-v3/timezone-boundary";
import { CalendarPopup } from "../../react-v3/CalendarPopup";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useUI } from "../../react-v3/ui-context";
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
  /** Accessible label override (else resolves from the label registry). */
  label?: string;
};

/** Step the view backward. */
export function CalendarToolbarPrev({
  step = "month",
  label,
  className,
  children,
}: StepProps) {
  const { navigateBy } = useCalendarActions();
  const t = useLabels();
  return (
    <button
      type="button"
      aria-label={t(
        step === "year" ? "previousYear" : "previousMonth",
        undefined,
        label,
      )}
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
  label,
  className,
  children,
}: StepProps) {
  const { navigateBy } = useCalendarActions();
  const t = useLabels();
  return (
    <button
      type="button"
      aria-label={t(
        step === "year" ? "nextYear" : "nextMonth",
        undefined,
        label,
      )}
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
  label,
  className,
  children,
}: WithClass & { label?: string }) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  const t = useLabels();
  return (
    <button
      type="button"
      aria-label={t("home", undefined, label)}
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

// Month names are locale-dependent but year-independent; build once per locale
// from a fixed non-leap reference year.
function monthNames(locale: string | undefined): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2021, i, 1)));
}

type TriggerProps = WithClass & {
  /** Accessible label for the trigger button + popup dialog. */
  label?: string;
};

/**
 * Month trigger: a button showing the current month that opens a 12-cell month
 * picker. Picking a month navigates the view to it (day 1) and closes. Popup
 * state lives in `UIContext` (adapter), never the core reducer.
 */
export function CalendarToolbarMonthTrigger({
  label,
  className,
}: TriggerProps) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const locale = store.getConfig().locale;
  const view = useStoreSelector(store, (s) => s.view.viewDate);
  const open = ui.isOpen("month");

  const names = useMemo(() => monthNames(locale), [locale]);
  const text = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(view.year, view.month - 1, 1),
      ),
    [view.year, view.month, locale],
  );

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("selectMonth", undefined, label)}
        data-toolbar-month-trigger=""
        className={cx(styles.nav, className)}
        onClick={() => ref.current && ui.toggle("month", ref.current)}
      >
        {text}
      </button>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("monthPicker")}
      >
        <div className={styles.pickerGrid} data-cols="3">
          {names.map((name, i) => {
            const m = i + 1;
            const selected = m === view.month;
            return (
              <button
                key={name}
                type="button"
                data-selected={selected || undefined}
                aria-current={selected ? "true" : undefined}
                className={styles.pickerCell}
                onClick={() => {
                  navigateTo({ year: view.year, month: m, day: 1 });
                  ui.close();
                }}
              >
                {name}
              </button>
            );
          })}
        </div>
      </CalendarPopup>
    </>
  );
}

const YEAR_PAGE = 12;

/**
 * Year trigger: a button showing the current year that opens a paged year grid
 * (12 years/page, prev/next shift the window). Picking a year navigates the view
 * to it (same month) and closes.
 */
export function CalendarToolbarYearTrigger({ label, className }: TriggerProps) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const locale = store.getConfig().locale;
  const view = useStoreSelector(store, (s) => s.view.viewDate);
  const open = ui.isOpen("year");
  const [page, setPage] = useState(0);

  // Window aligned to a YEAR_PAGE boundary around the current view year, shifted
  // by the local page offset. Reset implicitly when reopened (page persists, but
  // the base re-aligns to the view year).
  const base = Math.floor(view.year / YEAR_PAGE) * YEAR_PAGE + page * YEAR_PAGE;
  const years = Array.from({ length: YEAR_PAGE }, (_, i) => base + i);

  const text = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { year: "numeric" }).format(
        new Date(view.year, 0, 1),
      ),
    [view.year, locale],
  );

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t("selectYear", undefined, label)}
        data-toolbar-year-trigger=""
        className={cx(styles.nav, className)}
        onClick={() => ref.current && ui.toggle("year", ref.current)}
      >
        {text}
      </button>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("yearPicker")}
      >
        <div className={styles.pickerHead}>
          <button
            type="button"
            aria-label={t("previousYears")}
            className={styles.nav}
            onClick={() => setPage((p) => p - 1)}
          >
            ‹
          </button>
          <span className={styles.label}>
            {years[0]}–{years[years.length - 1]}
          </span>
          <button
            type="button"
            aria-label={t("nextYears")}
            className={styles.nav}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
        <div className={styles.pickerGrid} data-cols="3">
          {years.map((y) => {
            const selected = y === view.year;
            return (
              <button
                key={y}
                type="button"
                data-selected={selected || undefined}
                aria-current={selected ? "true" : undefined}
                className={styles.pickerCell}
                onClick={() => {
                  navigateTo({ year: y, month: view.month, day: 1 });
                  ui.close();
                }}
              >
                {y}
              </button>
            );
          })}
        </div>
      </CalendarPopup>
    </>
  );
}

/** Clear the whole selection. */
export function CalendarToolbarClear({
  label,
  className,
  children,
}: WithClass & { label?: string }) {
  const { clear } = useCalendarActions();
  const t = useLabels();
  return (
    <button
      type="button"
      aria-label={t("clear", undefined, label)}
      data-toolbar-clear=""
      className={cx(styles.nav, className)}
      onClick={() => clear()}
    >
      {children ?? "✕"}
    </button>
  );
}
