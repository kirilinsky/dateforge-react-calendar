import {
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { boundDateOf } from "../../core-v3/bound";
import {
  addDays,
  addMonths,
  addYears,
  type CalendarDate,
  calendarDate,
  compareDate,
  daysInMonth,
} from "../../core-v3/calendar-date";
import {
  type CalendarTime,
  MIDNIGHT,
  timesEqual,
} from "../../core-v3/calendar-time";
import {
  type AnyCalendarValue,
  toPublicValue,
} from "../../core-v3/public-value";
import {
  canStepView,
  isMonthFixed,
  isMonthInBounds,
  isYearFixed,
  isYearInBounds,
  type ViewNavUnit,
} from "../../core-v3/view-navigation";
import { useRovingTileFocus } from "../../hooks/use-roving-tile-focus";
import { useToday } from "../../hooks/use-today";
import { CalendarPopup } from "../../react-v3/CalendarPopup";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClearIcon,
  ClockIcon,
  HomeIcon,
  ThemeToggleIcon,
} from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import {
  PickerDraftProvider,
  TimePickerDraftProvider,
} from "../../react-v3/picker-draft";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { UITile } from "../../react-v3/ui/tile";
import { type SchemeMode, useUI } from "../../react-v3/ui-context";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./toolbar.module.css";

/**
 * Composable toolbar primitives (the v3 take on v2's `@dateforge/.../toolbar`):
 * small parts you arrange yourself rather than one monolithic navbar. Each part
 * pulls actions/state from the store, so any layout works — header, footer,
 * sidebar, a day-stepper, a two-month pair via `offset`.
 *
 * Conventions shared by every part:
 * - `col` places the part in a CSS-grid toolbar (same contract as modules).
 * - aria strings resolve module-prop → root `labels` → English default.
 * - navigation parts stay enabled under `readOnly` (browsing the view never
 *   mutates the value — intentional break from v2); value-mutating parts
 *   (Clear, Apply) are disabled instead.
 */

type WithClass = { className?: string; children?: ReactNode };

function cx(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

// ── Toolbar context: the month offset + range bound this toolbar's parts use ──
// Minimal by design — primitives stay usable standalone, where the context
// defaults to offset 0 and no bound.

type Bound = "from" | "to";

const ToolbarContext = createContext<{ offset: number; bound?: Bound }>({
  offset: 0,
});

/** Effective month offset: container offset + per-part override. */
function useEffectiveOffset(own?: number): number {
  const base = useContext(ToolbarContext).offset;
  return base + (own ?? 0);
}

/**
 * Effective range bound: per-part override wins, else the container's. A bound
 * is a MODE (which range edge this part displays/edits), not additive like the
 * offset — so a part's own `bound` replaces, never combines with, the context.
 */
function useEffectiveBound(own?: Bound): Bound | undefined {
  const base = useContext(ToolbarContext).bound;
  return own ?? base;
}

/** The first range's `bound` edge, or `undefined` (point shape / empty span). */
function useBoundDate(bound: Bound | undefined): CalendarDate | undefined {
  const store = useCalendarStore();
  return useStoreSelector(store, (s) => boundDateOf(s.selection, bound));
}

/**
 * The date this toolbar part displays. In bound mode it's the range edge itself
 * (so a `<CalendarToolbar bound="from">` titles/steps the FROM date); with no
 * range yet it falls back to the view. Otherwise it's the root view shifted by
 * the offset. `ownBound` lets a single part (e.g. a paired from/to label) pin a
 * bound regardless of the container.
 */
function useDisplayDate(own?: number, ownBound?: Bound): CalendarDate {
  const store = useCalendarStore();
  const view = useStoreSelector(store, (s) => s.view.viewDate);
  const offset = useEffectiveOffset(own);
  const boundDate = useBoundDate(useEffectiveBound(ownBound));
  return useMemo(
    () => boundDate ?? (offset === 0 ? view : addMonths(view, offset)),
    [boundDate, view, offset],
  );
}

// ── Container ────────────────────────────────────────────────────────────────

export type CalendarToolbarProps = WithClass & {
  /** Number of equal grid columns, or a raw `grid-template-columns` string. */
  cols?: number | string;
  /** Placement in the parent Calendar grid (same as other modules). */
  col?: number | string;
  /** CSS justify-content for the toolbar row. */
  justify?: CSSProperties["justifyContent"];
  /** Accessible toolbar name (registry key `calendarNavigation`). */
  label?: string;
  /**
   * Months ahead of the root view that this toolbar's parts display/label.
   * Pair with `<CalendarDays offset={1} />` in multi-month layouts.
   */
  offset?: number;
  /**
   * Span mode: every part inside displays and EDITS this range edge
   * (`"from"`/`"to"`) instead of the view — labels title the bound date,
   * prev/next/home/triggers commit via `setBoundDate` (the core owns
   * ordering/clamping). Pair with `<CalendarDaysTrack bound="from" />` for a
   * split from/to layout. No effect on point selections. Per-part `bound`
   * overrides this (e.g. a from-label and to-label in one toolbar).
   */
  bound?: Bound;
  /** Per-module theme override (`data-theme` on the container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the container). */
  scheme?: "light" | "dark" | "auto";
};

const TOOLBAR_NAV_KEYS = new Set(["ArrowLeft", "ArrowRight", "Home", "End"]);

/**
 * Arrow-key navigation between the toolbar's enabled buttons (Home/End jump to
 * the edges) — the keyboard affordance of the WAI-ARIA toolbar pattern. Buttons
 * stay in the natural tab order (same pragmatic stance as the Info action
 * group); popups are portaled out, so their keys never reach this handler.
 */
function onToolbarKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (!TOOLBAR_NAV_KEYS.has(e.key)) return;
  const target = (e.target as HTMLElement).closest("button");
  if (!target) return;
  const buttons = Array.from(
    e.currentTarget.querySelectorAll<HTMLButtonElement>(
      "button:not(:disabled)",
    ),
  );
  const index = buttons.indexOf(target as HTMLButtonElement);
  if (index < 0 || buttons.length < 2) return;
  e.preventDefault();
  const rtl = getComputedStyle(e.currentTarget).direction === "rtl";
  const forward = rtl ? "ArrowLeft" : "ArrowRight";
  const next =
    e.key === "Home"
      ? 0
      : e.key === "End"
        ? buttons.length - 1
        : e.key === forward
          ? Math.min(buttons.length - 1, index + 1)
          : Math.max(0, index - 1);
  buttons[next]?.focus();
}

/** Toolbar container. */
export function CalendarToolbar({
  cols,
  col,
  justify,
  label,
  offset = 0,
  bound,
  theme,
  scheme,
  className,
  children,
}: CalendarToolbarProps) {
  const t = useLabels();
  const ctx = useMemo(() => ({ offset, bound }), [offset, bound]);
  const gridTemplateColumns =
    cols === undefined
      ? undefined
      : typeof cols === "number"
        ? `repeat(${cols}, minmax(0, 1fr))`
        : cols;
  return (
    <ToolbarContext.Provider value={ctx}>
      <div
        role="toolbar"
        aria-label={t("calendarNavigation", undefined, label)}
        data-dateforge-toolbar=""
        data-cols={cols !== undefined ? "" : undefined}
        data-theme={theme}
        data-scheme={scheme}
        className={cx(styles.toolbar, className)}
        style={{
          ...getGridSlotStyle(col),
          ...(gridTemplateColumns ? { gridTemplateColumns } : undefined),
          ...(justify ? { justifyContent: justify } : undefined),
        }}
        onKeyDown={onToolbarKeyDown}
      >
        {children}
      </div>
    </ToolbarContext.Provider>
  );
}

/** Visual grouping of toolbar parts. */
export function CalendarToolbarGroup({
  grow,
  col,
  className,
  children,
}: WithClass & { grow?: boolean; col?: number | string }) {
  return (
    <div
      className={cx(styles.group, grow ? styles.grow : undefined, className)}
      style={getGridSlotStyle(col)}
    >
      {children}
    </div>
  );
}

// ── Prev / Next ──────────────────────────────────────────────────────────────

type StepProps = WithClass & {
  /** Navigate by whole days, months (default), or years. */
  unit?: ViewNavUnit;
  /**
   * What a step moves. `"view"` (default) pages the calendar view by `unit`.
   * `"selection"` steps the SELECTED date itself by `unit` (a date spinner):
   * commits via `selectDay` and follows it into view, gated by `readOnly` and
   * min/max. Pair with `<CalendarToolbarDayLabel source="selection" />`. Single
   * (point) selection only; from today when nothing is selected yet.
   */
  target?: "view" | "selection";
  /** Accessible label override (else resolves from the label registry). */
  label?: string;
  /** Edit this range edge instead of paging the view (overrides container). */
  bound?: Bound;
  col?: number | string;
};

const STEP_LABEL_KEY = {
  "-1": { day: "previousDay", month: "previousMonth", year: "previousYear" },
  "1": { day: "nextDay", month: "nextMonth", year: "nextYear" },
} as const;

function addByUnit(
  d: CalendarDate,
  unit: ViewNavUnit,
  n: number,
): CalendarDate {
  return unit === "day"
    ? addDays(d, n)
    : unit === "year"
      ? addYears(d, n)
      : addMonths(d, n);
}

function inBounds(d: CalendarDate, min?: CalendarDate, max?: CalendarDate) {
  return (
    (!min || compareDate(d, min) >= 0) && (!max || compareDate(d, max) <= 0)
  );
}

function StepButton({
  dir,
  attr,
  unit = "month",
  target = "view",
  label,
  bound,
  col,
  className,
  children,
}: StepProps & { dir: -1 | 1; attr: string }) {
  const store = useCalendarStore();
  const { navigateBy, navigateTo, selectDay, setBoundDate } =
    useCalendarActions();
  const t = useLabels();
  const date = useDisplayDate();
  const { min, max, readOnly } = store.getConfig();
  const selectedDate = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates.at(-1)?.date : undefined,
  );
  const effBound = useEffectiveBound(bound);
  const range0 = useStoreSelector(store, (s) =>
    s.selection.shape === "span" ? s.selection.ranges[0] : undefined,
  );

  let canGo: boolean;
  let onClick: () => void;
  if (effBound && range0) {
    // Step the range EDGE; the opposite edge is the ordering wall (the core
    // strategy also rejects an out-of-order step — this gate just disables the
    // arrow there so it doesn't no-op silently). Editing the value, so gated by
    // readOnly (unlike view paging, which stays enabled).
    const editing = effBound === "from" ? range0.start : range0.end;
    const next = addByUnit(editing, unit, dir);
    const ordered =
      effBound === "from"
        ? compareDate(next, range0.end) <= 0
        : compareDate(next, range0.start) >= 0;
    canGo = !readOnly && inBounds(next, min, max) && ordered;
    onClick = () => setBoundDate(next, effBound);
  } else if (target === "selection") {
    // Step an EXISTING selected date, then follow it into view so any grid keeps
    // the stepped day visible. With nothing picked there's nothing to step — the
    // arrows disable (pick a day first), rather than both pointing at today.
    const next = selectedDate ? addByUnit(selectedDate, unit, dir) : undefined;
    canGo = !readOnly && next !== undefined && inBounds(next, min, max);
    onClick = () => {
      if (!next) return;
      selectDay(next);
      navigateTo(next);
    };
  } else {
    // Gate on the DISPLAYED month: in an offset pair the trailing toolbar must
    // stop while its own month is at the edge, not the root view's.
    canGo = canStepView(date, unit, dir, min, max);
    onClick = () => navigateBy(unit, dir);
  }

  return (
    <UIButton
      disabled={!canGo}
      aria-label={t(STEP_LABEL_KEY[`${dir}`][unit], undefined, label)}
      {...{ [attr]: "" }}
      className={className}
      style={getGridSlotStyle(col)}
      onClick={onClick}
    >
      {children ?? (dir < 0 ? <ChevronLeftIcon /> : <ChevronRightIcon />)}
    </UIButton>
  );
}

/** Step the view backward. */
export function CalendarToolbarPrev(props: StepProps) {
  return <StepButton {...props} dir={-1} attr="data-toolbar-prev" />;
}

/** Step the view forward. */
export function CalendarToolbarNext(props: StepProps) {
  return <StepButton {...props} dir={1} attr="data-toolbar-next" />;
}

// ── Home ─────────────────────────────────────────────────────────────────────

/**
 * Jump the view to today (disabled while today's month is already shown). In a
 * bound toolbar it resets THIS range edge to today instead — gated by readOnly,
 * the min/max window, and range ordering (the core is the final guard).
 */
export function CalendarToolbarHome({
  label,
  col,
  offset,
  bound,
  className,
  children,
}: WithClass & {
  label?: string;
  col?: number | string;
  offset?: number;
  bound?: Bound;
}) {
  const store = useCalendarStore();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const t = useLabels();
  const date = useDisplayDate(offset);
  const eff = useEffectiveOffset(offset);
  const effBound = useEffectiveBound(bound);
  const range0 = useStoreSelector(store, (s) =>
    s.selection.shape === "span" ? s.selection.ranges[0] : undefined,
  );
  const { min, max, readOnly } = store.getConfig();
  const todayJs = useToday(); // null until mounted — SSR-safe disabled state

  if (effBound && range0) {
    const todayDate = todayJs
      ? calendarDate(
          todayJs.getFullYear(),
          todayJs.getMonth() + 1,
          todayJs.getDate(),
        )
      : undefined;
    const editing = effBound === "from" ? range0.start : range0.end;
    const ordered =
      !todayDate ||
      (effBound === "from"
        ? compareDate(todayDate, range0.end) <= 0
        : compareDate(todayDate, range0.start) >= 0);
    const atToday = !!todayDate && compareDate(editing, todayDate) === 0;
    const can =
      !readOnly &&
      !!todayDate &&
      !atToday &&
      inBounds(todayDate, min, max) &&
      ordered;
    return (
      <UIButton
        disabled={!can}
        aria-label={t("home", undefined, label)}
        data-toolbar-home=""
        className={className}
        style={getGridSlotStyle(col)}
        onClick={() => todayDate && setBoundDate(todayDate, effBound)}
      >
        {children ?? <HomeIcon />}
      </UIButton>
    );
  }

  const atToday =
    !!todayJs &&
    date.year === todayJs.getFullYear() &&
    date.month === todayJs.getMonth() + 1;
  return (
    <UIButton
      disabled={!todayJs || atToday}
      aria-label={t("home", undefined, label)}
      data-toolbar-home=""
      className={className}
      style={getGridSlotStyle(col)}
      onClick={() => {
        if (!todayJs) return;
        // Land THIS toolbar's month on today (offset pairs shift the root).
        const month = calendarDate(
          todayJs.getFullYear(),
          todayJs.getMonth() + 1,
          1,
        );
        navigateTo(eff === 0 ? month : addMonths(month, -eff));
      }}
    >
      {children ?? <HomeIcon />}
    </UIButton>
  );
}

// ── Labels ───────────────────────────────────────────────────────────────────

type LabelProps = WithClass & {
  /** Intl options override for the visible text. */
  options?: Intl.DateTimeFormatOptions;
  col?: number | string;
  /** Months ahead of the toolbar's date (adds to the container offset). */
  offset?: number;
  /** Title this range edge instead of the view (overrides the container). */
  bound?: Bound;
};

const FULL_LABEL: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
};

function useViewText(
  options: Intl.DateTimeFormatOptions,
  offset?: number,
  bound?: Bound,
): { date: CalendarDate; text: string } {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const date = useDisplayDate(offset, bound);
  const text = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, options).format(
        // Presentation-only wall-clock Date at the edge (no timeZone).
        new Date(date.year, date.month - 1, date.day),
      ),
    [date, locale, options],
  );
  return { date, text };
}

/**
 * Live "Month Year" toolbar title. Rendered as a heading (`aria-level`,
 * default 2) so screen-reader users can jump to the calendar's anchor point.
 * Pass `children` for a freeform title instead of the live one.
 *
 * Width-stable: an invisible sizer holds the year's longest formatted value
 * (same Intl options), so stepping from "May" to "September" never shifts the
 * arrows around the label.
 */
export function CalendarToolbarLabel({
  options,
  level = 2,
  col,
  offset,
  bound,
  className,
  children,
}: LabelProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const opts = options ?? FULL_LABEL;
  const { date, text } = useViewText(opts, offset, bound);
  // Longest of the 12 month renderings for the displayed year/day — covers the
  // month-name variance that dominates the width (day digits vary by at most
  // one character and only in day-bearing formats).
  const sizer = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, opts);
    let longest = "";
    for (let m = 0; m < 12; m++) {
      const s = fmt.format(new Date(date.year, m, date.day));
      if (s.length > longest.length) longest = s;
    }
    return longest;
  }, [locale, opts, date.year, date.day]);
  return (
    <span
      role="heading"
      aria-level={level}
      data-toolbar-label=""
      className={cx(styles.label, className)}
      style={getGridSlotStyle(col)}
    >
      {children ?? (
        <span className={styles.slot}>
          <span className={styles.sizer} aria-hidden="true">
            {sizer}
          </span>
          <span>{text}</span>
        </span>
      )}
    </span>
  );
}

// Month names are locale-dependent but year-independent; built from a fixed
// reference year. Used for both picker cells and the month-label width sizer.
function monthNames(
  locale: string | undefined,
  format: "short" | "long",
): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { month: format });
  return Array.from({ length: 12 }, (_, i) => fmt.format(new Date(2021, i, 1)));
}

const longest = (names: string[]) =>
  names.reduce((a, b) => (b.length > a.length ? b : a), "");

/**
 * Month-only label. Reserves the width of the locale's longest month name (the
 * v2 "sizer"), so stepping months never shifts the toolbar layout (CLS-free).
 */
export function CalendarToolbarMonthLabel({
  short = false,
  col,
  offset,
  bound,
  className,
}: WithClass & {
  short?: boolean;
  col?: number | string;
  offset?: number;
  bound?: Bound;
}) {
  const store = useCalendarStore();
  const t = useLabels();
  const locale = store.getConfig().locale;
  const format = short ? "short" : "long";
  const { date, text } = useViewText(
    useMemo(() => ({ month: format }), [format]),
    offset,
    bound,
  );
  const sizer = useMemo(
    () => longest(monthNames(locale, format)),
    [locale, format],
  );
  const longName = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, { month: "long" }).format(
        new Date(date.year, date.month - 1, 1),
      ),
    [date.year, date.month, locale],
  );
  return (
    <span
      data-toolbar-month-label=""
      className={cx(styles.label, className)}
      style={getGridSlotStyle(col)}
    >
      <span className={styles.srOnly}>
        {t("currentMonth", { month: longName })}
      </span>
      <span className={styles.slot} aria-hidden="true">
        <span className={styles.sizer}>{sizer}</span>
        <span>{text}</span>
      </span>
    </span>
  );
}

const YEAR_ONLY: Intl.DateTimeFormatOptions = { year: "numeric" };

/** Year-only label. */
export function CalendarToolbarYearLabel({
  options,
  col,
  offset,
  bound,
  className,
}: LabelProps) {
  const t = useLabels();
  const { date, text } = useViewText(options ?? YEAR_ONLY, offset, bound);
  return (
    <span
      data-toolbar-year-label=""
      className={cx(styles.label, className)}
      style={getGridSlotStyle(col)}
    >
      <span className={styles.srOnly}>
        {t("currentYear", { year: date.year })}
      </span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

/** Day label — pairs with `unit="day"` prev/next for day-stepper toolbars. */
export function CalendarToolbarDayLabel({
  format = "numeric",
  source = "view",
  emptyText = "—",
  col,
  offset,
  bound,
  className,
}: WithClass & {
  format?: "numeric" | "2-digit" | "long";
  /**
   * Which date to show. `"view"` (default) = the toolbar's view day;
   * `"selection"` = the selected date (single/point), so a `target="selection"`
   * day stepper reads back the value it edits. When `"selection"` and nothing
   * is picked yet it shows `emptyText` instead of a misleading view date.
   */
  source?: "view" | "selection";
  /** Placeholder for `source="selection"` with no selection. Default `"—"`. */
  emptyText?: string;
  col?: number | string;
  offset?: number;
  /** Show this range edge's day (with `source="view"`; overrides container). */
  bound?: Bound;
}) {
  const store = useCalendarStore();
  const t = useLabels();
  const locale = store.getConfig().locale;
  const viewDate = useDisplayDate(offset, bound);
  const selectedDate = useStoreSelector(store, (s) =>
    s.selection.shape === "point" ? s.selection.dates.at(-1)?.date : undefined,
  );
  // In selection mode with nothing picked, show a placeholder — never a stand-in
  // view date that reads as if it were the value.
  const empty = source === "selection" && !selectedDate;
  const date = source === "selection" ? (selectedDate ?? viewDate) : viewDate;
  const { longText, text } = useMemo(() => {
    const jsDate = new Date(date.year, date.month - 1, date.day);
    const longText = new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(jsDate);
    const text =
      format === "long"
        ? longText
        : new Intl.DateTimeFormat(locale, { day: format }).format(jsDate);
    return { longText, text };
  }, [date, locale, format]);
  return (
    <span
      data-toolbar-day-label=""
      data-empty={empty ? "" : undefined}
      className={cx(styles.label, className)}
      style={getGridSlotStyle(col)}
    >
      <span className={styles.srOnly}>
        {empty ? t("noDate") : t("currentDay", { day: longText })}
      </span>
      <span aria-hidden="true">{empty ? emptyText : text}</span>
    </span>
  );
}

// ── Month / Year triggers ────────────────────────────────────────────────────

type TriggerProps = WithClass & {
  /** Accessible label for the trigger button. */
  label?: string;
  /** Icon-sized trigger: chevron + short text. */
  compact?: boolean;
  /**
   * Edit this range edge (`"from"`/`"to"`) instead of the view: the trigger
   * shows the bound's month/year and picking commits via `setBoundDate` (the
   * core keeps the day in-month and owns ordering). Overrides the container
   * `bound`. No effect on point selections or before a range exists.
   */
  bound?: Bound;
  col?: number | string;
  offset?: number;
  /**
   * Replace the popup body with custom content — e.g. a drum picker:
   * `picker={<CalendarMonthsWheel />}` (wheels commit via `navigateTo` on
   * settle, so they work inside as-is). The wheel import is YOURS, so
   * grid-only consumers never bundle the drum physics. Default: the built-in
   * roving grid.
   */
  picker?: ReactNode;
  /**
   * "Confirm" footer button under a custom `picker` (default true). COMMITS the
   * staged pick: a picker inside the popup mutates a draft (via
   * `PickerDraftContext`), and Confirm applies it to the view before closing and
   * refocusing the trigger — so spinning a wheel previews in the popup without
   * lurching the calendar until the user confirms. Registry key `confirm`.
   */
  pickerConfirm?: boolean;
  /** aria-label override for the confirm footer button (visible = check icon). */
  confirmLabel?: string;
  /**
   * "Now" reset in the custom-picker footer (default true): one row with
   * Confirm, STAGES the current month/year into the draft (registry keys
   * `resetMonth`/`resetYear`), disabled while already there. Applied on Confirm
   * like any other staged pick. Prefer this over the wheel's own `showReset`
   * inside a trigger — one footer row, no stack.
   */
  pickerReset?: boolean;
};

/**
 * Month trigger: a button showing the current month that opens a 12-cell month
 * picker (roving arrow-key grid; swap the body via `picker`). Picking a month
 * navigates the view and closes. Popup state lives in `UIContext` (adapter),
 * never the core reducer.
 */
export function CalendarToolbarMonthTrigger({
  label,
  compact = false,
  short = false,
  col,
  offset,
  bound,
  picker,
  pickerConfirm = true,
  confirmLabel,
  pickerReset = true,
  className,
}: TriggerProps & {
  /**
   * Force the localized SHORT month name ("Jun"). Independent of `compact`
   * (which only adds the chevron). Omit for the full name, which a too-narrow
   * toolbar auto-shortens anyway (`@container cal-toolbar`, v2 parity).
   */
  short?: boolean;
}) {
  const store = useCalendarStore();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const { locale, min, max, readOnly } = store.getConfig();
  const date = useDisplayDate(offset, bound);
  const eff = useEffectiveOffset(offset);
  const effBound = useEffectiveBound(bound);
  const boundDate = useBoundDate(effBound);
  // Bound mode commits the pick to the range edge (keeping its day in-month);
  // view mode navigates. The core owns ordering — a cross-over pick is its
  // no-op, so the grid only gates min/max (like the wheel does).
  const commitDate = useCallback(
    (target: CalendarDate) => {
      if (effBound && boundDate) {
        const day = Math.min(
          boundDate.day,
          daysInMonth(target.year, target.month),
        );
        setBoundDate(calendarDate(target.year, target.month, day), effBound);
      } else {
        navigateTo(eff === 0 ? target : addMonths(target, -eff));
      }
    },
    [effBound, boundDate, eff, navigateTo, setBoundDate],
  );
  // Gate on the anchor too: two triggers of the same kind share the popup
  // state, so only the one that actually opened it (its button === the popup
  // anchor) renders open.
  const open = ui.isOpen("month") && ui.anchor === ref.current;
  // In bound mode the trigger mutates the value → also blocked by readOnly.
  const fixed =
    isMonthFixed(min, max) || (!!effBound && !!boundDate && readOnly);

  const names = useMemo(() => monthNames(locale, "short"), [locale]);
  const longNames = useMemo(() => monthNames(locale, "long"), [locale]);
  const longText = longNames[date.month - 1];
  const shortText = names[date.month - 1];

  const roving = useRovingTileFocus({
    itemCount: 12,
    activeIndex: date.month - 1,
  });

  const todayJs = useToday();

  // Staged month while the popup is open: a custom picker (wheel/grid) mutates
  // this draft via PickerDraftContext instead of the store, and the view only
  // moves when Confirm applies it. Re-seeded from the live view on each open.
  const [draft, setDraft] = useState<CalendarDate>(date);
  useEffect(() => {
    if (open) setDraft(date);
  }, [open, date]);
  const draftValue = useMemo(
    () => ({ date: draft, setDate: setDraft }),
    [draft],
  );
  const atCurrentMonth =
    !!todayJs &&
    draft.year === todayJs.getFullYear() &&
    draft.month === todayJs.getMonth() + 1;

  return (
    <>
      <UIButton
        ref={ref}
        disabled={fixed}
        aria-haspopup={fixed ? undefined : "dialog"}
        aria-expanded={fixed ? undefined : open}
        aria-label={t(
          "changeMonth",
          { month: longNames[date.month - 1] },
          label,
        )}
        data-toolbar-month-trigger=""
        data-short={short ? "" : undefined}
        className={className}
        style={getGridSlotStyle(col)}
        onClick={() => ref.current && ui.toggle("month", ref.current)}
      >
        {compact && <ChevronDownIcon />}
        {/* Long + short month both render; CSS shows one (forced by the `short`
            prop or auto-swapped by a narrow toolbar container, v2 parity). The
            accessible name is the aria-label above, so the hidden variant adds
            no SR noise. */}
        <span className={styles.variantLong}>{longText}</span>
        <span className={styles.variantShort}>{shortText}</span>
      </UIButton>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("monthPicker")}
      >
        {picker ? (
          // Staging needs a Confirm to apply it; without one the picker stays
          // live (commits straight to the view, the pre-staging behavior).
          <PickerDraftProvider value={pickerConfirm ? draftValue : null}>
            <div className={styles.pickerBody}>
              {picker}
              {(pickerReset || pickerConfirm) && (
                <div className={styles.pickerFooter}>
                  {pickerReset && (
                    <UIButton
                      size="sm"
                      disabled={atCurrentMonth || !todayJs}
                      aria-label={t("resetMonth", {
                        month: todayJs ? longNames[todayJs.getMonth()] : "",
                      })}
                      onClick={() => {
                        if (!todayJs) return;
                        const target = calendarDate(
                          todayJs.getFullYear(),
                          todayJs.getMonth() + 1,
                          1,
                        );
                        // Stage when confirming; commit live otherwise.
                        if (pickerConfirm) setDraft(target);
                        else commitDate(target);
                      }}
                    >
                      {todayJs ? longNames[todayJs.getMonth()] : ""}
                    </UIButton>
                  )}
                  {pickerConfirm && (
                    <UIButton
                      size="sm"
                      aria-label={t("confirm", undefined, confirmLabel)}
                      onClick={() => {
                        // Apply the staged draft (view or bound), then close.
                        commitDate(draft);
                        ui.close();
                        ref.current?.focus();
                      }}
                    >
                      <CheckIcon />
                    </UIButton>
                  )}
                </div>
              )}
            </div>
          </PickerDraftProvider>
        ) : (
          <div
            ref={roving.containerRef}
            className={styles.pickerGrid}
            data-cols="3"
            onKeyDown={roving.handleKeyDown}
          >
            {names.map((name, i) => {
              const m = i + 1;
              const selected = m === date.month;
              const outOfBounds = !isMonthInBounds(date.year, m, min, max);
              return (
                <UITile
                  key={name}
                  {...roving.getItemProps(i)}
                  disabled={outOfBounds}
                  selected={selected}
                  aria-current={selected ? "true" : undefined}
                  aria-label={longNames[i]}
                  onClick={() => {
                    commitDate(calendarDate(date.year, m, 1));
                    ui.close();
                  }}
                >
                  {name}
                </UITile>
              );
            })}
          </div>
        )}
      </CalendarPopup>
    </>
  );
}

const YEAR_PAGE = 12;

/**
 * Year trigger: a button showing the current year that opens a paged year grid
 * (12/page). The pager re-anchors to the view year each time it opens, and the
 * pager buttons stop at the `min`/`max` window.
 */
export function CalendarToolbarYearTrigger({
  label,
  compact = false,
  col,
  offset,
  bound,
  picker,
  pickerConfirm = true,
  confirmLabel,
  pickerReset = true,
  className,
}: TriggerProps) {
  const store = useCalendarStore();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const { min, max, readOnly } = store.getConfig();
  const date = useDisplayDate(offset, bound);
  const eff = useEffectiveOffset(offset);
  const effBound = useEffectiveBound(bound);
  const boundDate = useBoundDate(effBound);
  // Bound mode commits the picked year to the range edge (day kept in-month);
  // view mode navigates. Core owns ordering (cross-over = its no-op).
  const commitDate = useCallback(
    (target: CalendarDate) => {
      if (effBound && boundDate) {
        const day = Math.min(
          boundDate.day,
          daysInMonth(target.year, target.month),
        );
        setBoundDate(calendarDate(target.year, target.month, day), effBound);
      } else {
        navigateTo(eff === 0 ? target : addMonths(target, -eff));
      }
    },
    [effBound, boundDate, eff, navigateTo, setBoundDate],
  );
  const open = ui.isOpen("year") && ui.anchor === ref.current;
  const fixed =
    isYearFixed(min, max) || (!!effBound && !!boundDate && readOnly);
  const [page, setPage] = useState(0);

  // Re-anchor the window on every open — a stale page from the last session
  // would otherwise show an arbitrary decade.
  useEffect(() => {
    if (open) setPage(0);
  }, [open]);

  const base = Math.floor(date.year / YEAR_PAGE) * YEAR_PAGE + page * YEAR_PAGE;
  const years = Array.from({ length: YEAR_PAGE }, (_, i) => base + i);
  const canPagePrev = !min || base - 1 >= min.year;
  const canPageNext = !max || base + YEAR_PAGE <= max.year;

  const roving = useRovingTileFocus({
    itemCount: YEAR_PAGE,
    activeIndex: Math.min(Math.max(date.year - base, 0), YEAR_PAGE - 1),
  });

  const todayJs = useToday();

  // Staged year while the popup is open (see MonthTrigger): a custom picker
  // mutates this draft, applied to the view only on Confirm.
  const [draft, setDraft] = useState<CalendarDate>(date);
  useEffect(() => {
    if (open) setDraft(date);
  }, [open, date]);
  const draftValue = useMemo(
    () => ({ date: draft, setDate: setDraft }),
    [draft],
  );

  return (
    <>
      <UIButton
        ref={ref}
        disabled={fixed}
        aria-haspopup={fixed ? undefined : "dialog"}
        aria-expanded={fixed ? undefined : open}
        aria-label={t("changeYear", { year: date.year }, label)}
        data-toolbar-year-trigger=""
        className={className}
        style={getGridSlotStyle(col)}
        onClick={() => ref.current && ui.toggle("year", ref.current)}
      >
        {compact && <ChevronDownIcon />}
        {date.year}
      </UIButton>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("yearPicker")}
      >
        {picker ? (
          <PickerDraftProvider value={pickerConfirm ? draftValue : null}>
            <div className={styles.pickerBody}>
              {picker}
              {(pickerReset || pickerConfirm) && (
                <div className={styles.pickerFooter}>
                  {pickerReset && (
                    <UIButton
                      size="sm"
                      disabled={
                        !todayJs || draft.year === todayJs.getFullYear()
                      }
                      aria-label={t("resetYear", {
                        year: todayJs ? todayJs.getFullYear() : "",
                      })}
                      onClick={() => {
                        if (!todayJs) return;
                        const target = calendarDate(
                          todayJs.getFullYear(),
                          draft.month,
                          1,
                        );
                        // Stage when confirming; commit live otherwise.
                        if (pickerConfirm) setDraft(target);
                        else commitDate(target);
                      }}
                    >
                      {todayJs ? todayJs.getFullYear() : ""}
                    </UIButton>
                  )}
                  {pickerConfirm && (
                    <UIButton
                      size="sm"
                      aria-label={t("confirm", undefined, confirmLabel)}
                      onClick={() => {
                        commitDate(draft);
                        ui.close();
                        ref.current?.focus();
                      }}
                    >
                      <CheckIcon />
                    </UIButton>
                  )}
                </div>
              )}
            </div>
          </PickerDraftProvider>
        ) : (
          <>
            <div className={styles.pickerHead}>
              <UIButton
                disabled={!canPagePrev}
                aria-label={t("previousYears")}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon />
              </UIButton>
              <span className={styles.label}>
                {years[0]}–{years[years.length - 1]}
              </span>
              <UIButton
                disabled={!canPageNext}
                aria-label={t("nextYears")}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon />
              </UIButton>
            </div>
            <div
              ref={roving.containerRef}
              className={styles.pickerGrid}
              data-cols="3"
              onKeyDown={roving.handleKeyDown}
            >
              {years.map((y, i) => {
                const selected = y === date.year;
                const outOfBounds = !isYearInBounds(y, min, max);
                return (
                  <UITile
                    key={y}
                    {...roving.getItemProps(i)}
                    disabled={outOfBounds}
                    selected={selected}
                    aria-current={selected ? "true" : undefined}
                    onClick={() => {
                      commitDate(calendarDate(y, date.month, 1));
                      ui.close();
                    }}
                  >
                    {y}
                  </UITile>
                );
              })}
            </div>
          </>
        )}
      </CalendarPopup>
    </>
  );
}

// ── Clear / Apply ────────────────────────────────────────────────────────────

function useHasSelection(): boolean {
  const store = useCalendarStore();
  return useStoreSelector(store, (s) =>
    s.selection.shape === "point"
      ? s.selection.dates.length > 0
      : s.selection.ranges.length > 0 || s.selection.draftAnchor !== undefined,
  );
}

/** Clear the whole selection. Disabled when empty or readOnly. */
export function CalendarToolbarClear({
  label,
  col,
  className,
  children,
}: WithClass & { label?: string; col?: number | string }) {
  const store = useCalendarStore();
  const { clear } = useCalendarActions();
  const t = useLabels();
  const hasSelection = useHasSelection();
  return (
    <UIButton
      disabled={!hasSelection || store.getConfig().readOnly}
      aria-label={t("clear", undefined, label)}
      data-toolbar-clear=""
      className={className}
      style={getGridSlotStyle(col)}
      onClick={() => clear()}
    >
      {children ?? <ClearIcon />}
    </UIButton>
  );
}

/**
 * Hand the current public value (same shape as root `onChange`) to a host
 * callback — the "confirm" button of picker-in-popover UIs. Disabled when
 * nothing is selected or readOnly (override via `disabled`).
 */
export function CalendarToolbarApply({
  onApply,
  disabled,
  label,
  col,
  className,
  children,
}: WithClass & {
  onApply?: (value: AnyCalendarValue) => void;
  disabled?: boolean;
  label?: string;
  col?: number | string;
}) {
  const store = useCalendarStore();
  const t = useLabels();
  const hasSelection = useHasSelection();
  const config = store.getConfig();
  const isDisabled = disabled ?? (!hasSelection || config.readOnly);
  return (
    <UIButton
      disabled={isDisabled}
      aria-label={t("apply", undefined, label)}
      data-toolbar-apply=""
      className={className}
      style={getGridSlotStyle(col)}
      onClick={() =>
        onApply?.(toPublicValue(store.getState().selection, config))
      }
    >
      {children ?? <CheckIcon />}
    </UIButton>
  );
}

// ── Clock ────────────────────────────────────────────────────────────────────

/**
 * Live wall-clock time, decorative (`aria-hidden` — assistive tech has the OS
 * clock). Ticks aligned to the minute (or second) boundary, so the interval
 * does no idle work between updates.
 */
export function CalendarToolbarClock({
  seconds = false,
  col,
  className,
}: WithClass & { seconds?: boolean; col?: number | string }) {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const [text, setText] = useState("");

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      ...(seconds ? { second: "2-digit" } : undefined),
    });
    let id: ReturnType<typeof setTimeout>;
    const tick = () => {
      setText(fmt.format(new Date()));
      const now = Date.now();
      const step = seconds ? 1000 : 60_000;
      id = setTimeout(tick, step - (now % step));
    };
    tick();
    return () => clearTimeout(id);
  }, [locale, seconds]);

  return (
    <span
      aria-hidden="true"
      data-toolbar-clock=""
      className={cx(styles.clock, className)}
      style={getGridSlotStyle(col)}
    >
      <span className={styles.clockDot} />
      {text}
    </span>
  );
}

// ── Time trigger ──────────────────────────────────────────────────────────────

const wrap = (n: number, mod: number) => ((n % mod) + mod) % mod;

/**
 * One time unit as a WAI-ARIA `spinbutton` (mirrors the TimeWheel drum): the
 * value is the single focusable control, announced via `aria-valuenow`/`-text`
 * and stepped with Arrow/Home/End. The chevron buttons are mouse-only
 * affordances — hidden from assistive tech and out of the tab order so they
 * don't double up the spinbutton.
 */
function TimeUnit({
  label,
  value,
  min,
  max,
  valueText,
  onStep,
  onSet,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  valueText: string;
  onStep: (dir: -1 | 1) => void;
  onSet: (value: number) => void;
}) {
  const stepBtn = (dir: -1 | 1, icon: ReactNode) => (
    <span
      className={styles.timeStep}
      aria-hidden="true"
      onMouseDown={(e) => {
        e.preventDefault(); // keep focus on the spinbutton
        onStep(dir);
      }}
    >
      {icon}
    </span>
  );
  return (
    <span className={styles.timeUnit}>
      {stepBtn(1, <ChevronUpIcon />)}
      <span
        className={styles.timeValue}
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuetext={valueText}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            onStep(1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            onStep(-1);
          } else if (e.key === "Home") {
            e.preventDefault();
            onSet(min);
          } else if (e.key === "End") {
            e.preventDefault();
            onSet(max);
          }
        }}
      >
        {valueText}
      </span>
      {stepBtn(-1, <ChevronDownIcon />)}
    </span>
  );
}

/**
 * Built-in compact time picker: an up/down stepper per unit (+ an AM/PM toggle
 * for 12h). Commits live via `onChange` — the lightweight default body when no
 * `picker` (e.g. a drum wheel) is supplied.
 */
function TimeSteppers({
  value,
  hour12,
  seconds,
  step,
  ampmLabels,
  onChange,
  t,
}: {
  value: CalendarTime;
  hour12: boolean;
  seconds: boolean;
  step: number;
  ampmLabels?: { am: string; pm: string };
  onChange: (next: CalendarTime) => void;
  t: ReturnType<typeof useLabels>;
}) {
  const set = (patch: Partial<CalendarTime>) =>
    onChange({ ...value, ...patch });
  const hour = hour12
    ? String(((value.hour + 11) % 12) + 1).padStart(2, "0")
    : String(value.hour).padStart(2, "0");
  const isPm = value.hour >= 12;
  const periodText = isPm ? (ampmLabels?.pm ?? "PM") : (ampmLabels?.am ?? "AM");
  return (
    <div
      className={styles.timePicker}
      role="group"
      aria-label={t("timePicker")}
    >
      <TimeUnit
        label={t("hours")}
        value={value.hour}
        min={0}
        max={23}
        valueText={hour}
        onStep={(dir) => set({ hour: wrap(value.hour + dir, 24) })}
        onSet={(v) => set({ hour: v })}
      />
      <span className={styles.timeColon} aria-hidden="true">
        :
      </span>
      <TimeUnit
        label={t("minutes")}
        value={value.minute}
        min={0}
        max={59}
        valueText={String(value.minute).padStart(2, "0")}
        onStep={(dir) => set({ minute: wrap(value.minute + dir * step, 60) })}
        onSet={(v) => set({ minute: v })}
      />
      {seconds && (
        <>
          <span className={styles.timeColon} aria-hidden="true">
            :
          </span>
          <TimeUnit
            label={t("seconds")}
            value={value.second}
            min={0}
            max={59}
            valueText={String(value.second).padStart(2, "0")}
            onStep={(dir) => set({ second: wrap(value.second + dir, 60) })}
            onSet={(v) => set({ second: v })}
          />
        </>
      )}
      {hour12 && (
        <UIButton
          size="sm"
          className={styles.timePeriod}
          aria-label={t("timePeriod", { period: periodText })}
          onClick={() => set({ hour: wrap(value.hour + 12, 24) })}
        >
          {periodText}
        </UIButton>
      )}
    </div>
  );
}

/**
 * Time trigger: a button showing the selected time that opens a time picker.
 * `compact` shows a clock icon instead of the text. The built-in popup is a
 * compact stepper UI; swap it for a drum via `picker={<CalendarTimeWheel/>}`
 * (the wheel import stays on the consumer, like the month/year triggers).
 * `hour12` comes from the ROOT config so the display and any picker never
 * desync. Disabled until a date is selected — there is no time to edit yet.
 */
export function CalendarToolbarTime({
  compact = false,
  seconds = false,
  step = 1,
  label,
  col,
  bound,
  className,
  picker,
  pickerConfirm = true,
  confirmLabel,
  onTimeSelect,
}: WithClass & {
  compact?: boolean;
  seconds?: boolean;
  step?: number;
  label?: string;
  col?: number | string;
  /**
   * Edit this range edge's time (`"from"`/`"to"`) instead of the from-time
   * default. Overrides the container `bound`. Span selections only.
   */
  bound?: Bound;
  picker?: ReactNode;
  pickerConfirm?: boolean;
  confirmLabel?: string;
  onTimeSelect?: (time: CalendarTime) => void;
}) {
  const store = useCalendarStore();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const {
    locale,
    hour12 = false,
    readOnly,
    defaultTime,
    ampmLabels,
  } = store.getConfig();
  const { setTime } = useCalendarActions();
  const selection = useStoreSelector(store, (s) => s.selection);
  // In a bound toolbar default to that edge's time; an explicit `to` shows the
  // end time. Falls back to `from` when no bound is in play.
  const effBound = useEffectiveBound(bound);

  const value: CalendarTime =
    selection.shape === "span"
      ? ((effBound === "to" ? selection.toTime : selection.fromTime) ??
        defaultTime ??
        MIDNIGHT)
      : (selection.dates.at(-1)?.time ?? defaultTime ?? MIDNIGHT);
  const hasTarget =
    selection.shape === "span"
      ? selection.ranges.length > 0
      : selection.dates.length > 0;
  const disabled = readOnly || !hasTarget;
  const open = ui.isOpen("time") && ui.anchor === ref.current;

  const text = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        ...(seconds ? { second: "2-digit" } : undefined),
        hour12,
      }).format(new Date(2000, 0, 1, value.hour, value.minute, value.second)),
    [locale, seconds, hour12, value.hour, value.minute, value.second],
  );

  // Dispatch is synchronous; read the committed time back so `onTimeSelect`
  // only fires for changes that actually landed (validation may reject). Bound
  // mode targets that edge's time; the core keeps from/to ordered.
  const commit = (next: CalendarTime) => {
    setTime(next, effBound);
    const after = store.getState().selection;
    const committed =
      after.shape === "span"
        ? effBound === "to"
          ? after.toTime
          : after.fromTime
        : after.dates.at(-1)?.time;
    if (committed && timesEqual(committed, next)) onTimeSelect?.(next);
  };

  // Confirm-staging for a wheel picker: it writes the draft; Confirm applies it.
  // Re-seeded from the committed time on each open. The built-in steppers commit
  // live (no Confirm), so they ignore this.
  const [draftTime, setDraftTime] = useState<CalendarTime>(value);
  useEffect(() => {
    if (open) setDraftTime(value);
  }, [open, value.hour, value.minute, value.second]);
  const timeDraft = useMemo(
    () => ({ time: draftTime, setTime: setDraftTime }),
    [draftTime],
  );

  return (
    <>
      <UIButton
        ref={ref}
        disabled={disabled}
        aria-haspopup={disabled ? undefined : "dialog"}
        aria-expanded={disabled ? undefined : open}
        aria-label={t("changeTime", { time: text }, label)}
        data-toolbar-time=""
        className={className}
        style={getGridSlotStyle(col)}
        onClick={() => ref.current && ui.toggle("time", ref.current)}
      >
        {compact ? <ClockIcon /> : text}
      </UIButton>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("timePicker")}
      >
        {picker ? (
          // Staging needs a Confirm to apply it; without one the picker stays
          // live (commits straight to the selection, the pre-staging behavior).
          <TimePickerDraftProvider value={pickerConfirm ? timeDraft : null}>
            <div className={styles.pickerBody}>
              {picker}
              {pickerConfirm && (
                <div className={styles.pickerFooter}>
                  <UIButton
                    size="sm"
                    aria-label={t("confirm", undefined, confirmLabel)}
                    onClick={() => {
                      // Apply the staged time to the selection, then close.
                      commit(draftTime);
                      ui.close();
                      ref.current?.focus();
                    }}
                  >
                    <CheckIcon />
                  </UIButton>
                </div>
              )}
            </div>
          </TimePickerDraftProvider>
        ) : (
          <TimeSteppers
            value={value}
            hour12={hour12}
            seconds={seconds}
            step={step}
            ampmLabels={ampmLabels}
            onChange={commit}
            t={t}
          />
        )}
      </CalendarPopup>
    </>
  );
}

// ── Theme toggle ──────────────────────────────────────────────────────────────

/**
 * Resolve whether the calendar is currently dark, tracking both the explicit
 * scheme and — for `"auto"` — the OS preference (subscribed, so a system flip
 * updates the `aria-pressed` state live). `false` until mounted, matching the
 * server's CSS-native first paint.
 */
function useResolvedDark(scheme: SchemeMode): boolean {
  const [systemDark, setSystemDark] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  if (scheme === "dark") return true;
  if (scheme === "light") return false;
  return systemDark;
}

/**
 * Light/dark toggle. Flips the root `data-scheme` (resolving `"auto"` against
 * the OS on the first flip); `aria-pressed` reflects the resolved dark state.
 * Uncontrolled by default — under a controlled `<Calendar scheme onSchemeChange>`
 * the flip calls the host instead (see `Calendar`).
 */
export function CalendarToolbarThemeToggle({
  label,
  col,
  className,
  children,
}: WithClass & { label?: string; col?: number | string }) {
  const ui = useUI();
  const t = useLabels();
  const isDark = useResolvedDark(ui.scheme);
  const aria = isDark
    ? t("themeSwitchToLight", undefined, label)
    : t("themeSwitchToDark", undefined, label);
  return (
    <UIButton
      aria-label={aria}
      aria-pressed={isDark}
      data-toolbar-theme-toggle=""
      className={className}
      style={getGridSlotStyle(col)}
      onClick={ui.toggleScheme}
    >
      {children ?? <ThemeToggleIcon />}
    </UIButton>
  );
}
