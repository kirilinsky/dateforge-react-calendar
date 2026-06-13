import {
  type CSSProperties,
  createContext,
  type KeyboardEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  addMonths,
  type CalendarDate,
  calendarDate,
} from "../../core-v3/calendar-date";
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
  ClearIcon,
  HomeIcon,
  ThemeToggleIcon,
} from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
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

// ── Toolbar context: the month offset this toolbar's parts display ──────────
// Minimal by design (one field) — primitives stay usable standalone, where the
// context simply defaults to offset 0.

const ToolbarContext = createContext<{ offset: number }>({ offset: 0 });

/** Effective month offset: container offset + per-part override. */
function useEffectiveOffset(own?: number): number {
  const base = useContext(ToolbarContext).offset;
  return base + (own ?? 0);
}

/** The date this toolbar part displays: root view shifted by the offset. */
function useDisplayDate(own?: number): CalendarDate {
  const store = useCalendarStore();
  const view = useStoreSelector(store, (s) => s.view.viewDate);
  const offset = useEffectiveOffset(own);
  return useMemo(
    () => (offset === 0 ? view : addMonths(view, offset)),
    [view, offset],
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
  theme,
  scheme,
  className,
  children,
}: CalendarToolbarProps) {
  const t = useLabels();
  const ctx = useMemo(() => ({ offset }), [offset]);
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
  /** Accessible label override (else resolves from the label registry). */
  label?: string;
  col?: number | string;
};

const STEP_LABEL_KEY = {
  "-1": { day: "previousDay", month: "previousMonth", year: "previousYear" },
  "1": { day: "nextDay", month: "nextMonth", year: "nextYear" },
} as const;

function StepButton({
  dir,
  attr,
  unit = "month",
  label,
  col,
  className,
  children,
}: StepProps & { dir: -1 | 1; attr: string }) {
  const store = useCalendarStore();
  const { navigateBy } = useCalendarActions();
  const t = useLabels();
  const date = useDisplayDate();
  const { min, max } = store.getConfig();
  // Gate on the DISPLAYED month: in an offset pair the trailing toolbar must
  // stop while its own month is at the edge, not the root view's.
  const canGo = canStepView(date, unit, dir, min, max);
  return (
    <UIButton
      disabled={!canGo}
      aria-label={t(STEP_LABEL_KEY[`${dir}`][unit], undefined, label)}
      {...{ [attr]: "" }}
      className={className}
      style={getGridSlotStyle(col)}
      onClick={() => navigateBy(unit, dir)}
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

/** Jump the view to today. Disabled while today's month is already shown. */
export function CalendarToolbarHome({
  label,
  col,
  offset,
  className,
  children,
}: WithClass & { label?: string; col?: number | string; offset?: number }) {
  const { navigateTo } = useCalendarActions();
  const t = useLabels();
  const date = useDisplayDate(offset);
  const eff = useEffectiveOffset(offset);
  const todayJs = useToday(); // null until mounted — SSR-safe disabled state
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
};

const FULL_LABEL: Intl.DateTimeFormatOptions = {
  month: "long",
  year: "numeric",
};

function useViewText(
  options: Intl.DateTimeFormatOptions,
  offset?: number,
): { date: CalendarDate; text: string } {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const date = useDisplayDate(offset);
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
  className,
  children,
}: LabelProps & { level?: 1 | 2 | 3 | 4 | 5 | 6 }) {
  const store = useCalendarStore();
  const locale = store.getConfig().locale;
  const opts = options ?? FULL_LABEL;
  const { date, text } = useViewText(opts, offset);
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
  className,
}: WithClass & {
  short?: boolean;
  col?: number | string;
  offset?: number;
}) {
  const store = useCalendarStore();
  const t = useLabels();
  const locale = store.getConfig().locale;
  const format = short ? "short" : "long";
  const { date, text } = useViewText(
    useMemo(() => ({ month: format }), [format]),
    offset,
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
  className,
}: LabelProps) {
  const t = useLabels();
  const { date, text } = useViewText(options ?? YEAR_ONLY, offset);
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
  col,
  offset,
  className,
}: WithClass & {
  format?: "numeric" | "2-digit" | "long";
  col?: number | string;
  offset?: number;
}) {
  const store = useCalendarStore();
  const t = useLabels();
  const locale = store.getConfig().locale;
  const date = useDisplayDate(offset);
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
      className={cx(styles.label, className)}
      style={getGridSlotStyle(col)}
    >
      <span className={styles.srOnly}>
        {t("currentDay", { day: longText })}
      </span>
      <span aria-hidden="true">{text}</span>
    </span>
  );
}

// ── Month / Year triggers ────────────────────────────────────────────────────

type TriggerProps = WithClass & {
  /** Accessible label for the trigger button. */
  label?: string;
  /** Icon-sized trigger: chevron + short text. */
  compact?: boolean;
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
   * "Confirm" footer button under a custom `picker` (default true). NOT a
   * commit — the picker's value is already live (v3 has no popup staging,
   * unlike v2); it's the explicit "done" affordance: closes the popup and
   * returns focus to the trigger. Registry key `confirm`.
   */
  pickerConfirm?: boolean;
  /** aria-label override for the confirm footer button (visible = check icon). */
  confirmLabel?: string;
  /**
   * "Now" reset in the custom-picker footer (default true): one row with
   * Confirm, jumps the view to the current month/year (registry keys
   * `resetMonth`/`resetYear`), disabled while already there. Prefer this over
   * the wheel's own `showReset` inside a trigger — one footer row, no stack.
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
  col,
  offset,
  picker,
  pickerConfirm = true,
  confirmLabel,
  pickerReset = true,
  className,
}: TriggerProps) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const { locale, min, max } = store.getConfig();
  const date = useDisplayDate(offset);
  const eff = useEffectiveOffset(offset);
  const open = ui.isOpen("month");
  const fixed = isMonthFixed(min, max);

  const names = useMemo(() => monthNames(locale, "short"), [locale]);
  const longNames = useMemo(() => monthNames(locale, "long"), [locale]);
  const text = compact ? names[date.month - 1] : longNames[date.month - 1];
  // Width sizer (same as the labels): the trigger reserves the longest month
  // name, so stepping months never resizes the button or shifts the toolbar.
  const sizer = useMemo(
    () => longest(compact ? names : longNames),
    [compact, names, longNames],
  );

  const roving = useRovingTileFocus({
    itemCount: 12,
    activeIndex: date.month - 1,
  });

  const todayJs = useToday();
  const atCurrentMonth =
    !!todayJs &&
    date.year === todayJs.getFullYear() &&
    date.month === todayJs.getMonth() + 1;

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
        className={className}
        style={getGridSlotStyle(col)}
        onClick={() => ref.current && ui.toggle("month", ref.current)}
      >
        {compact && <ChevronDownIcon />}
        <span className={styles.slot}>
          <span className={styles.sizer} aria-hidden="true">
            {sizer}
          </span>
          <span>{text}</span>
        </span>
      </UIButton>
      <CalendarPopup
        open={open}
        anchor={ref.current}
        onClose={ui.close}
        label={t("monthPicker")}
      >
        {picker ? (
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
                      navigateTo(eff === 0 ? target : addMonths(target, -eff));
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
                    const target = calendarDate(date.year, m, 1);
                    navigateTo(eff === 0 ? target : addMonths(target, -eff));
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
  picker,
  pickerConfirm = true,
  confirmLabel,
  pickerReset = true,
  className,
}: TriggerProps) {
  const store = useCalendarStore();
  const { navigateTo } = useCalendarActions();
  const ui = useUI();
  const t = useLabels();
  const ref = useRef<HTMLButtonElement>(null);
  const { min, max } = store.getConfig();
  const date = useDisplayDate(offset);
  const eff = useEffectiveOffset(offset);
  const open = ui.isOpen("year");
  const fixed = isYearFixed(min, max);
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
          <div className={styles.pickerBody}>
            {picker}
            {(pickerReset || pickerConfirm) && (
              <div className={styles.pickerFooter}>
                {pickerReset && (
                  <UIButton
                    size="sm"
                    disabled={!todayJs || date.year === todayJs.getFullYear()}
                    aria-label={t("resetYear", {
                      year: todayJs ? todayJs.getFullYear() : "",
                    })}
                    onClick={() => {
                      if (!todayJs) return;
                      const target = calendarDate(
                        todayJs.getFullYear(),
                        date.month,
                        1,
                      );
                      navigateTo(eff === 0 ? target : addMonths(target, -eff));
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
                      const target = calendarDate(y, date.month, 1);
                      navigateTo(eff === 0 ? target : addMonths(target, -eff));
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
