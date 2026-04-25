/// <reference path="../../global.d.ts" />
import { useMemo, useState } from "react";
import { Calendar } from "../components/calendar/calendar";
import { CalendarDays } from "../modules/days";
import { CalendarNav } from "../modules/nav";
import { CalendarPresets } from "../modules/presets";
import { CalendarMonthGrid } from "../modules/months";
import { CalendarTimeGrid } from "../modules/time";
import { CalendarSelectedDates } from "../modules/selected-dates";
import { CalendarManualSelect } from "../modules/manual-select";
import { CalendarYearsTrack } from "../modules/years-track";
import { CalendarDaysTrack } from "../modules/days-track";
import { CalendarMonthsTrack } from "../modules/months-track";
import { CalendarYearsGrid } from "../modules/years-grid";
import { createDisabled } from "../utils/create-disabled";
import { basicPresets } from "../modules/presets/presets-pack";
import type { PresetEntry } from "../types/presets";
import "./calendar.css";
import "../themes.gen.css";
import "../appearances.gen.css";
import { DARK_THEMES, LIGHT_THEMES } from "../types/themes";
import { CalendarMode, DateRange, StartOfWeek } from "../types/calendar";

const LOCALES_LIST = [
  { locale: "en", label: "English" },
  { locale: "de", label: "Deutsch" },
  { locale: "fr", label: "Français" },
  { locale: "ru", label: "Русский" },
  { locale: "zh-CN", label: "中文" },
  { locale: "ja", label: "日本語" },
  { locale: "sr", label: "Srpski" },
] as const;

const THEME_LABELS: Record<string, string> = {
  auto: "Auto (system)",
  light: "Light",
  dark: "Dark",
  mint: "Mint",
  comfy: "Comfy",
  neon: "Neon",
  rosa: "Rosa",
  snow: "Snow",
  solar: "Solar",
  riso: "Riso",
  split: "Split",
  graphite: "Graphite",
  amethyst: "Amethyst",
  latte: "Latte",
  slate: "Slate",
  scarlet: "Scarlet",
  industrial: "Industrial",
  midnight: "Midnight",
  sandstone: "Sandstone",
  pearl: "Pearl",
  chalk: "Chalk",
  phosphor: "Phosphor",
  dracula: "Dracula",
  cyber: "Cyber",
  flare: "Flare",
  temporal: "Temporal",
  crimson: "Crimson",
  forest: "Forest",
  nebula: "Nebula",
  monsoon: "Monsoon",
  aurora: "Aurora",
  espresso: "Espresso",
  ember: "Ember",
  prism: "Prism",
  meadow: "Meadow",
};

export default { title: "Calendar" };

const formatSubtitle = (date: Date, locale = "en", showTime = false) =>
  new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(showTime ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }).format(date);

const StoryWrapper = ({ children, title, subtitle, light = true }: any) => (
  <div className="story-wrapper" data-light={light}>
    <div className="story-header">
      <h2 className="story-title">{title}</h2>
      <p className="story-subtitle">{subtitle}</p>
    </div>
    <div className="story-content">{children}</div>
  </div>
);

export const FourMonthsLayout = () => {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <StoryWrapper title="Four Months Layout" subtitle={formatSubtitle(date)}>
      <div style={{ width: 650 }}>
        <Calendar value={date} cols={4} appearance={"bubble"}>
          <CalendarNav
            showMonthPicker
            compactYears
            col={2}
            hideBorder={"right"}
          />
          <CalendarNav monthLabel offset={1} col={2} hideBorder={"left"} />
          <CalendarDays currentMonthOnly col={2} fixedRows={false} />
          <CalendarDays offset={1} currentMonthOnly col={2} fixedRows={false} />
          <CalendarNav monthLabel col={2} offset={2} />
          <CalendarNav monthLabel offset={3} col={2} yearLabel />
          <CalendarDays currentMonthOnly col={2} offset={2} fixedRows={false} />
          <CalendarDays offset={3} currentMonthOnly col={2} fixedRows={false} />
        </Calendar>
      </div>
    </StoryWrapper>
  );
};

export const RangePicker = () => {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);

  const subtitle =
    range.from && range.to
      ? `${fmt(range.from)} → ${fmt(range.to)}`
      : range.from
        ? `${fmt(range.from)} → pick end…`
        : "Pick start date";

  return (
    <StoryWrapper title="Range Picker" subtitle={subtitle}>
      <div className="calendar-fixed-container">
        <Calendar mode="range" value={range} onChange={setRange} theme="light">
          <CalendarNav showMonthPicker />
          <CalendarDays />
          <CalendarSelectedDates />
        </Calendar>
      </div>
    </StoryWrapper>
  );
};

export const RangeTracks = () => {
  const [range, setRange] = useState<DateRange>({ from: null, to: null });

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);

  const subtitle =
    range.from && range.to
      ? `${fmt(range.from)} → ${fmt(range.to)}`
      : range.from
        ? `${fmt(range.from)} → pick end…`
        : "Pick start date";

  return (
    <StoryWrapper title="Range Picker — bound tracks" subtitle={subtitle}>
      <div className="calendar-fixed-container" style={{ width: 640 }}>
        <Calendar
          mode="range"
          value={range}
          onChange={setRange}
          theme="light"
          cols={4}
        >
          <CalendarNav monthLabel hideBorder="right" col={2} />
          <CalendarNav offset={1} monthLabel hideBorder="left" col={2} />
          <CalendarDays currentMonthOnly col={2} />
          <CalendarDays offset={1} currentMonthOnly col={2} />
          <CalendarDaysTrack bound="from" col={2} />
          <CalendarDaysTrack bound="to" col={2} />
          <CalendarMonthsTrack bound="from" col={2} />
          <CalendarMonthsTrack bound="to" col={2} />
          <CalendarYearsTrack bound="from" col={2} />
          <CalendarYearsTrack bound="to" col={2} />
          <CalendarSelectedDates />
        </Calendar>
      </div>
    </StoryWrapper>
  );
};

export const MultiselectTracks = () => {
  const [dates, setDates] = useState<Date[]>([]);

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "short",
    }).format(d);

  const subtitle = dates.length
    ? dates.map(fmt).join(" · ")
    : "Pick multiple dates";

  return (
    <StoryWrapper
      title="Multiselect — tracks follow active"
      subtitle={subtitle}
    >
      <div className="calendar-fixed-container" style={{ width: 480 }}>
        <Calendar
          mode="multiple"
          value={dates}
          onChange={setDates}
          theme="light"
        >
          <CalendarNav showMonthPicker />
          <CalendarDays />
          <CalendarSelectedDates />
          <CalendarMonthsTrack />
          <CalendarYearsTrack />
          <CalendarDaysTrack showMonthLabel />
        </Calendar>
      </div>
    </StoryWrapper>
  );
};

export const KitchenSink = () => {
  const [mode, setMode] = useState<CalendarMode>("single");
  const [max, setMax] = useState<number | undefined>(undefined);
  const [range, setRange] = useState<DateRange>({ from: null, to: null });
  const [dates, setDates] = useState<Date[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [defaultMonth, setStartMonth] = useState<Date>(new Date());
  const [activeTheme, setActiveTheme] = useState("slate");
  const [activeAppearance, setActiveAppearance] = useState("default");
  const [activeLocale, setActiveLocale] = useState("en");
  const [containerWidth, setContainerWidth] = useState(580);

  const getOffsetDay = (days: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  };

  const [startDate, setStartDate] = useState<Date>(() => getOffsetDay(-391));
  const [endDate, setEndDate] = useState<Date>(() => getOffsetDay(411));
  const [minRangeDays, setMinRangeDays] = useState<number | undefined>(
    undefined,
  );
  const [maxRangeDays, setMaxRangeDays] = useState<number | undefined>(
    undefined,
  );
  const toISODate = (d: Date) => d.toISOString().split("T")[0];
  const parseDate = (s: string) => new Date(s + "T00:00:00");

  type DisabledMode =
    | "none"
    | "all"
    | "date"
    | "dates"
    | "range"
    | "weekdays"
    | "before"
    | "after"
    | "outside";
  const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const [disabledMode, setDisabledMode] = useState<DisabledMode>("none");
  const [disabledDate, setDisabledDate] = useState(toISODate(new Date()));
  const [disabledDates, setDisabledDates] = useState<string[]>([
    toISODate(new Date()),
  ]);
  const [disabledFrom, setDisabledFrom] = useState(toISODate(getOffsetDay(-3)));
  const [disabledTo, setDisabledTo] = useState(toISODate(getOffsetDay(3)));
  const [disabledBefore, setDisabledBefore] = useState(toISODate(new Date()));
  const [disabledAfter, setDisabledAfter] = useState(toISODate(new Date()));
  const [disabledWeekdays, setDisabledWeekdays] = useState<number[]>([]);

  const toggleWeekday = (d: number) =>
    setDisabledWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const getDisabledValue = () => {
    switch (disabledMode) {
      case "all":
        return createDisabled({ all: true });
      case "date":
        return createDisabled({ dates: [parseDate(disabledDate)] });
      case "dates":
        return createDisabled({ dates: disabledDates.map(parseDate) });
      case "range":
        return createDisabled({
          ranges: [
            { from: parseDate(disabledFrom), to: parseDate(disabledTo) },
          ],
        });
      case "weekdays":
        return disabledWeekdays.length
          ? createDisabled({ weekdays: disabledWeekdays })
          : undefined;
      case "before":
        return createDisabled({ before: parseDate(disabledBefore) });
      case "after":
        return createDisabled({ after: parseDate(disabledAfter) });
      case "outside":
        return createDisabled({
          before: parseDate(disabledBefore),
          after: parseDate(disabledAfter),
        });
      default:
        return undefined;
    }
  };

  const [calendarProps, setCalendarProps] = useState({
    hour12: false,
    gradient: false,
  });

  const [timeGridProps, setTimeGridProps] = useState({
    seconds: false,
  });

  const [daysProps, setDaysProps] = useState({
    startOfWeek: 1 as StartOfWeek,
    highlightWeekends: true,
    boldWeekends: false,
    weekNumbers: false,
    hideWeekdays: false,
    currentMonthOnly: false,
    hideOutOfRange: false,
    lockSelection: false,
    highlightToday: true,
    fixedRows: true,
    swipe: true,
  });

  const [navLabel, setNavLabel] = useState("");

  const [navProps, setNavProps] = useState({
    showTime: true,
    showNowTime: false,
    seconds: false,
    showMonthPicker: true,
    animateTime: false,
    compactMonths: false,
    showYearPicker: false,
    monthLabel: false,
    yearLabel: false,
    compactYears: true,
    home: false,
    clear: false,
    themeToggle: false,
  });

  const toggleNavProp = (key: keyof typeof navProps) =>
    setNavProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const [modules, setModules] = useState({
    nav: true,
    nav2: false,
    days: true,
    monthsGrid: false,
    timeGrid: false,
    presets: false,
    selectedDates: false,
    manualSelect: false,
    yearsTrack: false,
    daysTrack: false,
    monthsTrack: false,
    yearsGrid: false,
  });

  const [moduleProps, setModuleProps] = useState({
    manualSelectAllowClear: true,
  });

  const [monthsGridProps, setMonthsGridProps] = useState({
    short: true,
    disableOutOfRange: true,
    hideOutOfRange: false,
  });

  const [monthsTrackProps, setMonthsTrackProps] = useState({
    short: true,
  });

  const [daysTrackProps, setDaysTrackProps] = useState({
    showMonthLabel: false,
  });

  const toggleDaysTrackProp = (key: keyof typeof daysTrackProps) =>
    setDaysTrackProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const [yearsGridProps, setYearsGridProps] = useState({
    disableOutOfRange: true,
    hideOutOfRange: false,
  });

  const [yearsPerPage, setYearsPerPage] = useState(10);

  const BASIC_PRESET_IDS = basicPresets.map((p) => p.id!);

  const SIMPLE_PRESET_DEFS: Record<string, PresetEntry> = {
    in3days: { label: "In 3 days", value: 3 },
    in2weeks: { label: "In 2 weeks", value: 14 },
    last7days: { label: "Last 7 days", value: -6, range: 6 },
    nextSprint: { label: "Next sprint", value: 1, range: 13 },
    newYear: { label: "New Year 2026", value: new Date(2026, 0, 1) },
    q1_2026: { label: "Q1 2026", value: new Date(2026, 0, 1), range: 89 },
  };

  const ADVANCED_PRESET_DEFS: Record<string, PresetEntry> = {
    startOfMonth: {
      id: "som",
      label: "Start of month",
      getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth(), 1),
    },
    endOfMonth: {
      id: "eom",
      label: "End of month",
      getValue: ({ now }) => new Date(now.getFullYear(), now.getMonth() + 1, 0),
    },
    nextMonday: {
      id: "nmon",
      label: "Next Monday",
      getValue: ({ now }) => {
        const d = new Date(now);
        const delta = (8 - d.getDay()) % 7 || 7;
        d.setDate(d.getDate() + delta);
        return d;
      },
    },
    thisWeek: {
      id: "tw",
      label: "This week (range)",
      getValue: ({ now }) => {
        const d = new Date(now);
        const dayOfWeek = d.getDay() || 7;
        const from = new Date(d);
        from.setDate(d.getDate() - dayOfWeek + 1);
        const to = new Date(from);
        to.setDate(from.getDate() + 6);
        return { from, to };
      },
    },
    nextWeekend: {
      id: "nwe",
      label: "Next weekend (range)",
      getValue: ({ now, isValid }) => {
        const d = new Date(now);
        const delta = (6 - d.getDay() + 7) % 7 || 7;
        d.setDate(d.getDate() + delta);
        for (let i = 0; i < 52; i++) {
          const sun = new Date(d);
          sun.setDate(sun.getDate() + 1);
          if (isValid(d) && isValid(sun)) return { from: d, to: sun };
          d.setDate(d.getDate() + 7);
        }
        return null;
      },
    },
  };

  const [selectedBasic, setSelectedBasic] = useState<string[]>([
    "yesterday",
    "today",
    "tomorrow",
    "nextWeek",
  ]);
  const [selectedSimple, setSelectedSimple] = useState<string[]>([]);
  const [selectedAdvanced, setSelectedAdvanced] = useState<string[]>([]);

  const toggleBasic = (id: string) =>
    setSelectedBasic((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const toggleSimple = (k: string) =>
    setSelectedSimple((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );
  const toggleAdvanced = (k: string) =>
    setSelectedAdvanced((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k],
    );

  const composedPresets = useMemo<PresetEntry[]>(
    () => [
      ...basicPresets.filter((p) => selectedBasic.includes(p.id!)),
      ...selectedSimple.map((k) => SIMPLE_PRESET_DEFS[k]).filter(Boolean),
      ...selectedAdvanced.map((k) => ADVANCED_PRESET_DEFS[k]).filter(Boolean),
    ],
    [selectedBasic, selectedSimple, selectedAdvanced],
  );

  const [selectedDatesProps, setSelectedDatesProps] = useState({
    allowClear: true,
    allowNavigate: true,
    showTime: false,
    animated: true,
  });
  const [selectedDatesAlign, setSelectedDatesAlign] = useState<
    "left" | "center" | "right"
  >("left");
  const [manualSelectAlign, setManualSelectAlign] = useState<
    "left" | "center" | "right"
  >("left");

  const toggleModuleProp = (key: keyof typeof moduleProps) =>
    setModuleProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleMonthsGridProp = (key: keyof typeof monthsGridProps) =>
    setMonthsGridProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleTimeGridProp = (key: keyof typeof timeGridProps) =>
    setTimeGridProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleMonthsTrackProp = (key: keyof typeof monthsTrackProps) =>
    setMonthsTrackProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleYearsGridProp = (key: keyof typeof yearsGridProps) =>
    setYearsGridProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleSelectedDatesProp = (key: keyof typeof selectedDatesProps) =>
    setSelectedDatesProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleProp = (key: keyof typeof calendarProps) =>
    setCalendarProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleDaysProp = (key: keyof Omit<typeof daysProps, "startOfWeek">) =>
    setDaysProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleModule = (key: keyof typeof modules) =>
    setModules((prev) => ({ ...prev, [key]: !prev[key] }));

  type ModeOption = { label: string; mode: CalendarMode; max?: number };
  const modeOptions: ModeOption[] = [
    { label: "Single", mode: "single" },
    { label: "Range", mode: "range" },
    { label: "2 dates", mode: "multiple", max: 2 },
    { label: "3 dates", mode: "multiple", max: 3 },
    { label: "Unlimited", mode: "multiple" },
  ];

  const handleChange = (v: unknown) => {
    if (mode === "range") setRange(v as DateRange);
    else if (mode === "multiple") setDates(v as Date[]);
    else if (v) setDate(v as Date);
  };

  const subtitle =
    mode === "range"
      ? range.from && range.to
        ? `${formatSubtitle(range.from, activeLocale)} → ${formatSubtitle(range.to, activeLocale)}`
        : range.from
          ? `${formatSubtitle(range.from, activeLocale)} → pick end…`
          : "Pick start date"
      : mode === "multiple"
        ? dates.length
          ? dates.map((d) => formatSubtitle(d, activeLocale)).join(" · ")
          : "No dates selected"
        : formatSubtitle(date, activeLocale, navProps.showTime);

  const isLight =
    activeTheme === "light" ||
    activeTheme === "auto" ||
    (LIGHT_THEMES as readonly string[]).includes(activeTheme);

  return (
    <StoryWrapper
      light={isLight}
      title="Kitchen Sink"
      subtitle={`${subtitle} · ${activeTheme} · ${activeLocale}`}
    >
      <div className="kitchen-layout">
        <aside className="kitchen-panel">
          <p className="panel-label">Mode</p>
          <select
            value={
              modeOptions.find((opt) => opt.mode === mode && opt.max === max)
                ?.label
            }
            onChange={(e) => {
              const selectedLabel = e.target.value;
              const opt = modeOptions.find((o) => o.label === selectedLabel);

              if (opt) {
                setMode(opt.mode);
                setMax(opt.max);
                setDates([]);
                setRange({ from: null, to: null });
              }
            }}
            className="panel-select"
          >
            {modeOptions.map((opt) => (
              <option key={opt.label} value={opt.label}>
                {opt.label}
              </option>
            ))}
          </select>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Props
          </p>
          <div className="panel-props-grid">
            {(Object.keys(calendarProps) as (keyof typeof calendarProps)[]).map(
              (key) => (
                <button
                  key={key}
                  onClick={() => toggleProp(key)}
                  className={`panel-button-compact ${calendarProps[key] ? "active" : ""}`}
                >
                  {key}
                </button>
              ),
            )}
          </div>

          <p className="panel-label" style={{ marginTop: 8 }}>
            Nav props
          </p>
          <div className="panel-date">
            <label>label</label>
            <input
              type="text"
              value={navLabel}
              placeholder="nav label…"
              onChange={(e) => setNavLabel(e.target.value)}
            />
          </div>
          <div className="panel-props-grid">
            {(Object.keys(navProps) as (keyof typeof navProps)[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleNavProp(key)}
                className={`panel-button-compact ${navProps[key] ? "active" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>

          <p className="panel-label" style={{ marginTop: 8 }}>
            Modules
          </p>
          <div className="panel-props-grid">
            {(Object.keys(modules) as (keyof typeof modules)[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleModule(key)}
                className={`panel-button-compact ${modules[key] ? "active" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>

          {modules.days && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                Days props
              </p>
              <div className="panel-props-grid">
                {(
                  [
                    "highlightWeekends",
                    "weekNumbers",
                    "boldWeekends",
                    "currentMonthOnly",
                    "hideWeekdays",
                    "hideOutOfRange",
                    "highlightToday",
                    "lockSelection",
                    "swipe",
                    "fixedRows",
                  ] as const
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleDaysProp(key)}
                    className={`panel-button-compact ${daysProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.timeGrid && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                TimeGrid props
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(timeGridProps) as (keyof typeof timeGridProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleTimeGridProp(key)}
                    className={`panel-button-compact ${timeGridProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.monthsGrid && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                MonthsGrid props
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(
                    monthsGridProps,
                  ) as (keyof typeof monthsGridProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleMonthsGridProp(key)}
                    className={`panel-button-compact ${monthsGridProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.monthsTrack && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                MonthsTrack props
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(
                    monthsTrackProps,
                  ) as (keyof typeof monthsTrackProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleMonthsTrackProp(key)}
                    className={`panel-button-compact ${monthsTrackProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.daysTrack && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                DaysTrack props
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(daysTrackProps) as (keyof typeof daysTrackProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleDaysTrackProp(key)}
                    className={`panel-button-compact ${daysTrackProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.presets && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                basicPresets (pack)
              </p>
              <div className="panel-props-grid">
                {BASIC_PRESET_IDS.map((id) => (
                  <button
                    key={id}
                    onClick={() => toggleBasic(id)}
                    className={`panel-button-compact ${selectedBasic.includes(id) ? "active" : ""}`}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <p className="panel-label" style={{ marginTop: 8 }}>
                Simple {"{ label, value, range? }"}
              </p>
              <div className="panel-props-grid">
                {Object.keys(SIMPLE_PRESET_DEFS).map((k) => (
                  <button
                    key={k}
                    onClick={() => toggleSimple(k)}
                    className={`panel-button-compact ${selectedSimple.includes(k) ? "active" : ""}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
              <p className="panel-label" style={{ marginTop: 8 }}>
                Advanced {"{ getValue }"}
              </p>
              <div className="panel-props-grid">
                {Object.keys(ADVANCED_PRESET_DEFS).map((k) => (
                  <button
                    key={k}
                    onClick={() => toggleAdvanced(k)}
                    className={`panel-button-compact ${selectedAdvanced.includes(k) ? "active" : ""}`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </>
          )}

          {modules.yearsGrid && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                YearsGrid props
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(yearsGridProps) as (keyof typeof yearsGridProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleYearsGridProp(key)}
                    className={`panel-button-compact ${yearsGridProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
              <div className="panel-date">
                <label>yearsPerPage</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={yearsPerPage}
                  onChange={(e) =>
                    setYearsPerPage(
                      Math.min(40, Math.max(1, Number(e.target.value))),
                    )
                  }
                />
              </div>
            </>
          )}
          {modules.selectedDates && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                Selected dates
              </p>
              <div className="panel-props-grid">
                {(
                  Object.keys(
                    selectedDatesProps,
                  ) as (keyof typeof selectedDatesProps)[]
                ).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleSelectedDatesProp(key)}
                    className={`panel-button-compact ${selectedDatesProps[key] ? "active" : ""}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="panel-weekdays">
            {(["left", "center", "right"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setSelectedDatesAlign(a)}
                className={`panel-weekday-btn ${selectedDatesAlign === a ? "active" : ""}`}
              >
                {a}
              </button>
            ))}
          </div>
          {modules.manualSelect && (
            <>
              <p className="panel-label" style={{ marginTop: 8 }}>
                ManualSelect align
              </p>
              <div className="panel-props-grid">
                {(Object.keys(moduleProps) as (keyof typeof moduleProps)[]).map(
                  (key) => (
                    <button
                      key={key}
                      onClick={() => toggleModuleProp(key)}
                      className={`panel-button-compact ${moduleProps[key] ? "active" : ""}`}
                    >
                      {key}
                    </button>
                  ),
                )}
              </div>
              <div className="panel-weekdays">
                {(["left", "center", "right"] as const).map((a) => (
                  <button
                    key={a}
                    onClick={() => setManualSelectAlign(a)}
                    className={`panel-weekday-btn ${manualSelectAlign === a ? "active" : ""}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </>
          )}
        </aside>

        <div className="kitchen-center">
          <div style={{ width: `${containerWidth}px` }}>
            <Calendar
              mode={mode as any}
              max={max}
              value={
                mode === "range" ? range : mode === "multiple" ? dates : date
              }
              defaultMonth={defaultMonth}
              onChange={handleChange as any}
              theme={activeTheme}
              appearance={activeAppearance as any}
              locale={activeLocale}
              minDate={startDate}
              maxDate={endDate}
              disabled={getDisabledValue()}
              minRangeDays={mode === "range" ? minRangeDays : undefined}
              maxRangeDays={mode === "range" ? maxRangeDays : undefined}
              {...calendarProps}
            >
              {modules.nav && (
                <CalendarNav {...navProps} label={navLabel || undefined} />
              )}
              {modules.days && <CalendarDays {...daysProps} />}
              {modules.nav2 && (
                <CalendarNav {...navProps} label={navLabel || undefined} />
              )}
              {modules.monthsGrid && <CalendarMonthGrid {...monthsGridProps} />}
              {modules.timeGrid && <CalendarTimeGrid {...timeGridProps} />}
              {modules.selectedDates && (
                <CalendarSelectedDates
                  {...selectedDatesProps}
                  align={selectedDatesAlign}
                />
              )}
              {modules.manualSelect && (
                <CalendarManualSelect
                  allowClear={moduleProps.manualSelectAllowClear}
                  align={manualSelectAlign}
                />
              )}
              {modules.yearsTrack && <CalendarYearsTrack />}
              {modules.monthsTrack && (
                <CalendarMonthsTrack {...monthsTrackProps} />
              )}
              {modules.daysTrack && <CalendarDaysTrack {...daysTrackProps} />}
              {modules.yearsGrid && (
                <CalendarYearsGrid
                  {...yearsGridProps}
                  yearsPerPage={yearsPerPage}
                />
              )}
              {modules.presets && <CalendarPresets presets={composedPresets} />}
            </Calendar>
          </div>
        </div>

        <aside className="kitchen-panel">
          <p className="panel-label" style={{ marginTop: 12 }}>
            Width: {containerWidth}px
          </p>
          <input
            type="range"
            min="200"
            max="900"
            value={containerWidth}
            className="width-slider"
            onChange={(e) => setContainerWidth(Number(e.target.value))}
          />
          <p className="panel-label">Appearance</p>
          <select
            className="panel-select"
            value={activeAppearance}
            onChange={(e) => setActiveAppearance(e.target.value)}
          >
            {["default", "soft", "bubble", "compact", "square", "loft"].map(
              (a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ),
            )}
          </select>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Theme
          </p>
          <select
            className="panel-select"
            value={activeTheme}
            onChange={(e) => setActiveTheme(e.target.value)}
          >
            <optgroup label="Built-in">
              <option value="auto">{THEME_LABELS.auto}</option>
              <option value="light">{THEME_LABELS.light}</option>
              <option value="dark">{THEME_LABELS.dark}</option>
            </optgroup>
            <optgroup label="Dark">
              {DARK_THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_LABELS[t]}
                </option>
              ))}
            </optgroup>
            <optgroup label="Light">
              {LIGHT_THEMES.map((t) => (
                <option key={t} value={t}>
                  {THEME_LABELS[t]}
                </option>
              ))}
            </optgroup>
          </select>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Locale
          </p>
          <select
            className="panel-select"
            value={activeLocale}
            onChange={(e) => setActiveLocale(e.target.value)}
          >
            {LOCALES_LIST.map((l) => (
              <option key={l.locale} value={l.locale}>
                {l.label} ({l.locale})
              </option>
            ))}
          </select>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Start month
          </p>
          <div className="panel-date">
            <label>select start month</label>
            <input
              type="date"
              value={defaultMonth.getMonth()}
              onChange={(e) => setStartMonth(parseDate(e.target.value))}
            />
          </div>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Start of week
          </p>
          <div className="panel-weekdays">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((label, i) => (
              <button
                key={i}
                onClick={() =>
                  setDaysProps((prev) => ({
                    ...prev,
                    startOfWeek: i as StartOfWeek,
                  }))
                }
                className={`panel-weekday-btn ${daysProps.startOfWeek === i ? "active" : ""}`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="panel-label" style={{ marginTop: 12 }}>
            Date limits
          </p>
          <div className="panel-date">
            <label>Start</label>
            <input
              type="date"
              value={toISODate(startDate)}
              onChange={(e) => setStartDate(parseDate(e.target.value))}
            />
          </div>
          <div className="panel-date">
            <label>End</label>
            <input
              type="date"
              value={toISODate(endDate)}
              onChange={(e) => setEndDate(parseDate(e.target.value))}
            />
          </div>

          {mode === "range" && (
            <>
              <p className="panel-label" style={{ marginTop: 12 }}>
                Range limits
              </p>
              <div className="panel-date">
                <label>Min days</label>
                <input
                  type="number"
                  min="1"
                  value={minRangeDays ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setMinRangeDays(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
              <div className="panel-date">
                <label>Max days</label>
                <input
                  type="number"
                  min="1"
                  value={maxRangeDays ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setMaxRangeDays(
                      e.target.value ? Number(e.target.value) : undefined,
                    )
                  }
                />
              </div>
            </>
          )}

          <p className="panel-label" style={{ marginTop: 12 }}>
            Disabled
          </p>
          <select
            className="panel-select"
            value={disabledMode}
            onChange={(e) => setDisabledMode(e.target.value as DisabledMode)}
          >
            <option value="none">none</option>
            <option value="all">all</option>
            <option value="date">date</option>
            <option value="dates">dates [ ]</option>
            <option value="range">range &#123;from,to&#125;</option>
            <option value="weekdays">weekdays</option>
            <option value="before">before</option>
            <option value="after">after</option>
            <option value="outside">outside &#123;before,after&#125;</option>
          </select>

          {disabledMode === "date" && (
            <div className="panel-date">
              <input
                type="date"
                value={disabledDate}
                onChange={(e) => setDisabledDate(e.target.value)}
              />
            </div>
          )}
          {disabledMode === "dates" && (
            <div className="panel-dates-list">
              {disabledDates.map((d, i) => (
                <div key={i} className="panel-dates-row">
                  <input
                    type="date"
                    value={d}
                    onChange={(e) =>
                      setDisabledDates((prev) =>
                        prev.map((x, j) => (j === i ? e.target.value : x)),
                      )
                    }
                  />
                  <button
                    className="panel-dates-remove"
                    onClick={() =>
                      setDisabledDates((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                className="panel-button"
                onClick={() =>
                  setDisabledDates((prev) => [...prev, toISODate(new Date())])
                }
              >
                + Add date
              </button>
            </div>
          )}
          {disabledMode === "range" && (
            <>
              <div className="panel-date">
                <label>From</label>
                <input
                  type="date"
                  value={disabledFrom}
                  onChange={(e) => setDisabledFrom(e.target.value)}
                />
              </div>
              <div className="panel-date">
                <label>To</label>
                <input
                  type="date"
                  value={disabledTo}
                  onChange={(e) => setDisabledTo(e.target.value)}
                />
              </div>
            </>
          )}
          {disabledMode === "weekdays" && (
            <div className="panel-weekdays">
              {WEEKDAY_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleWeekday(i)}
                  className={`panel-weekday-btn ${disabledWeekdays.includes(i) ? "active" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {disabledMode === "before" && (
            <div className="panel-date">
              <label>Before</label>
              <input
                type="date"
                value={disabledBefore}
                onChange={(e) => setDisabledBefore(e.target.value)}
              />
            </div>
          )}
          {disabledMode === "after" && (
            <div className="panel-date">
              <label>After</label>
              <input
                type="date"
                value={disabledAfter}
                onChange={(e) => setDisabledAfter(e.target.value)}
              />
            </div>
          )}
          {disabledMode === "outside" && (
            <>
              <div className="panel-date">
                <label>Before</label>
                <input
                  type="date"
                  value={disabledBefore}
                  onChange={(e) => setDisabledBefore(e.target.value)}
                />
              </div>
              <div className="panel-date">
                <label>After</label>
                <input
                  type="date"
                  value={disabledAfter}
                  onChange={(e) => setDisabledAfter(e.target.value)}
                />
              </div>
            </>
          )}
        </aside>
      </div>
    </StoryWrapper>
  );
};
