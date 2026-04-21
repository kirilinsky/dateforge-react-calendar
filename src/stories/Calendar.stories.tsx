/// <reference path="../../global.d.ts" />
import { useState } from "react";
import { Calendar } from "../components/calendar/calendar";
import { CalendarDays } from "../components/days/days";
import { CalendarNav } from "../modules/nav";
import { CalendarPresets } from "../modules/presets";
import { CalendarMonthGrid } from "../modules/months";
import { CalendarTimeGrid } from "../modules/time";
import { CalendarSelectedDates } from "../modules/selected-dates";
import { CalendarManualSelect } from "../modules/manual-select";
import { CalendarYearsTrack } from "../modules/years-track";
import { createTheme } from "../utils/create-theme";
import { createDisabled } from "../utils/create-disabled";
import "./calendar.css";
import "../themes.gen.css";
import "../appearances.gen.css";
import { DARK_THEMES, LIGHT_THEMES } from "../types/themes";
import {
  CalendarMode,
  DateRange,
  StartOfWeek,
} from "../types/calendar";

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
  graphite: "Graphite",
  amethyst: "Amethyst",
  latte: "Latte",
  slate: "Slate",
  scarlet: "Scarlet",
  industrial: "Industrial",
  midnight: "Midnight",
  sandstone: "Sandstone",
  phosphor: "Phosphor",
  dracula: "Dracula",
  cyber: "Cyber",
  temporal: "Temporal",
  crimson: "Crimson",
  forest: "Forest",
  nebula: "Nebula",
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

export const Default = () => {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <StoryWrapper title="Default" subtitle={formatSubtitle(date)}>
      <div className="calendar-fixed-container">
        <Calendar
          value={date}
          theme="industrial"
          appearance="soft"
          onChange={(d) => {
            if (d) setDate(d);
          }}
        >
          <CalendarNav showMonthPicker showYearPicker showTime />
          <CalendarDays />
        </Calendar>
      </div>
    </StoryWrapper>
  );
};

export const TwoMonthsLayout = () => {
  const [date, setDate] = useState<Date>(new Date());
  return (
    <StoryWrapper title="Two Months Layout" subtitle={formatSubtitle(date)}>
      <div style={{ width: 640 }}>
        <Calendar
          value={date}
          onChange={(d) => {
            if (d) setDate(d);
          }}
          twoMonthsLayout
          theme="light"
          cols={2}
        >
          <CalendarNav showMonthPicker />
          <CalendarDays hideOtherMonths />
          <CalendarDays offset={1} hideOtherMonths />
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

export const CustomThemeDemo = () => {
  const [date, setDate] = useState<Date>(new Date());

  const oceanTheme = createTheme(
    {
      accent: "#ffffff",
      backdrop: "#0a1628",
      highlight: "#0ea5e9",
      tone: "#0f2044",
      text: "#e0f2fe",
      stroke: "#1e3a5f",
      shadow: "#0ea5e940",
      disabled: "#1e3a5f",
      weekend: "#f83875",
      range: "#06b6d4",
    },
    "dark",
  );

  return (
    <StoryWrapper
      title="createTheme — Ocean"
      subtitle={formatSubtitle(date)}
      light={false}
    >
      <div className="calendar-fixed-container">
        <Calendar
          value={date}
          theme={oceanTheme}
          onChange={(d) => {
            if (d) setDate(d);
          }}
        >
          <CalendarNav />
          <CalendarDays />
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
  const [startMonth, setStartMonth] = useState<Date>(new Date());
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
  const [rangeMinDays, setRangeMinDays] = useState<number | undefined>(
    undefined,
  );
  const [rangeMaxDays, setRangeMaxDays] = useState<number | undefined>(
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
        return createDisabled({ ranges: [{ from: parseDate(disabledFrom), to: parseDate(disabledTo) }] });
      case "weekdays":
        return disabledWeekdays.length
          ? createDisabled({ weekdays: disabledWeekdays })
          : undefined;
      case "before":
        return createDisabled({ before: parseDate(disabledBefore) });
      case "after":
        return createDisabled({ after: parseDate(disabledAfter) });
      case "outside":
        return createDisabled({ before: parseDate(disabledBefore), after: parseDate(disabledAfter) });
      default:
        return undefined;
    }
  };

  const [calendarProps, setCalendarProps] = useState({
    hour12: false,
    gradient: false,
    twoMonthsLayout: false,
    monthsColumn: false,
  });

  const [daysProps, setDaysProps] = useState({
    startOfWeek: 1 as StartOfWeek,
    highlightWeekends: true,
    showWeekNumber: false,
    hideWeekdays: false,
    hideOtherMonths: false,
    hideLimited: false,
    hideDisabled: false,
    highlightToday: true,
    allowSwipeNavigation: false,
  });

  const [navProps, setNavProps] = useState({
    showTime: true,
    showMonthPicker: true,
    compactMonths: false,
    showYearPicker: false,
    compactYears: true,
    showHome: false,
    showClear: false,
    showThemeToggle: false,
  });

  const toggleNavProp = (key: keyof typeof navProps) =>
    setNavProps((prev) => ({ ...prev, [key]: !prev[key] }));

  const [modules, setModules] = useState({
    nav: true,
    days: true,
    monthsGrid: false,
    timeGrid: false,
    presets: false,
    selectedDates: false,
    manualSelect: false,
    yearsTrack: false,
  });

  const [moduleProps, setModuleProps] = useState({
    monthsGridShort: true,
    manualSelectAllowClean: true,
  });

  const [selectedDatesProps, setSelectedDatesProps] = useState({
    allowClean: false,
    allowNavigate: false,
    animated: false,
  });

  const toggleModuleProp = (key: keyof typeof moduleProps) =>
    setModuleProps((prev) => ({ ...prev, [key]: !prev[key] }));

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
          <p className="panel-label">Mode</p>
          {modeOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => {
                setMode(opt.mode);
                setMax(opt.max);
                setDates([]);
                setRange({ from: null, to: null });
              }}
              className={`panel-button ${mode === opt.mode && max === opt.max ? "active" : ""}`}
            >
              <span className="panel-button-key">{opt.label}</span>
            </button>
          ))}

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
            Days props
          </p>
          <div className="panel-props-grid">
            {(
              [
                "highlightWeekends",
                "showWeekNumber",
                "hideOtherMonths",
                "hideWeekdays",
                "hideLimited",
                "hideDisabled",
                "highlightToday",
                "allowSwipeNavigation",
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
          <p className="panel-label" style={{ marginTop: 8 }}>
            Module props
          </p>
          <div className="panel-props-grid">
            {(Object.keys(moduleProps) as (keyof typeof moduleProps)[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleModuleProp(key)}
                className={`panel-button-compact ${moduleProps[key] ? "active" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>
          <p className="panel-label" style={{ marginTop: 8 }}>
            Selected dates
          </p>
          <div className="panel-props-grid">
            {(Object.keys(selectedDatesProps) as (keyof typeof selectedDatesProps)[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSelectedDatesProp(key)}
                className={`panel-button-compact ${selectedDatesProps[key] ? "active" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>
        </aside>

        <div className="kitchen-center">
          <div style={{ width: `${containerWidth}px` }}>
            <Calendar
              mode={mode as any}
              max={max}
              value={
                mode === "range" ? range : mode === "multiple" ? dates : date
              }
              startMonth={startMonth}
              onChange={handleChange as any}
              theme={activeTheme}
              appearance={activeAppearance as any}
              locale={activeLocale}
              minDate={startDate}
              maxDate={endDate}
              disabled={getDisabledValue()}
              rangeMinDays={mode === "range" ? rangeMinDays : undefined}
              rangeMaxDays={mode === "range" ? rangeMaxDays : undefined}
              {...calendarProps}
            >
              {modules.days && <CalendarDays {...daysProps} />}
              {modules.nav && <CalendarNav {...navProps} />}
              {modules.monthsGrid && (
                <CalendarMonthGrid shortMonths={moduleProps.monthsGridShort} />
              )}
              {modules.timeGrid && <CalendarTimeGrid />}
              {modules.selectedDates && (
                <CalendarSelectedDates {...selectedDatesProps} />
              )}
              {modules.manualSelect && (
                <CalendarManualSelect
                  allowClean={moduleProps.manualSelectAllowClean}
                />
              )}
              {modules.yearsTrack && <CalendarYearsTrack />}
              {modules.presets && <CalendarPresets />}

              {calendarProps.twoMonthsLayout && (
                <CalendarDays {...daysProps} offset={1} hideOtherMonths />
              )}
            </Calendar>
          </div>
        </div>

        <aside className="kitchen-panel">
          <p className="panel-label">Appearance</p>
          <select
            className="panel-select"
            value={activeAppearance}
            onChange={(e) => setActiveAppearance(e.target.value)}
          >
            {[
              "default",
              "soft",
              "bubble",
              "compact",
              "square",
            ].map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
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
              value={startMonth.getMonth()}
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
                  value={rangeMinDays ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setRangeMinDays(
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
                  value={rangeMaxDays ?? ""}
                  placeholder="—"
                  onChange={(e) =>
                    setRangeMaxDays(
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
