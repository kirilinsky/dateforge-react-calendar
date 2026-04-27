// TODO: split MaskedDateInput and DateSlot into separate files — three components in one file is getting hard to navigate
import type React from "react";
import { useEffect, useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { useGridSlot } from "@/hooks/use-grid-slot";
import { Check, Clear } from "@/Icons";
import { checkIsDateDisabled, isSameDay } from "@/utils/date-core";
import {
  applyMask,
  dateToMask,
  maskToDate,
  validatePartialMask,
} from "@/utils/date-mask";
import { type AlignValue, alignToJustify } from "@/utils/layout-utils";
import styles from "./manual-input.module.css";

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
  readOnly,
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

interface DateSlotProps {
  date: Date | null;
  isAllowed: (d: Date) => boolean;
  onSave: (d: Date) => void;
  onClear?: () => void;
  onRemove?: () => void;
  placeholder?: string;
  isEditing?: boolean;
  onEditStart?: () => void;
  readOnly?: boolean;
}

const DateSlot: React.FC<DateSlotProps> = ({
  date,
  isAllowed,
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
            aria-label="Remove"
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
          aria-label="Clear"
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
          aria-label="Apply"
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

export interface CalendarManualInputProps {
  allowClear?: boolean;
  align?: AlignValue;
  col?: number | string;
}

export const CalendarManualInput: React.FC<CalendarManualInputProps> = ({
  allowClear = true,
  align = "left",
  col,
}) => {
  const { range, multiselect, disabled, minDate, maxDate, readOnly } =
    useConfig();
  const { viewDate: date } = useNavigation();
  const { rangeStart, rangeEnd, selectedDates } = useSelectionValue();
  const { onChangeDate, onRangeSet, onDatesSet } = useSelectionActions();

  const withTime = (d: Date, ref?: Date): Date => {
    const src = ref ?? date;
    const result = new Date(d);
    result.setHours(
      src.getHours(),
      src.getMinutes(),
      src.getSeconds(),
      src.getMilliseconds(),
    );
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

  const gridSlot = useGridSlot(col);
  const containerStyle: React.CSSProperties = { ...gridSlot };
  const contentStyle: React.CSSProperties = {
    justifyContent: alignToJustify[align],
  };

  const clearBtn = (
    <button
      type="button"
      aria-label="Clear"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hoverable}`}
      onClick={() => {
        if (readOnly) return;
        if (range) {
          onRangeSet(null, null);
        } else {
          onChangeDate(null);
          setAddTypedDate(null);
          setAddHasText(false);
          setAddInputKey((k) => k + 1);
        }
      }}
      style={
        allowClear ? undefined : { visibility: "hidden", pointerEvents: "none" }
      }
      tabIndex={allowClear ? undefined : -1}
      aria-hidden={!allowClear}
      disabled={!hasValue || readOnly}
    >
      <Clear />
    </button>
  );

  if (multiselect) {
    const maxCount = typeof multiselect === "number" ? multiselect : Infinity;
    const canAddMore = selectedDates.length < maxCount;

    const handleAddSave = () => {
      if (readOnly) return;
      if (!addTypedDate || !isAllowed(addTypedDate)) return;
      onChangeDate(withTime(addTypedDate));
      setAddTypedDate(null);
      setAddHasText(false);
      setAddInputKey((k) => k + 1);
    };

    const addSaveAllowed = !!addTypedDate && isAllowed(addTypedDate);

    return (
      <div
        className={`${styles.container} ${styles.containerMulti}`}
        data-area="manual-input"
        style={containerStyle}
      >
        <div className={styles.datesArea} style={contentStyle}>
          {canAddMore && (
            <div
              className={[
                styles.inputWrapper,
                addWrapperInvalid && styles.inputWrapperInvalid,
              ]
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
                readOnly={readOnly}
              />
              {addHasText && (
                <button
                  type="button"
                  aria-label="Apply"
                  className={[
                    styles.saveBtn,
                    !addSaveAllowed && styles.saveBtnInvalid,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={handleAddSave}
                  disabled={readOnly}
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
                onDatesSet(
                  selectedDates.map((s, j) =>
                    j === i ? withTime(newDate, orig) : s,
                  ),
                );
                setEditingKey(null);
              }}
              onClear={() =>
                onDatesSet(selectedDates.filter((_, j) => j !== i))
              }
              onRemove={() =>
                onDatesSet(selectedDates.filter((_, j) => j !== i))
              }
              isEditing={editingKey === d.getTime()}
              onEditStart={() => setEditingKey(d.getTime())}
              readOnly={readOnly}
            />
          ))}
        </div>
        {clearBtn}
      </div>
    );
  }

  if (range) {
    return (
      <div
        className={styles.container}
        data-area="manual-input"
        style={containerStyle}
      >
        <div className={styles.contentArea} style={contentStyle}>
          <DateSlot
            date={rangeStart}
            isAllowed={isAllowed}
            onSave={(d) => onRangeSet(withTime(d), rangeEnd)}
            onClear={() => onRangeSet(null, rangeEnd)}
            placeholder="DD.MM.YYYY"
            readOnly={readOnly}
          />
          <span className={styles.sep}>—</span>
          <DateSlot
            date={rangeEnd}
            isAllowed={isAllowed}
            onSave={(d) => onRangeSet(rangeStart, withTime(d))}
            onClear={() => onRangeSet(rangeStart, null)}
            placeholder="DD.MM.YYYY"
            readOnly={readOnly}
          />
        </div>
        {clearBtn}
      </div>
    );
  }

  return (
    <div
      className={styles.container}
      data-area="manual-input"
      style={containerStyle}
    >
      <div className={styles.contentArea} style={contentStyle}>
        <DateSlot
          date={selectedDates[0] ?? null}
          isAllowed={isAllowed}
          onSave={(d) => onChangeDate(withTime(d))}
          onClear={() => onChangeDate(null)}
          readOnly={readOnly}
        />
      </div>
      {clearBtn}
    </div>
  );
};
