import type { ReactNode } from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { CalendarDate } from "../../core-v3/calendar-date";
import { compareDate } from "../../core-v3/calendar-date";
import { today as getToday } from "../../core-v3/timezone-boundary";
import { ClearIcon } from "../../react-v3/icons";
import { useLabels } from "../../react-v3/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react-v3/provider";
import { UIButton } from "../../react-v3/ui/button";
import { useStoreSelector } from "../../react-v3/use-store-selector";
import {
  applyMask,
  DEFAULT_DATE_FORMAT,
  validatePartialMask,
} from "../../utils/date-mask";
import { getGridSlotStyle } from "../../utils/get-grid-slot-style";
import styles from "./manual-input.module.css";
import { maskToCalendarDate, stepSegment } from "./segments";

export type CalendarManualInputProps = {
  /**
   * Token string with `DD`, `MM`, `YYYY` and single-char separators —
   * `"DD.MM.YYYY"` (default), `"MM/DD/YYYY"`, `"YYYY-MM-DD"`. Also the
   * default placeholder.
   */
  format?: string;
  placeholder?: string;
  /**
   * Span modes: which bound this input edits. Two inputs (`"from"` + `"to"`)
   * compose a from—to row. Default `"from"`. Ignored for point selections.
   */
  bound?: "from" | "to";
  /** Visible label before the input (wired via htmlFor). */
  label?: ReactNode;
  /** aria-label override when no visible label (registry key `manualInput`). */
  inputLabel?: string;
  /** Clear (×) button inside the input. Clears the whole selection. */
  allowClear?: boolean;
  /** Override for the clear aria-label (registry key `clear`). */
  clearLabel?: string;
  /** Horizontal alignment of the row. Default "left". */
  align?: "left" | "center" | "right";
  /** Per-module theme override (`data-theme` on the module container). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the module container). */
  scheme?: "light" | "dark" | "auto";
  col?: number | string;
  className?: string;
};

const ALIGN_TO_JUSTIFY = {
  left: "flex-start",
  center: "center",
  right: "flex-end",
} as const;

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

const dateToMaskText = (d: CalendarDate | null, format: string): string => {
  if (!d) return "";
  return format
    .replace("DD", String(d.day).padStart(2, "0"))
    .replace("MM", String(d.month).padStart(2, "0"))
    .replace("YYYY", String(d.year).padStart(4, "0"));
};

export function CalendarManualInput({
  format = DEFAULT_DATE_FORMAT,
  placeholder,
  bound = "from",
  label,
  inputLabel,
  allowClear = false,
  clearLabel,
  align = "left",
  theme,
  scheme,
  col,
  className,
}: CalendarManualInputProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { selectDay, setBoundDate, clear } = useCalendarActions();

  const selection = useStoreSelector(store, (s) => s.selection);

  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);
  const pendingRange = useRef<[number, number] | null>(null);

  // Multiple mode: the input is an ADD box (v2 parity) — it never mirrors a
  // picked date, each complete entry appends and the field resets for the
  // next one. Pair with `<CalendarSelectedDates allowClearPerChip>` for the
  // chip list; at `maxDates` the box disables instead of rejecting on commit.
  const isMultiple = config.mode === "multiple" && selection.shape === "point";
  const capReached =
    isMultiple &&
    config.maxDates !== undefined &&
    selection.dates.length >= config.maxDates;

  // The date this input mirrors: the single point, or the chosen span bound.
  // Pure CalendarDate fields — wall-clock, no Date/timezone roundtrip.
  const controlled: CalendarDate | null =
    selection.shape === "point"
      ? !isMultiple && selection.dates.length === 1
        ? selection.dates[0].date
        : null
      : selection.ranges.length > 0
        ? bound === "to"
          ? selection.ranges[0].end
          : selection.ranges[0].start
        : null;

  const selectedKey = controlled
    ? `${controlled.year}-${controlled.month}-${controlled.day}`
    : null;

  const [text, setText] = useState(() => dateToMaskText(controlled, format));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(dateToMaskText(controlled, format));
    setInvalid(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, format]);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    if (pendingRange.current !== null) {
      input.setSelectionRange(...pendingRange.current);
      pendingRange.current = null;
      return;
    }
    if (pendingCursor.current !== null) {
      const pos = positionAfterNDigits(text, pendingCursor.current);
      input.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  });

  const isDateAllowed = (d: CalendarDate): boolean => {
    if (config.disabled.matches(d)) return false;
    if (config.min && compareDate(d, config.min) < 0) return false;
    if (config.max && compareDate(d, config.max) > 0) return false;
    return true;
  };

  // Commit a complete typed date: point shapes select; span shapes with an
  // existing range move THIS input's bound (core validates ordering/crossing);
  // an empty span starts from the anchor like a grid click would.
  const commitDate = (d: CalendarDate): boolean => {
    // Same date as the mirrored value: no-op (re-dispatching selectDay would
    // TOGGLE the point selection off in single mode).
    if (controlled && compareDate(controlled, d) === 0) return true;
    if (selection.shape === "span" && selection.ranges.length > 0) {
      setBoundDate(d, bound);
      const after = store.getState().selection;
      if (after.shape !== "span" || after.ranges.length === 0) return false;
      const committed =
        bound === "to" ? after.ranges[0].end : after.ranges[0].start;
      return compareDate(committed, d) === 0;
    }
    if (isMultiple) {
      // Add-box: re-typing an already-picked date would toggle it OFF via
      // selectDay — treat it as "already there" instead.
      const key = `${d.year}-${d.month}-${d.day}`;
      const dup = selection.dates.some(
        (dt) => `${dt.date.year}-${dt.date.month}-${dt.date.day}` === key,
      );
      if (!dup) selectDay(d);
      // Reset for the next entry (async: let the commit render first).
      pendingCursor.current = 0;
      setTimeout(() => {
        setText("");
        setInvalid(false);
      }, 0);
      return true;
    }
    selectDay(d);
    return true;
  };

  const processMask = (masked: string) => {
    setText(masked);
    let nextInvalid = validatePartialMask(masked, format);
    const date = maskToCalendarDate(masked, format);
    if (date) {
      nextInvalid = !(isDateAllowed(date) && commitDate(date));
    }
    setInvalid(nextInvalid);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (config.readOnly) return;
    const raw = e.target.value;
    const sel = e.target.selectionStart ?? raw.length;
    pendingCursor.current = countDigits(raw.slice(0, sel));
    processMask(applyMask(raw, format));
  };

  const handleClear = () => {
    if (config.readOnly) return;
    setText("");
    setInvalid(false);
    clear();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleClear();
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      if (config.readOnly) return;
      e.preventDefault();
      const target = e.currentTarget;
      const pos = target.selectionStart ?? 0;
      const seed = controlled ?? getToday(config.timeZone);
      const step = stepSegment(
        text,
        format,
        pos,
        e.key === "ArrowUp" ? 1 : -1,
        seed,
      );
      if (!step) return;
      pendingRange.current = [step.selStart, step.selEnd];
      processMask(step.text);
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
      pendingCursor.current = countDigits(before);
      processMask(applyMask(before + after, format));
    }
  };

  const hasLabel =
    label !== null && label !== undefined && label !== "" && label !== false;
  // Default accessible name: span selections get per-bound registry labels
  // ("Start date" / "End date"), points get the generic `manualInput` key.
  // No Intl API ships these strings — the registry (overridable per root via
  // `labels`) is the localization path.
  const defaultLabelKey =
    selection.shape === "span"
      ? bound === "to"
        ? "rangeTo"
        : "rangeFrom"
      : "manualInput";
  const ariaLabel = hasLabel
    ? undefined
    : t(defaultLabelKey, undefined, inputLabel);

  return (
    <div
      data-dateforge-manual-input=""
      data-area="manual-input"
      data-theme={theme}
      data-scheme={scheme}
      className={[styles.container, className].filter(Boolean).join(" ")}
      style={{
        ...getGridSlotStyle(col),
        alignItems: ALIGN_TO_JUSTIFY[align],
      }}
    >
      {hasLabel && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <span className={styles.inputWrap}>
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
          disabled={capReached}
          aria-invalid={invalid || undefined}
          aria-label={ariaLabel}
        />
        {allowClear && text !== "" && !config.readOnly && (
          <UIButton
            variant="ghost"
            size="sm"
            className={styles.clearBtn}
            aria-label={t("clear", undefined, clearLabel)}
            onClick={handleClear}
          >
            <ClearIcon size={11} />
          </UIButton>
        )}
      </span>
    </div>
  );
}
