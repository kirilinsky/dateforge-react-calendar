import type React from "react";
import {
  memo,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { warnOnce } from "@/core/dev-warn";
import shared from "@/global/global.module.css";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import { useClientValue } from "@/hooks/use-client-value";
import {
  ChevronLeft,
  ChevronRight,
  Clear,
  Clock,
  Down,
  Home,
  ThemeToggle,
} from "@/Icons";
import type { CalendarTheme } from "@/types/themes";
import {
  DEFAULT_CALENDAR_NAVIGATION_LABEL,
  DEFAULT_CHANGE_MONTH_LABEL,
  DEFAULT_CHANGE_TIME_LABEL,
  DEFAULT_CHANGE_YEAR_LABEL,
  DEFAULT_CLEAR_LABEL,
  DEFAULT_CONFIRM_LABEL,
  DEFAULT_HOME_LABEL,
  DEFAULT_HOURS_LABEL,
  DEFAULT_MINUTES_LABEL,
  DEFAULT_MONTH_PICKER_LABEL,
  DEFAULT_MONTH_TRACK_LABEL,
  DEFAULT_NEXT_MONTH_LABEL,
  DEFAULT_NEXT_YEAR_LABEL,
  DEFAULT_PREVIOUS_MONTH_LABEL,
  DEFAULT_PREVIOUS_YEAR_LABEL,
  DEFAULT_SECONDS_LABEL,
  DEFAULT_SELECT_MONTH_LABEL,
  DEFAULT_SELECT_TIME_LABEL,
  DEFAULT_SELECT_YEAR_LABEL,
  DEFAULT_THEME_SWITCH_TO_DARK_LABEL,
  DEFAULT_THEME_SWITCH_TO_LIGHT_LABEL,
  DEFAULT_THEME_TOGGLE_LABEL,
  DEFAULT_TIME_PERIOD_LABEL,
  DEFAULT_TIME_PICKER_LABEL,
  DEFAULT_YEAR_PICKER_LABEL,
  DEFAULT_YEAR_TRACK_LABEL,
  formatActionLabel,
  resolveActionLabel,
} from "@/utils/action-labels";
import { clampBoundDate } from "@/utils/clamp-bound-date";
import {
  addDate,
  checkYearNavigation,
  getMonthNames,
  getTimeString,
  isYearFixed,
} from "@/utils/date-utils";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { getDateTimeFormat } from "@/utils/intl-cache";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import { MonthPopup, YearPopup } from "./month-year-track";
import styles from "./nav.module.css";
import { TimePopup } from "./time-popup";
import { useNavPopupState } from "./use-nav-popup-state";

const DRUM_MS = 240;

const DrumChar = ({ char }: { char: string }) => {
  const [{ curr, prev, key }, set] = useState({
    curr: char,
    prev: char,
    key: 0,
  });
  const lastAt = useRef(0);

  useLayoutEffect(() => {
    if (char === curr) return;
    const now = performance.now();
    const rapid = now - lastAt.current < DRUM_MS;
    lastAt.current = now;
    set((s) => ({ curr: char, prev: rapid ? char : s.curr, key: s.key + 1 }));
  }, [char]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span className={styles.drumSlot}>
      <span aria-hidden className={styles.drumSizer}>
        {char}
      </span>
      {prev !== curr && (
        <span key={`${key}p`} className={styles.drumPrev}>
          {prev}
        </span>
      )}
      <span key={key} className={styles.drumCurr}>
        {curr}
      </span>
    </span>
  );
};

const AnimatedTime = memo(
  ({ time, flip }: { time: string; flip?: boolean }) => {
    if (!flip) return <span>{time}</span>;
    return (
      <span className={styles.ticker}>
        {Array.from(time).map((char, i) =>
          /\d/.test(char) ? (
            <DrumChar key={i} char={char} />
          ) : (
            <span key={i} className={styles.tickerSep}>
              {char}
            </span>
          ),
        )}
      </span>
    );
  },
);

const longestBy = (arr: string[]) =>
  arr.reduce((a, b) => (b.length > a.length ? b : a), "");

const MonthLabel = memo(
  ({
    locale,
    longName,
    shortName,
  }: {
    locale: string;
    longName: string;
    shortName: string;
  }) => {
    const longestLong = useMemo(
      () => longestBy(getMonthNames(locale, false)),
      [locale],
    );
    const longestShort = useMemo(
      () => longestBy(getMonthNames(locale, true)),
      [locale],
    );
    return (
      <span className={styles.monthSlot}>
        <span
          className={`${styles.monthNameLong} ${styles.monthSizer}`}
          aria-hidden
        >
          {longestLong}
        </span>
        <span
          className={`${styles.monthNameShort} ${styles.monthSizer}`}
          aria-hidden
        >
          {longestShort}
        </span>
        <span className={styles.monthNameLong}>{longName}</span>
        <span className={styles.monthNameShort}>{shortName}</span>
      </span>
    );
  },
);

const LABEL_MAX_LENGTH = 180;
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional control-char strip for label sanitization
const UNSAFE_LABEL_CHARS = /[<>\u0000-\u001f\u007f]/g;

const sanitizeLabel = (raw: string): string =>
  raw.replace(UNSAFE_LABEL_CHARS, "").trim().slice(0, LABEL_MAX_LENGTH);

export interface CalendarNavProps {
  offset?: number;
  showTime?: boolean;
  showNowTime?: boolean;
  seconds?: boolean;
  animateTime?: boolean;
  showMonthPicker?: boolean;
  compactMonths?: boolean;
  showYearPicker?: boolean;
  compactYears?: boolean;
  monthLabel?: boolean;
  yearLabel?: boolean;
  home?: boolean;
  clear?: boolean;
  themeToggle?: boolean;
  compactTime?: boolean;
  calendarNavigationLabel?: string;
  changeMonthLabel?: string;
  changeTimeLabel?: string;
  changeYearLabel?: string;
  clearLabel?: string;
  confirmLabel?: string;
  homeLabel?: string;
  hoursLabel?: string;
  label?: string;
  minutesLabel?: string;
  monthPickerLabel?: string;
  monthTrackLabel?: string;
  nextMonthLabel?: string;
  nextYearLabel?: string;
  previousMonthLabel?: string;
  previousYearLabel?: string;
  secondsLabel?: string;
  selectMonthLabel?: string;
  selectTimeLabel?: string;
  selectYearLabel?: string;
  themeSwitchToDarkLabel?: string;
  themeSwitchToLightLabel?: string;
  themeToggleLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  yearPickerLabel?: string;
  yearTrackLabel?: string;
  col?: number | string;
  theme?: CalendarTheme;
  bound?: "from" | "to";
}

export const CalendarNav: React.FC<CalendarNavProps> = ({
  offset = 0,
  showTime = false,
  showNowTime = false,
  seconds = false,
  animateTime = true,
  showMonthPicker = false,
  compactMonths = false,
  showYearPicker = false,
  compactYears = false,
  monthLabel = false,
  yearLabel = false,
  home = false,
  clear = false,
  themeToggle = false,
  compactTime = false,
  calendarNavigationLabel,
  changeMonthLabel,
  changeTimeLabel,
  changeYearLabel,
  clearLabel,
  confirmLabel,
  homeLabel,
  hoursLabel,
  label,
  minutesLabel,
  monthPickerLabel,
  monthTrackLabel,
  nextMonthLabel,
  nextYearLabel,
  previousMonthLabel,
  previousYearLabel,
  secondsLabel,
  selectMonthLabel,
  selectTimeLabel,
  selectYearLabel,
  themeSwitchToDarkLabel,
  themeSwitchToLightLabel,
  themeToggleLabel,
  timePeriodLabel,
  timePickerLabel,
  yearPickerLabel,
  yearTrackLabel,
  col,
  theme,
  bound,
}) => {
  if (showMonthPicker && compactMonths) {
    warnOnce(
      "nav:ambiguous:month",
      `<CalendarNav showMonthPicker compactMonths /> renders both month UI variants side by side. Use one or the other.`,
    );
  }
  if (showYearPicker && compactYears) {
    warnOnce(
      "nav:ambiguous:year",
      `<CalendarNav showYearPicker compactYears /> renders both year UI variants side by side. Use one or the other.`,
    );
  }

  const safeLabel = useMemo(() => (label ? sanitizeLabel(label) : ""), [label]);
  const labelId = useId();
  const {
    minDate,
    maxDate,
    locale,
    hour12,
    disabled,
    readOnly,
    range,
    actionLabels,
  } = useConfig();
  const resolvedClearLabel = resolveActionLabel(
    clearLabel,
    actionLabels.clearLabel,
    DEFAULT_CLEAR_LABEL,
  );
  const resolvedConfirmLabel = resolveActionLabel(
    confirmLabel,
    actionLabels.confirmLabel,
    DEFAULT_CONFIRM_LABEL,
  );
  const resolvedHomeLabel = resolveActionLabel(
    homeLabel,
    actionLabels.homeLabel,
    DEFAULT_HOME_LABEL,
  );
  const resolvedCalendarNavigationLabel = resolveActionLabel(
    calendarNavigationLabel,
    actionLabels.calendarNavigationLabel,
    DEFAULT_CALENDAR_NAVIGATION_LABEL,
  );
  const resolvedChangeTimeLabel = resolveActionLabel(
    changeTimeLabel,
    actionLabels.changeTimeLabel,
    DEFAULT_CHANGE_TIME_LABEL,
  );
  const resolvedChangeMonthLabel = resolveActionLabel(
    changeMonthLabel,
    actionLabels.changeMonthLabel,
    DEFAULT_CHANGE_MONTH_LABEL,
  );
  const resolvedChangeYearLabel = resolveActionLabel(
    changeYearLabel,
    actionLabels.changeYearLabel,
    DEFAULT_CHANGE_YEAR_LABEL,
  );
  const resolvedMonthPickerLabel = resolveActionLabel(
    monthPickerLabel,
    actionLabels.monthPickerLabel,
    DEFAULT_MONTH_PICKER_LABEL,
  );
  const resolvedYearPickerLabel = resolveActionLabel(
    yearPickerLabel,
    actionLabels.yearPickerLabel,
    DEFAULT_YEAR_PICKER_LABEL,
  );
  const resolvedPreviousMonthLabel = resolveActionLabel(
    previousMonthLabel,
    actionLabels.previousMonthLabel,
    DEFAULT_PREVIOUS_MONTH_LABEL,
  );
  const resolvedNextMonthLabel = resolveActionLabel(
    nextMonthLabel,
    actionLabels.nextMonthLabel,
    DEFAULT_NEXT_MONTH_LABEL,
  );
  const resolvedPreviousYearLabel = resolveActionLabel(
    previousYearLabel,
    actionLabels.previousYearLabel,
    DEFAULT_PREVIOUS_YEAR_LABEL,
  );
  const resolvedNextYearLabel = resolveActionLabel(
    nextYearLabel,
    actionLabels.nextYearLabel,
    DEFAULT_NEXT_YEAR_LABEL,
  );
  const resolvedSelectTimeLabel = resolveActionLabel(
    selectTimeLabel,
    actionLabels.selectTimeLabel,
    DEFAULT_SELECT_TIME_LABEL,
  );
  const resolvedSelectMonthLabel = resolveActionLabel(
    selectMonthLabel,
    actionLabels.selectMonthLabel,
    DEFAULT_SELECT_MONTH_LABEL,
  );
  const resolvedSelectYearLabel = resolveActionLabel(
    selectYearLabel,
    actionLabels.selectYearLabel,
    DEFAULT_SELECT_YEAR_LABEL,
  );
  const resolvedMonthTrackLabel = resolveActionLabel(
    monthTrackLabel,
    actionLabels.monthTrackLabel,
    DEFAULT_MONTH_TRACK_LABEL,
  );
  const resolvedYearTrackLabel = resolveActionLabel(
    yearTrackLabel,
    actionLabels.yearTrackLabel,
    DEFAULT_YEAR_TRACK_LABEL,
  );
  const resolvedHoursLabel = resolveActionLabel(
    hoursLabel,
    actionLabels.hoursLabel,
    DEFAULT_HOURS_LABEL,
  );
  const resolvedMinutesLabel = resolveActionLabel(
    minutesLabel,
    actionLabels.minutesLabel,
    DEFAULT_MINUTES_LABEL,
  );
  const resolvedSecondsLabel = resolveActionLabel(
    secondsLabel,
    actionLabels.secondsLabel,
    DEFAULT_SECONDS_LABEL,
  );
  const resolvedTimePickerLabel = resolveActionLabel(
    timePickerLabel,
    actionLabels.timePickerLabel,
    DEFAULT_TIME_PICKER_LABEL,
  );
  const resolvedTimePeriodLabel = resolveActionLabel(
    timePeriodLabel,
    actionLabels.timePeriodLabel,
    DEFAULT_TIME_PERIOD_LABEL,
  );
  const resolvedThemeSwitchToLightLabel = resolveActionLabel(
    themeSwitchToLightLabel,
    actionLabels.themeSwitchToLightLabel,
    DEFAULT_THEME_SWITCH_TO_LIGHT_LABEL,
  );
  const resolvedThemeSwitchToDarkLabel = resolveActionLabel(
    themeSwitchToDarkLabel,
    actionLabels.themeSwitchToDarkLabel,
    DEFAULT_THEME_SWITCH_TO_DARK_LABEL,
  );
  const resolvedThemeToggleLabel = resolveActionLabel(
    themeToggleLabel,
    actionLabels.themeToggleLabel,
    DEFAULT_THEME_TOGGLE_LABEL,
  );
  const { viewDate, navigateTo } = useNavigation();
  const { selectedDates, rangeStart, rangeEnd } = useSelectionValue();
  const { onChangeDate, onChangeTime, onRangeBoundSet } = useSelectionActions();
  const { isBound, boundDate, setLocalView, refDate } = useBoundDateView({
    bound,
    range,
    rangeStart,
    rangeEnd,
    viewDate,
  });
  const rawDate = isBound ? refDate : viewDate;
  const date = offset
    ? new Date(
        rawDate.getFullYear(),
        rawDate.getMonth() + offset,
        1,
        rawDate.getHours(),
        rawDate.getMinutes(),
        rawDate.getSeconds(),
        rawDate.getMilliseconds(),
      )
    : rawDate;

  const navigateBoundOrView = (next: Date) => {
    if (isBound) {
      const clamped = clampBoundDate(next, bound!, rangeStart, rangeEnd);
      setLocalView(clamped);
      if (!readOnly) onRangeBoundSet(bound!, clamped);
    } else {
      navigateTo(next);
    }
  };
  const {
    toggleTheme,
    activeTheme,
    setPopupAnchorEl,
    setNavShowSeconds,
    navShowSeconds,
  } = useUI();
  const themeScope = resolveThemeScope(theme, activeTheme);
  const usesLocalPopupState = offset !== 0;
  const {
    timePopupOpen,
    monthPopupOpen,
    yearPopupOpen,
    setTimePopupOpen,
    setMonthPopupOpen,
    setYearPopupOpen,
    closeSharedPopups,
  } = useNavPopupState(usesLocalPopupState);

  useEffect(() => {
    setNavShowSeconds(seconds);
  }, [seconds, setNavShowSeconds]);

  const openPopup =
    (setter: (v: boolean) => void) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setPopupAnchorEl(e.currentTarget);
      if (usesLocalPopupState) closeSharedPopups();
      setter(true);
    };

  // Empty initial value avoids SSR/client clock mismatch. First tick fires
  // post-mount (see effect below).
  const [nowTime, setNowTime] = useState("");
  useEffect(() => {
    if (!showNowTime) return;
    const tick = () =>
      setNowTime(getTimeString(new Date(), hour12, seconds, locale));
    tick();
    const id = setInterval(tick, seconds ? 1000 : 60_000);
    return () => clearInterval(id);
  }, [showNowTime, hour12, seconds]);

  // `today` may differ between server and client at midnight boundaries; defer
  // the computation to post-mount so SSR output is stable.
  const today = useClientValue<Date | null>(() => new Date(), null);
  const isCurrentMonth =
    !!today &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth();

  const cur = date.getFullYear();
  const curTime = getTimeString(date, hour12, seconds, locale);

  const yearFixed = useMemo(
    () => isYearFixed(cur, minDate, maxDate),
    [cur, minDate, maxDate],
  );
  const monthFixed = useMemo(
    () => isYearFixed(cur, minDate, maxDate, date.getMonth()),
    [minDate, maxDate, date],
  );

  const { canGoPrev, canGoNext, canGoPrevMonth, canGoNextMonth } = useMemo(
    () => checkYearNavigation(cur, minDate, maxDate, date, disabled),
    [cur, date, minDate, maxDate, disabled],
  );

  const monthNameLong = getDateTimeFormat(locale, { month: "long" }).format(
    date,
  );
  const monthNameShort = getDateTimeFormat(locale, { month: "short" }).format(
    date,
  );

  const ch = (v: number) =>
    navigateBoundOrView(addDate(rawDate, v, "year", minDate, maxDate));
  const cm = (v: number) =>
    navigateBoundOrView(addDate(rawDate, v, "month", minDate, maxDate));
  const goHome = () => {
    if (!today) return;
    const next = new Date(date);
    next.setFullYear(today.getFullYear());
    next.setMonth(today.getMonth(), 1);
    navigateBoundOrView(next);
  };

  const slotCount =
    (safeLabel ? 1 : 0) +
    (showTime ? 1 : 0) +
    (showNowTime ? 1 : 0) +
    (compactMonths ? 1 : 0) +
    (showMonthPicker ? 1 : 0) +
    (showYearPicker ? 1 : 0) +
    (compactYears ? 1 : 0) +
    (monthLabel ? 1 : 0) +
    (yearLabel ? 1 : 0) +
    (themeToggle || home || clear || compactTime ? 1 : 0);
  const selectorCount = (showMonthPicker ? 1 : 0) + (showYearPicker ? 1 : 0);
  const visible = slotCount > 0;
  const gridSlot = getGridSlotStyle(col);
  const rootStyle = { ...gridSlot, ...themeScope.style };

  if (!visible) return null;

  return (
    <>
      <div
        className={styles.headerContainer}
        data-area="header"
        data-slots={slotCount}
        data-selector-count={selectorCount}
        data-theme={themeScope.dataTheme}
        role="toolbar"
        {...(safeLabel
          ? { "aria-labelledby": labelId }
          : { "aria-label": resolvedCalendarNavigationLabel })}
        style={rootStyle}
      >
        {showNowTime && (
          <span className={styles.nowTimeDisplay} aria-hidden="true">
            <span className={styles.nowTimeDot} />
            <AnimatedTime time={nowTime} flip={animateTime} />
          </span>
        )}

        {showTime && (
          <button
            type="button"
            className={`${styles.timeButton} ${shared.interactive}`}
            aria-label={formatActionLabel(
              resolvedChangeTimeLabel,
              "time",
              curTime,
            )}
            aria-haspopup="dialog"
            aria-expanded={timePopupOpen}
            onClick={openPopup(setTimePopupOpen)}
          >
            <AnimatedTime time={curTime} flip={animateTime} />
          </button>
        )}

        {compactMonths && (
          <button
            type="button"
            disabled={monthFixed}
            className={`${styles.monthButton} ${shared.interactive} ${shared.hovered}`}
            aria-label={formatActionLabel(
              resolvedChangeMonthLabel,
              "month",
              monthNameLong,
            )}
            aria-haspopup="dialog"
            aria-expanded={monthPopupOpen}
            onClick={monthFixed ? undefined : openPopup(setMonthPopupOpen)}
          >
            <Down />{" "}
            <MonthLabel
              locale={locale}
              longName={monthNameLong}
              shortName={monthNameShort}
            />
          </button>
        )}

        {safeLabel && (
          <span
            id={labelId}
            className={styles.label}
            role="heading"
            aria-level={2}
          >
            {safeLabel}
          </span>
        )}

        {showMonthPicker && (
          <div
            className={styles.yearsSelector}
            role="group"
            aria-label={resolvedMonthPickerLabel}
          >
            {canGoPrevMonth && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label={resolvedPreviousMonthLabel}
                onClick={() => cm(-1)}
              >
                <ChevronLeft />
              </button>
            )}
            <button
              type="button"
              disabled={monthFixed}
              onClick={monthFixed ? undefined : openPopup(setMonthPopupOpen)}
              className={`${styles.currentYear} ${shared.interactive} ${shared.hovered} ${monthFixed ? styles.staticButton : ""}`}
              aria-label={formatActionLabel(
                resolvedChangeMonthLabel,
                "month",
                monthNameLong,
              )}
              aria-haspopup={monthFixed ? undefined : "dialog"}
              aria-expanded={monthFixed ? undefined : monthPopupOpen}
            >
              <MonthLabel
                locale={locale}
                longName={monthNameLong}
                shortName={monthNameShort}
              />
            </button>
            {canGoNextMonth && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label={resolvedNextMonthLabel}
                onClick={() => cm(1)}
              >
                <ChevronRight />
              </button>
            )}
          </div>
        )}

        {showYearPicker && (
          <div
            className={styles.yearsSelector}
            role="group"
            aria-label={resolvedYearPickerLabel}
          >
            {canGoPrev && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label={resolvedPreviousYearLabel}
                onClick={() => ch(-1)}
              >
                <ChevronLeft />
              </button>
            )}
            <button
              type="button"
              disabled={yearFixed}
              onClick={yearFixed ? undefined : openPopup(setYearPopupOpen)}
              className={`${styles.currentYear} ${shared.interactive} ${shared.hovered} ${yearFixed ? styles.staticButton : ""}`}
              aria-label={formatActionLabel(
                resolvedChangeYearLabel,
                "year",
                cur,
              )}
              aria-haspopup={yearFixed ? undefined : "dialog"}
              aria-expanded={yearFixed ? undefined : yearPopupOpen}
            >
              <span>{cur}</span>
            </button>
            {canGoNext && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label={resolvedNextYearLabel}
                onClick={() => ch(1)}
              >
                <ChevronRight />
              </button>
            )}
          </div>
        )}

        {compactYears && (
          <button
            type="button"
            disabled={yearFixed}
            className={`${styles.monthButton} ${shared.interactive} ${shared.hovered}`}
            aria-label={formatActionLabel(resolvedChangeYearLabel, "year", cur)}
            aria-haspopup="dialog"
            aria-expanded={yearPopupOpen}
            onClick={yearFixed ? undefined : openPopup(setYearPopupOpen)}
          >
            {cur} <Down />
          </button>
        )}

        {monthLabel && (
          <span
            className={`${styles.currentYear} ${styles.staticButton} ${shared.flexCenter}`}
          >
            <MonthLabel
              locale={locale}
              longName={monthNameLong}
              shortName={monthNameShort}
            />
          </span>
        )}

        {yearLabel && (
          <span
            className={`${styles.currentYear} ${styles.staticButton} ${shared.flexCenter}`}
          >
            {cur}
          </span>
        )}

        {(themeToggle || home || clear || compactTime) && (
          <div className={styles.flexWrapper}>
            {compactTime && (
              <button
                type="button"
                className={`${styles.homeButton} ${shared.interactive} ${shared.hovered}`}
                aria-label={formatActionLabel(
                  resolvedChangeTimeLabel,
                  "time",
                  curTime,
                )}
                aria-haspopup="dialog"
                aria-expanded={timePopupOpen}
                onClick={openPopup(setTimePopupOpen)}
              >
                <Clock />
              </button>
            )}
            {themeToggle && (
              <button
                type="button"
                className={`${styles.homeButton} ${shared.interactive} ${shared.hovered}`}
                aria-label={
                  activeTheme === "dark"
                    ? resolvedThemeSwitchToLightLabel
                    : activeTheme === "light"
                      ? resolvedThemeSwitchToDarkLabel
                      : resolvedThemeToggleLabel
                }
                aria-pressed={activeTheme === "dark"}
                onClick={toggleTheme}
              >
                <ThemeToggle />
              </button>
            )}
            {home && (
              <button
                type="button"
                className={`${styles.homeButton} ${shared.interactive} ${shared.hovered} ${isCurrentMonth ? styles.homeButtonDisabled : ""}`}
                disabled={isCurrentMonth}
                aria-label={resolvedHomeLabel}
                onClick={goHome}
              >
                <Home />
              </button>
            )}
            {clear && (
              <button
                type="button"
                className={`${styles.homeButton} ${shared.interactive} ${shared.hovered} ${
                  (isBound ? !boundDate : selectedDates.length === 0) ||
                  readOnly
                    ? styles.homeButtonDisabled
                    : ""
                }`}
                disabled={
                  (isBound ? !boundDate : selectedDates.length === 0) ||
                  readOnly
                }
                aria-label={resolvedClearLabel}
                onClick={() =>
                  isBound ? onRangeBoundSet(bound!, null) : onChangeDate(null)
                }
              >
                <Clear />
              </button>
            )}
          </div>
        )}
      </div>
      {timePopupOpen && (
        <TimePopup
          date={date}
          hour12={hour12}
          showSeconds={navShowSeconds}
          confirmLabel={resolvedConfirmLabel}
          hoursLabel={resolvedHoursLabel}
          label={resolvedSelectTimeLabel}
          minutesLabel={resolvedMinutesLabel}
          readOnly={readOnly || (isBound && !boundDate)}
          secondsLabel={resolvedSecondsLabel}
          timePeriodLabel={resolvedTimePeriodLabel}
          timePickerLabel={resolvedTimePickerLabel}
          theme={theme}
          onConfirm={(newDate) => {
            if (isBound) {
              if (boundDate) onRangeBoundSet(bound!, newDate);
            } else {
              onChangeTime(newDate);
            }
            setTimePopupOpen(false);
          }}
          onClose={() => setTimePopupOpen(false)}
        />
      )}
      {monthPopupOpen && (
        <MonthPopup
          date={date}
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          confirmLabel={resolvedConfirmLabel}
          label={resolvedSelectMonthLabel}
          monthTrackLabel={resolvedMonthTrackLabel}
          theme={theme}
          onConfirm={(newDate) => {
            navigateBoundOrView(newDate);
            setMonthPopupOpen(false);
          }}
          onClose={() => setMonthPopupOpen(false)}
        />
      )}
      {yearPopupOpen && (
        <YearPopup
          date={date}
          minDate={minDate}
          maxDate={maxDate}
          confirmLabel={resolvedConfirmLabel}
          label={resolvedSelectYearLabel}
          yearTrackLabel={resolvedYearTrackLabel}
          theme={theme}
          onConfirm={(newDate) => {
            navigateBoundOrView(newDate);
            setYearPopupOpen(false);
          }}
          onClose={() => setYearPopupOpen(false)}
        />
      )}
    </>
  );
};
