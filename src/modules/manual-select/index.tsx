import React, { useEffect, useState } from "react";
import styles from "./manual-select.module.css";
import shared from "@/global/global.module.css";
import { Check, Clear } from "@/Icons";
import { useConfig, useNavigation, useSelection } from "react-calendar-datetime";
import { checkIsDateDisabled, isSameDay } from "@/utils/date-core";

const dateToMask = (d: Date | null): string => {
  if (!d) return "";
  return [
    String(d.getDate()).padStart(2, "0"),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getFullYear()),
  ].join(".");
};

const maskToDate = (raw: string): Date | null => {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 8) return null;
  const d = parseInt(digits.slice(0, 2));
  const m = parseInt(digits.slice(2, 4));
  const y = parseInt(digits.slice(4, 8));
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1000) return null;
  return new Date(y, m - 1, d);
};

const applyMask = (raw: string): string => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

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
}

const MaskedDateInput: React.FC<MaskedDateInputProps> = ({
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
}) => {
  const [text, setText] = useState(() => dateToMask(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setText(dateToMask(value));
    setInvalid(false);
    onValidityChange?.(false);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyMask(e.target.value);
    setText(masked);
    onHasText?.(masked.length > 0);
    const date = maskToDate(masked);
    if (date) {
      onTyped?.(date);
      if (isDateAllowed(date)) {
        setInvalid(false);
        onValidityChange?.(false);
        onChange(date);
      } else {
        setInvalid(true);
        onValidityChange?.(true);
      }
    } else {
      onTyped?.(null);
      setInvalid(false);
      onValidityChange?.(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setText("");
      onHasText?.(false);
      onTyped?.(null);
      onValidityChange?.(false);
      setInvalid(false);
    } else if (e.key === "Backspace" && text.endsWith(".")) {
      e.preventDefault();
      setText((prev) => prev.slice(0, -1));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      className={[className, invalid && classNameInvalid].filter(Boolean).join(" ")}
      value={text}
      placeholder={placeholder}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
    />
  );
};

interface DateSlotProps {
  date: Date | null;
  isAllowed: (d: Date) => boolean;
  onSave: (d: Date) => void;
  onClear?: () => void;
  placeholder?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
}

const DateSlot: React.FC<DateSlotProps> = ({
  date,
  isAllowed,
  onSave,
  onClear,
  placeholder = "DD.MM.YYYY",
  isEditing,
  onEditStart,
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
    setTypedDate(null);
    setHasText(false);
    setWrapperInvalid(false);
    setInputInitialDate(null);
    setInputKey((k) => k + 1);
    onClear?.();
  };

  const handleSave = () => {
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
      <button type="button" className={styles.chip} onClick={enterEditMode}>
        {dateToMask(date)}
      </button>
    );
  }

  const saveAllowed = !!typedDate && isAllowed(typedDate);

  return (
    <div
      className={[styles.inputWrapper, wrapperInvalid && styles.inputWrapperInvalid]
        .filter(Boolean)
        .join(" ")}
    >
      {hasText && (
        <button
          type="button"
          className={`${styles.saveBtn} ${styles.saveBtnMuted} ${styles.saveBtnLeft}`}
          onClick={handleClearInput}
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
      />
      {hasText && (
        <button
          type="button"
          className={[styles.saveBtn, !saveAllowed && styles.saveBtnInvalid]
            .filter(Boolean)
            .join(" ")}
          onClick={handleSave}
        >
          <Check />
        </button>
      )}
    </div>
  );
};

interface CalendarManualSelectProps {
  allowClean?: boolean;
}

export const CalendarManualSelect: React.FC<CalendarManualSelectProps> = ({
  allowClean = true,
}) => {
  const { range, multiselect, disabled, minDate, maxDate } = useConfig();
  const { viewDate: date } = useNavigation();
  const { rangeStart, rangeEnd, selectedDates, onChangeDate, onRangeSet, onDatesSet } = useSelection();

  const withTime = (d: Date, ref?: Date): Date => {
    const src = ref ?? date;
    const result = new Date(d);
    result.setHours(src.getHours(), src.getMinutes(), src.getSeconds(), src.getMilliseconds());
    return result;
  };

  const [addTypedDate, setAddTypedDate] = useState<Date | null>(null);
  const [addHasText, setAddHasText] = useState(false);
  const [addInputKey, setAddInputKey] = useState(0);
  const [addWrapperInvalid, setAddWrapperInvalid] = useState(false);
  const [editingKey, setEditingKey] = useState<number | null>(null);

  const isAllowed = (d: Date): boolean =>
    !checkIsDateDisabled(d, minDate, maxDate, disabled);

  const hasValue = range ? !!rangeStart : !!selectedDates.length;

  const clearBtn = (
    <button
      type="button"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hoverable}`}
      onClick={() => {
        if (range) {
          onRangeSet(null, null);
        } else {
          onChangeDate(null);
          setAddTypedDate(null);
          setAddHasText(false);
          setAddInputKey((k) => k + 1);
        }
      }}
      style={allowClean ? undefined : { visibility: "hidden", pointerEvents: "none" }}
      tabIndex={allowClean ? undefined : -1}
      aria-hidden={!allowClean}
      disabled={!hasValue}
    >
      ×
    </button>
  );

  if (multiselect) {
    const maxCount = typeof multiselect === "number" ? multiselect : Infinity;
    const canAddMore = selectedDates.length < maxCount;

    const handleAddSave = () => {
      if (!addTypedDate || !isAllowed(addTypedDate)) return;
      onChangeDate(withTime(addTypedDate));
      setAddTypedDate(null);
      setAddHasText(false);
      setAddInputKey((k) => k + 1);
    };

    const addSaveAllowed = !!addTypedDate && isAllowed(addTypedDate);

    return (
      <div className={`${styles.container} ${styles.containerMulti}`} data-area="manual-select">
        <div className={styles.datesArea}>
          {canAddMore && (
            <div
              className={[styles.inputWrapper, addWrapperInvalid && styles.inputWrapperInvalid]
                .filter(Boolean)
                .join(" ")}
            >
              <MaskedDateInput
                key={addInputKey}
                isDateAllowed={isAllowed}
                className={styles.inputBare}
                value={null}
                onChange={() => {}}
                onTyped={setAddTypedDate}
                onHasText={setAddHasText}
                onValidityChange={setAddWrapperInvalid}
                onEnter={handleAddSave}
              />
              {addHasText && (
                <button
                  type="button"
                  className={[styles.saveBtn, !addSaveAllowed && styles.saveBtnInvalid]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={handleAddSave}
                >
                  <Check />
                </button>
              )}
            </div>
          )}
          {selectedDates.map((d, i) => (
            <DateSlot
              key={d.getTime()}
              date={d}
              isAllowed={isAllowed}
              onSave={(newDate) => {
                const orig = selectedDates[i];
                onDatesSet(selectedDates.map((s, j) => j === i ? withTime(newDate, orig) : s));
                setEditingKey(null);
              }}
              onClear={() => onDatesSet(selectedDates.filter((_, j) => j !== i))}
              isEditing={editingKey === d.getTime()}
              onEditStart={() => setEditingKey(d.getTime())}
            />
          ))}
        </div>
        {clearBtn}
      </div>
    );
  }

  if (range) {
    return (
      <div className={styles.container} data-area="manual-select">
        <DateSlot
          date={rangeStart}
          isAllowed={isAllowed}
          onSave={(d) => onRangeSet(withTime(d), rangeEnd)}
          onClear={() => onRangeSet(null, rangeEnd)}
          placeholder="DD.MM.YYYY"
        />
        <span className={styles.sep}>—</span>
        <DateSlot
          date={rangeEnd}
          isAllowed={isAllowed}
          onSave={(d) => onRangeSet(rangeStart, withTime(d))}
          onClear={() => onRangeSet(rangeStart, null)}
          placeholder="DD.MM.YYYY"
        />
        {clearBtn}
      </div>
    );
  }

  return (
    <div className={styles.container} data-area="manual-select">
      <DateSlot
        date={selectedDates[0] ?? null}
        isAllowed={isAllowed}
        onSave={(d) => onChangeDate(withTime(d))}
        onClear={() => onChangeDate(null)}
      />
      {clearBtn}
    </div>
  );
};
