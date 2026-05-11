import type React from "react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import {
  applyMask,
  dateToMask,
  maskToDate,
  validatePartialMask,
} from "@/utils/date-mask";

interface MaskedDateInputProps {
  value: Date | null;
  onChange: (d: Date | null) => void;
  onTyped?: (d: Date | null) => void;
  onHasText?: (v: boolean) => void;
  onValidityChange?: (invalid: boolean) => void;
  onEnter?: () => void;
  isDateAllowed: (d: Date) => boolean;
  className?: string;
  classNameInvalid?: string;
  placeholder?: string;
  readOnly?: boolean;
}

const countDigits = (s: string) => (s.match(/\d/g) ?? []).length;

// Position right after the Nth digit in the masked string. N=0 → start.
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

export const MaskedDateInput: React.FC<MaskedDateInputProps> = ({
  value,
  onChange,
  onTyped,
  onHasText,
  onValidityChange,
  onEnter,
  isDateAllowed,
  className,
  classNameInvalid,
  placeholder = "DD.MM.YYYY",
  readOnly,
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCursor = useRef<number | null>(null);
  const [text, setText] = useState(() => dateToMask(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(dateToMask(value));
    setInvalid(false);
    onValidityChange?.(false);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Restore caret to the digit-equivalent position after each render.
  // The controlled re-render otherwise snaps it to the end of the input,
  // which makes mid-string edits unusable.
  useLayoutEffect(() => {
    if (pendingCursor.current === null || !inputRef.current) return;
    const pos = positionAfterNDigits(text, pendingCursor.current);
    inputRef.current.setSelectionRange(pos, pos);
    pendingCursor.current = null;
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const sel = e.target.selectionStart ?? raw.length;
    pendingCursor.current = countDigits(raw.slice(0, sel));

    const masked = applyMask(raw);
    setText(masked);
    onHasText?.(masked.length > 0);

    let nextInvalid = validatePartialMask(masked);
    const date = maskToDate(masked);

    if (date) {
      onTyped?.(date);
      if (isDateAllowed(date)) {
        nextInvalid = false;
        onChange(date);
      } else {
        nextInvalid = true;
      }
    } else {
      onTyped?.(null);
    }

    setInvalid(nextInvalid);
    onValidityChange?.(nextInvalid);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setText("");
      onHasText?.(false);
      onTyped?.(null);
      onValidityChange?.(false);
      setInvalid(false);
      return;
    }
    // Backspace immediately after a separator → step over the separator
    // and delete the digit before it, so mid-string editing feels natural.
    const target = e.currentTarget;
    const sel = target.selectionStart ?? 0;
    const selEnd = target.selectionEnd ?? sel;
    if (
      e.key === "Backspace" &&
      sel === selEnd &&
      sel > 0 &&
      text[sel - 1] === "."
    ) {
      e.preventDefault();
      const before = text.slice(0, sel - 2);
      const after = text.slice(sel);
      const merged = before + after;
      pendingCursor.current = countDigits(before);
      const masked = applyMask(merged);
      setText(masked);
      onHasText?.(masked.length > 0);
      let nextInvalid = validatePartialMask(masked);
      const date = maskToDate(masked);
      if (date && isDateAllowed(date)) {
        nextInvalid = false;
        onChange(date);
      } else if (date) {
        nextInvalid = true;
      } else {
        onTyped?.(null);
      }
      setInvalid(nextInvalid);
      onValidityChange?.(nextInvalid);
    }
  };

  return (
    <input
      id={inputId}
      ref={inputRef}
      type="text"
      inputMode="numeric"
      className={[className, invalid && classNameInvalid]
        .filter(Boolean)
        .join(" ")}
      value={text}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      readOnly={readOnly}
    />
  );
};
