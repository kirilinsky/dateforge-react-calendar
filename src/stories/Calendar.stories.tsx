import { useState } from "react";
import { Calendar } from "../components/calendar/calendar";
import "./calendar.css";
import { CalendarTheme, DARK_THEMES, LIGHT_THEMES } from "../types/themes";
import { DisabledRule, StartOfWeek } from "../types/calendar";

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

const THEME_LABELS: Record<CalendarTheme, string> = {
  paper: "Paper",
  carbon: "Carbon",
  mint: "Mint",
  midnight: "Midnight",
  industrial: "Industrial",
  graphite: "Graphite",
  sandstone: "Sandstone",
  phosphor: "Phosphor",
  dracula: "Dracula",
  cyber: "Cyber",
  comfy: "Comfy",
  temporal: "Temporal",
  neon: "Neon",
  rosa: "Rosa",
  amethyst: "Amethyst",
  crimson: "Crimson",
  snow: "Snow",
  solar: "Solar",
  latte: "Latte",
  forest: "Forest",
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
          date={date}
          onChangeDate={(d: Date | Date[] | null) => {
            if (d instanceof Date) setDate(d);
          }}
          theme="industrial"
          brutalism
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
          date={date}
          onChangeDate={(d: Date | Date[] | null) => {
            if (d instanceof Date) setDate(d);
          }}
          twoMonthsLayout
          months
          time={false}
          presets={false}
          theme="paper"
        />
      </div>
    </StoryWrapper>
  );
};

export const RangePicker = () => {
  const [range, setRange] = useState<[Date, Date] | [Date] | []>([]);

  const handleChange = (d: Date | Date[] | null) => {
    if (!d) {
      setRange([]);
      return;
    }
    if (Array.isArray(d) && d.length === 2) setRange([d[0], d[1]]);
    else if (d instanceof Date) setRange([d]);
  };

  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(d);

  const subtitle =
    range.length === 2
      ? `${fmt(range[0])} → ${fmt(range[1])}`
      : range.length === 1
        ? `${fmt(range[0])} → pick end…`
        : "Pick start date";

  return (
    <StoryWrapper title="Range Picker" subtitle={subtitle}>
      <div className="calendar-fixed-container">
        <Calendar
          range
          showSelectedDates
          date={range.length ? range : undefined}
          onChangeDate={handleChange}
          theme="paper"
          months
          time={false}
          presets={false}
        />
      </div>
    </StoryWrapper>
  );
};

type SelectionMode = "single" | "range" | 2 | 3 | true;

export const KitchenSink = () => {
  const [mode, setMode] = useState<SelectionMode>("single");
  const [dates, setDates] = useState<Date[]>([]);
  const [date, setDate] = useState<Date>(new Date());
  const [startMonth, setStartMonth] = useState<Date>(new Date());
  const [activeTheme, setActiveTheme] = useState<CalendarTheme>("mint");
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

  const getDisabledValue = (): DisabledRule | undefined => {
    switch (disabledMode) {
      case "all":
        return true;
      case "date":
        return parseDate(disabledDate);
      case "dates":
        return disabledDates.map(parseDate);
      case "range":
        return { from: parseDate(disabledFrom), to: parseDate(disabledTo) };
      case "weekdays":
        return disabledWeekdays.length
          ? { dayOfWeek: disabledWeekdays }
          : undefined;
      case "before":
        return { before: parseDate(disabledBefore) };
      case "after":
        return { after: parseDate(disabledAfter) };
      case "outside":
        return {
          before: parseDate(disabledBefore),
          after: parseDate(disabledAfter),
        };
      default:
        return undefined;
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
  });

  const toggle = (key: keyof typeof config) =>
    setConfig((prev) => ({ ...prev, [key]: !prev[key] }));

  const isRange = mode === "range";
  const multiselect = mode !== "single" && mode !== "range" ? mode : undefined;

  const handleChangeDate = (d: Date | Date[] | null) => {
    if (isRange) {
      return;
    }
    if (multiselect) {
      setDates(Array.isArray(d) ? d : d ? [d] : []);
    } else {
      if (d instanceof Date) setDate(d);
    }
  };

  const modeOptions: { label: string; value: SelectionMode }[] = [
    { label: "Single", value: "single" },
    { label: "Range", value: "range" },
    { label: "2 dates", value: 2 },
    { label: "3 dates", value: 3 },
    { label: "Unlimited", value: true },
  ];

  const subtitle = isRange
    ? "Range mode"
    : multiselect
      ? dates.length
        ? dates.map((d) => formatSubtitle(d, activeLocale)).join(" · ")
        : "No dates selected"
      : formatSubtitle(date, activeLocale, config.time);

  const isLight = (LIGHT_THEMES as readonly string[]).includes(activeTheme);

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
              key={String(opt.value)}
              onClick={() => {
                setMode(opt.value);
                setDates([]);
              }}
              className={`panel-button ${mode === opt.value ? "active" : ""}`}
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
              date={isRange ? undefined : multiselect ? dates : date}
              startMonth={startMonth}
              multiselect={multiselect}
              range={isRange || undefined}
              onChangeDate={handleChangeDate}
              theme={activeTheme}
              locale={activeLocale}
              startDate={startDate}
              endDate={endDate}
              startOfWeek={startOfWeek}
              disabled={getDisabledValue()}
              rangeMinDays={isRange ? rangeMinDays : undefined}
              rangeMaxDays={isRange ? rangeMaxDays : undefined}
              {...config}
            />
          </div>
        </div>

        <aside className="kitchen-panel">
          <p className="panel-label">Theme</p>
          <select
            className="panel-select"
            value={activeTheme}
            onChange={(e) => setActiveTheme(e.target.value as CalendarTheme)}
          >
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

          {isRange && (
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
                    setRangeMinDays(e.target.value ? Number(e.target.value) : undefined)
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
                    setRangeMaxDays(e.target.value ? Number(e.target.value) : undefined)
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
