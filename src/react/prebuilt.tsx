import { Fragment, useMemo } from "react";
import { calendarDate } from "../core/calendar-date";
import type { DateRuleConfig } from "../core/date-rule-engine";
import type {
  AnyCalendarValue,
  CalendarChangeDetails,
  PublicRange,
} from "../core/public-value";
import type { SelectionState } from "../core/state";
import { CalendarDays } from "../modules/days/CalendarDays";
import { CalendarManualInput } from "../modules/manual-input/CalendarManualInput";
import { CalendarMonthsGrid } from "../modules/months-grid/CalendarMonthsGrid";
import {
  CalendarToolbar,
  CalendarToolbarGroup,
  CalendarToolbarHome,
  CalendarToolbarMonthLabel,
  CalendarToolbarMonthTrigger,
  CalendarToolbarNext,
  CalendarToolbarPrev,
  CalendarToolbarYearLabel,
  CalendarToolbarYearTrigger,
} from "../modules/toolbar/CalendarToolbar";
import type { CalendarAppearance } from "../styles/appearance-tokens";
import type { ThemeFamily } from "../styles/theme-tokens";
import { Calendar } from "./calendar";
import { type CalendarConfigOptions, createCalendarConfig } from "./config";
import { useCalendarActions } from "./provider";
import type { SchemeMode } from "./ui-context";

/**
 * Prebuilt calendars — one import, zero composition. For consumers who don't
 * want to assemble modules: each is a ready recipe over the same primitives
 * (`Calendar` + modules + `createCalendarConfig`), with plain-`Date` props.
 * Live on their own subpath (`@dateforge/react-calendar/prebuilt`) so the
 * modular entries stay pay-for-what-you-import.
 */

type PrebuiltShared = {
  /** BCP-47 locale (drives names, digits, week start). */
  locale?: string;
  /** Earliest / latest selectable day (inclusive). */
  min?: Date;
  max?: Date;
  /** Days that cannot be selected. */
  disabled?: DateRuleConfig;
  readOnly?: boolean;
  /** Theme: built-in name or a `createTheme` family. */
  theme?: string | ThemeFamily;
  /** Appearance: built-in name or a `createAppearance` object. */
  appearance?: CalendarAppearance;
  /** Decorative gradient mode (corner glows + gradient selected fill). */
  gradient?: boolean;
  scheme?: SchemeMode;
  /** Extra `createCalendarConfig` options (escape hatch — spread last). */
  config?: CalendarConfigOptions;
  className?: string;
  "data-testid"?: string;
};

/** Single JS `Date` (or `null`) — the shape `mode:"single"` emits. */
type SingleDateProps = PrebuiltShared & {
  /** Controlled value. Omit for uncontrolled. */
  value?: Date | null;
  /** Uncontrolled initial date. */
  defaultValue?: Date | null;
  onChange?: (date: Date | null) => void;
};

function useSingleConfig(props: PrebuiltShared, extra?: CalendarConfigOptions) {
  const { locale, min, max, disabled, readOnly, config } = props;
  // Compiling rules is cheap but not free — memo on the inputs.
  return useMemo(
    () =>
      createCalendarConfig({
        mode: "single",
        locale,
        min,
        max,
        disabled,
        readOnly,
        ...extra,
        ...config,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, min, max, disabled, readOnly, config, extra],
  );
}

const single = (onChange?: (d: Date | null) => void) =>
  onChange
    ? (v: AnyCalendarValue) => onChange(v instanceof Date ? v : null)
    : undefined;

/**
 * The default calendar: month/year navigation header + day grid, single-date
 * selection. `<SimpleCalendar onChange={setDate} />` and done.
 */
export function SimpleCalendar(props: SingleDateProps) {
  const {
    value,
    defaultValue,
    onChange,
    theme,
    appearance,
    gradient,
    scheme,
    className,
  } = props;
  const config = useSingleConfig(props);
  return (
    <Calendar
      config={config}
      value={value}
      defaultValue={defaultValue}
      onChange={single(onChange)}
      theme={theme}
      appearance={appearance}
      gradient={gradient}
      scheme={scheme}
      className={className}
      data-testid={props["data-testid"] ?? "dateforge-simple-calendar"}
    >
      <CalendarToolbar cols="auto minmax(0, 1fr) auto">
        <CalendarToolbarPrev />
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbarGroup>
        <CalendarToolbarNext />
      </CalendarToolbar>
      <CalendarDays />
    </Calendar>
  );
}

/**
 * A date picker: typed manual input above the calendar, plus a Today jump —
 * keyboard-first single-date entry with the grid as fallback.
 */
export function DatePicker(props: SingleDateProps) {
  const {
    value,
    defaultValue,
    onChange,
    theme,
    appearance,
    gradient,
    scheme,
    className,
  } = props;
  const config = useSingleConfig(props);
  return (
    <Calendar
      config={config}
      value={value}
      defaultValue={defaultValue}
      onChange={single(onChange)}
      theme={theme}
      appearance={appearance}
      gradient={gradient}
      scheme={scheme}
      className={className}
      data-testid={props["data-testid"] ?? "dateforge-date-picker"}
    >
      <CalendarManualInput allowClear />
      <CalendarToolbar cols="auto minmax(0, 1fr) auto">
        <CalendarToolbarGroup>
          <CalendarToolbarPrev />
          <CalendarToolbarHome />
        </CalendarToolbarGroup>
        <CalendarToolbarGroup>
          <CalendarToolbarMonthTrigger />
          <CalendarToolbarYearTrigger />
        </CalendarToolbarGroup>
        <CalendarToolbarNext />
      </CalendarToolbar>
      <CalendarDays />
    </Calendar>
  );
}

type MonthPickerProps = PrebuiltShared & {
  /** Controlled month (any day inside it). Omit for uncontrolled. */
  value?: Date | null;
  /** Uncontrolled initial month (any day inside it). */
  defaultValue?: Date | null;
  /** First day of the picked month (or `null` when cleared). */
  onChange?: (month: Date | null) => void;
};

/** Bridges the grid's observational click to a month-span selection. */
function MonthSelect() {
  const { selectDay } = useCalendarActions();
  return (
    <CalendarMonthsGrid
      onMonthSelect={(year, month) => selectDay(calendarDate(year, month, 1))}
    />
  );
}

const isRange = (v: AnyCalendarValue): v is PublicRange =>
  typeof v === "object" && v !== null && "start" in v;

/** A month `Date` widened to the whole-month span the `unit:"month"` config expects. */
const monthSpan = (d: Date | null | undefined) =>
  d == null
    ? d
    : {
        start: new Date(d.getFullYear(), d.getMonth(), 1),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
      };

/**
 * A month picker: year-stepping header + 12-month grid; picking a month
 * selects the whole month (`unit: "month"`), reported as its first day.
 */
export function MonthPicker(props: MonthPickerProps) {
  const {
    value,
    defaultValue,
    onChange,
    theme,
    appearance,
    gradient,
    scheme,
    className,
  } = props;
  const config = useSingleConfig(props, { unit: "month" });
  return (
    <Calendar
      config={config}
      value={monthSpan(value)}
      defaultValue={monthSpan(defaultValue) ?? undefined}
      onChange={
        onChange
          ? (v: AnyCalendarValue) => onChange(isRange(v) ? v.start : null)
          : undefined
      }
      theme={theme}
      appearance={appearance}
      gradient={gradient}
      scheme={scheme}
      className={className}
      data-testid={props["data-testid"] ?? "dateforge-month-picker"}
    >
      <CalendarToolbar cols="auto minmax(0, 1fr) auto">
        <CalendarToolbarPrev unit="year" />
        <CalendarToolbarYearTrigger />
        <CalendarToolbarNext unit="year" />
      </CalendarToolbar>
      <MonthSelect />
    </Calendar>
  );
}

type MultiMonthProps = PrebuiltShared & {
  /** How many consecutive months to render. Default `3`. */
  months?: number;
  /** Grid columns (months per row). Default `3`. */
  cols?: number;
  /** Selection mode for the whole board. Default `"range"`. */
  mode?: "single" | "multiple" | "range" | "multi-range";
  /** First shown month (any day inside it). Default: the current month. */
  startMonth?: Date;
  /**
   * Prev/next arrows stepping the whole board by one month (on the first and
   * last header). Default `true`.
   */
  navigation?: boolean;
  /** Controlled value / uncontrolled seed / change — the root's own contract. */
  value?: AnyCalendarValue;
  /** Uncontrolled initial selection, public `Date`-based shape. */
  defaultValue?: AnyCalendarValue;
  defaultSelection?: SelectionState;
  onChange?: (value: AnyCalendarValue, details: CalendarChangeDetails) => void;
};

/**
 * A multi-month board — 3, 6, 12 consecutive months in a grid, generated on
 * the fly: one `<Calendar cols>` root, and per month an offset month/year
 * header + an offset day grid, laid out row by row (a row of headers, then the
 * row of matching grids). One shared selection spans the whole board — ranges
 * drag across months. `<MultiMonthCalendar months={6} cols={3} />` and done.
 */
export function MultiMonthCalendar(props: MultiMonthProps) {
  const {
    months = 3,
    cols = 3,
    mode = "range",
    startMonth,
    navigation = true,
    value,
    defaultValue,
    defaultSelection,
    onChange,
    theme,
    appearance,
    gradient,
    scheme,
    className,
  } = props;
  const config = useSingleConfig(props, { mode });
  const count = Math.max(1, Math.floor(months));
  const perRow = Math.max(1, Math.min(Math.floor(cols), count));
  // Chunk the offsets into rows: [0..perRow), [perRow..2*perRow), …
  const rows: number[][] = [];
  for (let o = 0; o < count; o += perRow) {
    rows.push(
      Array.from({ length: Math.min(perRow, count - o) }, (_, i) => o + i),
    );
  }
  const last = count - 1;
  return (
    <Calendar
      config={config}
      value={value}
      defaultValue={defaultValue}
      defaultSelection={defaultSelection}
      onChange={onChange}
      initialView={
        startMonth
          ? calendarDate(startMonth.getFullYear(), startMonth.getMonth() + 1, 1)
          : undefined
      }
      cols={perRow}
      theme={theme}
      appearance={appearance}
      gradient={gradient}
      scheme={scheme}
      className={className}
      data-testid={props["data-testid"] ?? "dateforge-multi-month"}
    >
      {rows.map((row) => (
        <Fragment key={row[0]}>
          {row.map((offset) => (
            <CalendarToolbar
              key={offset}
              col={1}
              offset={offset}
              justify="center"
            >
              {navigation && offset === 0 && <CalendarToolbarPrev />}
              <CalendarToolbarGroup>
                <CalendarToolbarMonthLabel />
                <CalendarToolbarYearLabel />
              </CalendarToolbarGroup>
              {navigation && offset === last && <CalendarToolbarNext />}
            </CalendarToolbar>
          ))}
          {row.map((offset) => (
            <CalendarDays key={offset} offset={offset} col={1} />
          ))}
        </Fragment>
      ))}
    </Calendar>
  );
}
