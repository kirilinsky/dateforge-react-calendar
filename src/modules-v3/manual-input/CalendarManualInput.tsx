import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { calendarDate } from "../../core-v3/calendar-date";
import {
  fromCalendarDateTime,
  toCalendarDateTime,
} from "../../core-v3/timezone-boundary";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import {
  applyMask,
  DEFAULT_DATE_FORMAT,
  dateToMask,
  maskToDate,
  validatePartialMask,
} from "../../utils/date-mask";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./manual-input.module.css";

export type CalendarManualInputProps = {
  format?: string;
  placeholder?: string;
  col?: number | string;
  className?: string;
};

const countDigits = (s: string) => (s.match(/\d/g) ?? []).length;

const positionAfterNDigits = (masked: string, n: number): number => {
  if (n <= 0) return 0;
  let count = 0;
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i])) {
      count++;
      if (count === n) return i + 1;
    }
  }
  return masked.length;
};

export function CalendarManualInput({
  format = DEFAULT_DATE_FORMAT,
  placeholder,
  col,
  className,
}: CalendarManualInputProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const { selectDay, clear } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);

  // Derive controlled Date from selection (single point only)
  // Stable key for the selected date — avoids re-running the sync effect on
  // every render (fromCalendarDateTime creates a new Date ref each time).
  const selectedKey =
    selection.shape === "point" && selection.dates.length === 1
      ? `${selection.dates[0].date.year}-${selection.dates[0].date.month}-${selection.dates[0].date.day}`
      : null;

  const controlledDate =
    selection.shape === "point" && selection.dates.length === 1
      ? (() => {
          const r = fromCalendarDateTime(selection.dates[0], config.timeZone);
          return r.ok ? r.date : null;
        })()
      : null;

  const [text, setText] = useState(() => dateToMask(controlledDate, format));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(dateToMask(controlledDate, format));
    setInvalid(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, format]);

  useLayoutEffect(() => {
    if (pendingCursor.current === null || !inputRef.current) return;
    const pos = positionAfterNDigits(text, pendingCursor.current);
    inputRef.current.setSelectionRange(pos, pos);
    pendingCursor.current = null;
  });

  const isDateAllowed = (d: Date): boolean => {
    const { date } = toCalendarDateTime(d, config.timeZone);
    if (config.disabled.matches(date)) return false;
    if (
      config.min &&
      date.year * 10000 + date.month * 100 + date.day <
        config.min.year * 10000 + config.min.month * 100 + config.min.day
    )
      return false;
    if (
      config.max &&
      date.year * 10000 + date.month * 100 + date.day >
        config.max.year * 10000 + config.max.month * 100 + config.max.day
    )
      return false;
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (config.readOnly) return;
    const raw = e.target.value;
    const sel = e.target.selectionStart ?? raw.length;
    pendingCursor.current = countDigits(raw.slice(0, sel));

    const masked = applyMask(raw, format);
    setText(masked);

    let nextInvalid = validatePartialMask(masked, format);
    const date = maskToDate(masked, format);

    if (date) {
      if (isDateAllowed(date)) {
        nextInvalid = false;
        const { date: cd } = toCalendarDateTime(date, config.timeZone);
        selectDay(calendarDate(cd.year, cd.month, cd.day));
      } else {
        nextInvalid = true;
      }
    }

    setInvalid(nextInvalid);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setText("");
      setInvalid(false);
      clear();
      return;
    }
    const target = e.currentTarget;
    const sel = target.selectionStart ?? 0;
    const selEnd = target.selectionEnd ?? sel;
    if (
      e.key === "Backspace" &&
      sel === selEnd &&
      sel > 0 &&
      text[sel - 1] !== undefined &&
      !/\d/.test(text[sel - 1])
    ) {
      e.preventDefault();
      const before = text.slice(0, sel - 2);
      const after = text.slice(sel);
      const merged = before + after;
      pendingCursor.current = countDigits(before);
      const masked = applyMask(merged, format);
      setText(masked);
      let nextInvalid = validatePartialMask(masked, format);
      const date = maskToDate(masked, format);
      if (date && isDateAllowed(date)) {
        nextInvalid = false;
        const { date: cd } = toCalendarDateTime(date, config.timeZone);
        selectDay(calendarDate(cd.year, cd.month, cd.day));
      } else if (date) {
        nextInvalid = true;
      }
      setInvalid(nextInvalid);
    }
  };

  const gridSlot = getGridSlotStyle(col);

  return (
    <div
      data-dateforge-manual-input=""
      data-area="manual-input"
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={gridSlot}
    >
      <input
        id={inputId}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        className={styles.input}
        data-invalid={invalid || undefined}
        value={text}
        placeholder={placeholder ?? format}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        readOnly={config.readOnly}
        aria-invalid={invalid || undefined}
      />
    </div>
  );
}
