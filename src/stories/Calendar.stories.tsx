import { useState } from "react";
import { Calendar } from "../components/calendar/calendar";
import { createTheme } from "../utils/create-theme";
import "./calendar.css";
import "../themes.gen.css";
import { DARK_THEMES, LIGHT_THEMES } from "../types/themes";
import { CalendarMode, DisabledRule, StartOfWeek } from "../types/calendar";

const LOCALES_LIST = [
  { locale: "en", label: "English" },
  { locale: "de", label: "Deutsch" },
  { locale: "fr", label: "Français" },
  { locale: "es", label: "Español" },
  { locale: "it", label: "Italiano" },
  { locale: "pt", label: "Português" },
  { locale: "ua", label: "Українська" },
  { locale: "pl", label: "Polski" },
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
          brutalism
          onChange={(d: Date | null) => {
            if (d) setDate(d);
          }}
        />
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
          onChange={(d: Date | null) => {
            if (d) setDate(d);
          }}
          twoMonthsLayout
          months
          time={false}
          presets={false}
          theme="light"
        />
      </div>
    </StoryWrapper>
  );
};

export const RangePicker = () => {
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });

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
        <Calendar
          mode="range"
          showSelectedDates
          value={range}
          onRangeChange={setRange}
          theme="light"
          months
          time={false}
          presets={false}
        />
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
    <StoryWrapper title="createTheme — Ocean" subtitle={formatSubtitle(date)} light={false}>
      <div className="calendar-fixed-container">
        <Calendar
          value={date}
          theme={oceanTheme}
          onChange={(d: Date | null) => {
            if (d) setDate(d);
          }}
        />
      </div>
    </StoryWrapper>
  );
};

export const KitchenSink = () => {
  const [mode, setMode] = useState<CalendarMode>("single");
  const [max, setMax] = useState<number | undefined>(undefined);
  const [range, setRange] = useState({
    from: null as Date | null,
    to: null as Date | null,
  });
  const [dates, setDates] = useState<Date[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [startMonth, setStartMonth] = useState<Date>(new Date());
  const [activeTheme, setActiveTheme] = useState("mint");
  const [activeLocale, setActiveLocale] = useState("en");
  const [containerWidth, setContainerWidth] = useState(580);
  const [startOfWeek, setStartOfWeek] = useState<StartOfWeek>(1);

  const getOffsetDay = (days: number) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + days);
    return d;
  };

  const [startDate, setStartDate] = useState<Date>(() => getOffsetDay(-391));
  const [endDate, setEndDate] = useState<Date>(() => getOffsetDay(411));
  const [rangeMinDays, setRangeMinDays] = useState<number | undefined>(undefined);
  const [rangeMaxDays, setRangeMaxDays] = useState<number | undefined>(undefined);
  const toISODate = (d: Date) => d.toISOString().split("T")[0];
  const parseDate = (s: string) => new Date(s + "T00:00:00");

  type DisabledMode =
    | "none" | "all" | "date" | "dates" | "range"
    | "weekdays" | "before" | "after" | "outside";
  const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const [disabledMode, setDisabledMode] = useState<DisabledMode>("none");
  const [disabledDate, setDisabledDate] = useState(toISODate(new Date()));
  const [disabledDates, setDisabledDates] = useState<string[]>([toISODate(new Date())]);
  const [disabledFrom, setDisabledFrom] = useState(toISODate(getOffsetDay(-3)));
  const [disabledTo, setDisabledTo] = useState(toISODate(getOffsetDay(3)));
  const [disabledBefore, setDisabledBefore] = useState(toISODate(new Date()));
  const [disabledAfter, setDisabledAfter] = useState(toISODate(new Date()));
  const [disabledWeekdays, setDisabledWeekdays] = useState<number[]>([]);

  const toggleWeekday = (d: number) =>
    setDisabledWeekdays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );

  const getDisabledValue = (): DisabledRule | DisabledRule[] | undefined => {
    switch (disabledMode) {
      case "all": return true;
      case "date": return parseDate(disabledDate);
      case "dates": return disabledDates.map(parseDate);
      case "range": return { from: parseDate(disabledFrom), to: parseDate(disabledTo) };
      case "weekdays": return disabledWeekdays.length ? { dayOfWeek: disabledWeekdays } : undefined;
      case "before": return { before: parseDate(disabledBefore) };
      case "after": return { after: parseDate(disabledAfter) };
      case "outside": return { before: parseDate(disabledBefore), after: parseDate(disabledAfter) };
      default: return undefined;
    }
  };

  const [config, setConfig] = useState({
    years: false,
    monthsGrid: false,
    time: true,
    timeGrid: false,
    months: true,
    presets: false,
    compactMonths: false,
    compactYears: true,
    gradient: false,
    brutalism: false,
    gestures: false,
    highlightWeekends: true,
    showWeekNumber: false,
    hideLimited: false,
    hideDisabled: false,
    hideWeekdays: false,
    shortMonths: false,
    hour12: false,
    showSelectedDates: false,
    twoMonthsLayout: false,
    monthsColumn: false,
    showHomeButton: false,
    showClearButton: false,
    showThemeToggle: false,
    highlightToday: true,
    allowCleanSelected: true,
    allowNavigateSelected: true,
  });

  const toggle = (key: keyof typeof config) =>
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  type ModeOption = { label: string; mode: CalendarMode; max?: number };
  const modeOptions: ModeOption[] = [
    { label: "Single", mode: "single" },
    { label: "Range", mode: "range" },
    { label: "2 dates", mode: "multiple", max: 2 },
    { label: "3 dates", mode: "multiple", max: 3 },
    { label: "Unlimited", mode: "multiple" },
  ];

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
        : formatSubtitle(date, activeLocale, config.time);

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
            {(Object.keys(config) as (keyof typeof config)[]).map((key) => (
              <button
                key={key}
                onClick={() => toggle(key)}
                className={`panel-button-compact ${config[key] ? "active" : ""}`}
              >
                {key}
              </button>
            ))}
          </div>
        </aside>

        <div className="kitchen-center">
          <div style={{ width: `${containerWidth}px` }}>
            <Calendar
              mode={mode}
              max={max}
              value={
                mode === "range" ? range : mode === "multiple" ? dates : date
              }
              startMonth={startMonth}
              onChange={(d: Date | null) => {
                if (d) setDate(d);
              }}
              onDatesChange={setDates}
              onRangeChange={setRange}
              theme={activeTheme}
              locale={activeLocale}
              startDate={startDate}
              endDate={endDate}
              startOfWeek={startOfWeek}
              disabled={getDisabledValue()}
              rangeMinDays={mode === "range" ? rangeMinDays : undefined}
              rangeMaxDays={mode === "range" ? rangeMaxDays : undefined}
              {...config}
            />
          </div>
        </div>

        <aside className="kitchen-panel">
          <p className="panel-label">Theme</p>
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
                onClick={() => setStartOfWeek(i as StartOfWeek)}
                className={`panel-weekday-btn ${startOfWeek === i ? "active" : ""}`}
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
