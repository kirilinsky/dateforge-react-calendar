import type React from "react";
import { useEffect, useState } from "react";
import { Check, Clear } from "@/Icons";
import { isSameDay } from "@/utils/date-core";
import { dateToMask } from "@/utils/date-mask";
import styles from "./manual-input.module.css";
import { MaskedDateInput } from "./masked-date-input";

interface DateSlotProps {
  date: Date | null;
  isAllowed: (d: Date) => boolean;
  applyLabel: string;
  clearLabel: string;
  removeLabel: string;
  onSave: (d: Date) => void;
  onClear?: () => void;
  onRemove?: () => void;
  placeholder?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  readOnly?: boolean;
}

export const DateSlot: React.FC<DateSlotProps> = ({
  date,
  isAllowed,
  applyLabel,
  clearLabel,
  removeLabel,
  onSave,
  onClear,
  onRemove,
  placeholder = "DD.MM.YYYY",
  isEditing,
  onEditStart,
  readOnly,
}) => {
  const [editing, setEditing] = useState(() => !date);
  const [inputInitialDate, setInputInitialDate] = useState<Date | null>(null);
  const [typedDate, setTypedDate] = useState<Date | null>(null);
  const [hasText, setHasText] = useState(false);
  const [wrapperInvalid, setWrapperInvalid] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    if (!date) {
      setEditing(true);
      setInputInitialDate(null);
      setTypedDate(null);
      setHasText(false);
      setInputKey((k) => k + 1);
      setWrapperInvalid(false);
    } else {
      setEditing(false);
      setInputInitialDate(null);
      setTypedDate(null);
      setHasText(false);
      setWrapperInvalid(false);
    }
  }, [date]);

  useEffect(() => {
    if (isEditing === undefined) return;
    if (isEditing && date) {
      setEditing(true);
      setInputInitialDate(date);
      setTypedDate(date);
      setHasText(true);
      setInputKey((k) => k + 1);
      setWrapperInvalid(false);
    } else if (!isEditing && date) {
      setEditing(false);
      setInputInitialDate(null);
      setTypedDate(null);
      setHasText(false);
      setWrapperInvalid(false);
    }
  }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterEditMode = () => {
    if (readOnly) return;
    if (onEditStart) {
      onEditStart();
    } else {
      setEditing(true);
      setInputInitialDate(date);
      setTypedDate(date);
      setHasText(true);
      setInputKey((k) => k + 1);
      setWrapperInvalid(false);
    }
  };

  const handleClearInput = () => {
    if (readOnly) return;
    setTypedDate(null);
    setHasText(false);
    setWrapperInvalid(false);
    setInputInitialDate(null);
    setInputKey((k) => k + 1);
    onClear?.();
  };

  const handleSave = () => {
    if (readOnly) return;
    if (!typedDate || !isAllowed(typedDate)) return;
    if (date && isSameDay(date, typedDate)) {
      setEditing(false);
      setInputInitialDate(null);
      setTypedDate(null);
      setHasText(false);
      return;
    }
    onSave(typedDate);
    setEditing(false);
    setInputInitialDate(null);
    setTypedDate(null);
    setHasText(false);
  };

  if (!editing && date) {
    return (
      <span className={styles.chipWrapper}>
        <button
          type="button"
          className={styles.chip}
          onClick={enterEditMode}
          disabled={readOnly}
        >
          {dateToMask(date)}
        </button>
        {onRemove && (
          <button
            type="button"
            className={styles.chipRemove}
            onClick={onRemove}
            aria-label={removeLabel}
            disabled={readOnly}
          >
            <Clear />
          </button>
        )}
      </span>
    );
  }

  const saveAllowed = !!typedDate && isAllowed(typedDate);

  return (
    <div
      className={[
        styles.inputWrapper,
        wrapperInvalid && styles.inputWrapperInvalid,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {hasText && (
        <button
          type="button"
          aria-label={clearLabel}
          className={`${styles.saveBtn} ${styles.saveBtnMuted} ${styles.saveBtnLeft}`}
          onClick={handleClearInput}
          disabled={readOnly}
        >
          <Clear />
        </button>
      )}
      <MaskedDateInput
        key={inputKey}
        isDateAllowed={isAllowed}
        className={styles.inputBare}
        value={inputInitialDate}
        onChange={() => {}}
        onTyped={setTypedDate}
        onHasText={setHasText}
        onValidityChange={setWrapperInvalid}
        onEnter={handleSave}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      {hasText && (
        <button
          type="button"
          aria-label={applyLabel}
          className={[styles.saveBtn, !saveAllowed && styles.saveBtnInvalid]
            .filter(Boolean)
            .join(" ")}
          onClick={handleSave}
          disabled={readOnly}
        >
          <Check />
        </button>
      )}
    </div>
  );
};
