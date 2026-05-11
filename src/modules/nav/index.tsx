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
  Down,
  Home,
  ThemeToggle,
} from "@/Icons";
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
import { MonthPopup, YearPopup } from "./month-year-track";
import styles from "./nav.module.css";
import { TimePopup } from "./time-popup";

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
  label?: string;
  col?: number | string;
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
  label,
  col,
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
  const { minDate, maxDate, locale, hour12, disabled, readOnly, range } =
    useConfig();
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
    setShowTimePopup,
    setShowMonthPopup,
    setShowYearPopup,
    showTimePopup,
    showMonthPopup,
    showYearPopup,
    toggleTheme,
    activeTheme,
    setPopupAnchorEl,
    setNavShowSeconds,
    navShowSeconds,
  } = useUI();

  useEffect(() => {
    setNavShowSeconds(seconds);
  }, [seconds, setNavShowSeconds]);

  const openPopup =
    (setter: (v: boolean) => void) =>
    (e: React.MouseEvent<HTMLButtonElement>) => {
      setPopupAnchorEl(e.currentTarget);
      setter(true);
    };

  // Empty initial value avoids SSR/client clock mismatch. First tick fires
  // post-mount (see effect below).
  const [nowTime, setNowTime] = useState("");
  useEffect(() => {
    if (!showNowTime) return;
    const tick = () => setNowTime(getTimeString(new Date(), hour12, seconds));
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
  const curTime = getTimeString(date, hour12, seconds);

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

  const visible =
    !!safeLabel ||
    showTime ||
    showNowTime ||
    compactMonths ||
    showMonthPicker ||
    showYearPicker ||
    compactYears ||
    monthLabel ||
    yearLabel ||
    home ||
    clear ||
    themeToggle;
  const gridSlot = getGridSlotStyle(col);

  if (!visible) return null;

  return (
    <>
      <div
        className={styles.headerContainer}
        data-area="header"
        role="toolbar"
        {...(safeLabel
          ? { "aria-labelledby": labelId }
          : { "aria-label": "Calendar navigation" })}
        style={gridSlot}
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
            aria-label={`Change time, currently ${curTime}`}
            aria-haspopup="dialog"
            aria-expanded={showTimePopup}
            onClick={openPopup(setShowTimePopup)}
          >
            <AnimatedTime time={curTime} flip={animateTime} />
          </button>
        )}

        {compactMonths && (
          <button
            type="button"
            disabled={monthFixed}
            className={`${styles.monthButton} ${shared.interactive} ${shared.hovered}`}
            aria-label={`Change month, currently ${monthNameLong}`}
            aria-haspopup="dialog"
            aria-expanded={showMonthPopup}
            onClick={monthFixed ? undefined : openPopup(setShowMonthPopup)}
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
            aria-label="Month picker"
          >
            {canGoPrevMonth && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label="Previous month"
                onClick={() => cm(-1)}
              >
                <ChevronLeft />
              </button>
            )}
            <button
              type="button"
              disabled={monthFixed}
              onClick={monthFixed ? undefined : openPopup(setShowMonthPopup)}
              className={`${styles.currentYear} ${shared.interactive} ${shared.hovered} ${monthFixed ? styles.staticButton : ""}`}
              aria-label={`Change month, currently ${monthNameLong}`}
              aria-haspopup={monthFixed ? undefined : "dialog"}
              aria-expanded={monthFixed ? undefined : showMonthPopup}
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
                aria-label="Next month"
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
            aria-label="Year picker"
          >
            {canGoPrev && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label="Previous year"
                onClick={() => ch(-1)}
              >
                <ChevronLeft />
              </button>
            )}
            <button
              type="button"
              disabled={yearFixed}
              onClick={yearFixed ? undefined : openPopup(setShowYearPopup)}
              className={`${styles.currentYear} ${shared.interactive} ${shared.hovered} ${yearFixed ? styles.staticButton : ""}`}
              aria-label={`Change year, currently ${cur}`}
              aria-haspopup={yearFixed ? undefined : "dialog"}
              aria-expanded={yearFixed ? undefined : showYearPopup}
            >
              {cur}
            </button>
            {canGoNext && (
              <button
                type="button"
                className={`${styles.arrow} ${shared.interactive} ${shared.hovered}`}
                aria-label="Next year"
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
            aria-label={`Change year, currently ${cur}`}
            aria-haspopup="dialog"
            aria-expanded={showYearPopup}
            onClick={yearFixed ? undefined : openPopup(setShowYearPopup)}
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

        {(themeToggle || home || clear) && (
          <div className={styles.flexWrapper}>
            {themeToggle && (
              <button
                type="button"
                className={`${styles.homeButton} ${shared.interactive} ${shared.hovered}`}
                aria-label={
                  activeTheme === "dark"
                    ? "Switch to light mode"
                    : activeTheme === "light"
                      ? "Switch to dark mode"
                      : "Toggle theme"
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
                aria-label="Go to current month"
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
                aria-label="Clear selection"
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
      {showTimePopup && (
        <TimePopup
          date={date}
          hour12={hour12}
          showSeconds={navShowSeconds}
          readOnly={readOnly}
          onConfirm={(newDate) => {
            onChangeTime(newDate);
            setShowTimePopup(false);
          }}
          onClose={() => setShowTimePopup(false)}
        />
      )}
      {showMonthPopup && (
        <MonthPopup
          date={date}
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          onConfirm={(newDate) => {
            navigateBoundOrView(newDate);
            setShowMonthPopup(false);
          }}
          onClose={() => setShowMonthPopup(false)}
        />
      )}
      {showYearPopup && (
        <YearPopup
          date={date}
          minDate={minDate}
          maxDate={maxDate}
          onConfirm={(newDate) => {
            navigateBoundOrView(newDate);
            setShowYearPopup(false);
          }}
          onClose={() => setShowYearPopup(false)}
        />
      )}
    </>
  );
};
