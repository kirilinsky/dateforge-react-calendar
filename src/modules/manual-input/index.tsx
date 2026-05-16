import type React from "react";
import { useState } from "react";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import {
  useSelectionActions,
  useSelectionValue,
} from "@/context/selection-context";
import shared from "@/global/global.module.css";
import { Check, Clear } from "@/Icons";
import { checkIsDateDisabled } from "@/utils/date-core";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { type AlignValue, alignToJustify } from "@/utils/layout-utils";
import { DateSlot } from "./date-slot";
import styles from "./manual-input.module.css";
import { MaskedDateInput } from "./masked-date-input";

export interface CalendarManualInputProps {
  allowClear?: boolean;
  align?: AlignValue;
  col?: number | string;
  label?: React.ReactNode;
}

export const CalendarManualInput: React.FC<CalendarManualInputProps> = ({
  allowClear = true,
  align = "left",
  col,
  label,
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

  const gridSlot = getGridSlotStyle(col);
  const containerStyle: React.CSSProperties = { ...gridSlot };
  const contentStyle: React.CSSProperties = {
    justifyContent: alignToJustify[align],
  };
  const hasLabel =
    label !== null && label !== undefined && label !== "" && label !== false;
  const labelNode = hasLabel ? (
    <span className={styles.label}>{label}</span>
  ) : null;

  const clearBtn = (
    <button
      type="button"
      aria-label="Clear"
      className={`${styles.clearBtn} ${shared.interactive} ${shared.hovered}`}
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
          {labelNode}
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
          {labelNode}
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
        {labelNode}
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
