import { useRef, useState } from "react";
import { Popup } from "@/components/popup/popup";
import { TimeTrack } from "@/components/time-track/time-track";
import { useConfig } from "@/context/config-context";
import type { CalendarTheme } from "@/types/themes";

interface TimePopupProps {
  date: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  hour12?: boolean;
  showSeconds?: boolean;
  readOnly?: boolean;
  confirmLabel?: string;
  hoursLabel?: string;
  label?: string;
  minutesLabel?: string;
  secondsLabel?: string;
  timePeriodLabel?: string;
  timePickerLabel?: string;
  theme?: CalendarTheme;
}

export const TimePopup = ({
  date,
  onConfirm,
  onClose,
  hour12 = false,
  showSeconds = false,
  readOnly = false,
  confirmLabel,
  hoursLabel,
  label = "Select time",
  minutesLabel,
  secondsLabel,
  timePeriodLabel,
  timePickerLabel,
  theme,
}: TimePopupProps) => {
  const { locale, timeStep } = useConfig();
  const [current, setCurrent] = useState(date);
  const currentRef = useRef(current);

  const handleChange = (newDate: Date): undefined => {
    currentRef.current = newDate;
    setCurrent(newDate);
    return undefined;
  };

  return (
    <Popup
      label={label}
      confirmLabel={confirmLabel}
      theme={theme}
      onConfirm={() => onConfirm(currentRef.current)}
      onClose={onClose}
    >
      <TimeTrack
        date={current}
        hour12={hour12}
        locale={locale}
        showSeconds={showSeconds}
        readOnly={readOnly}
        step={timeStep}
        hoursLabel={hoursLabel}
        minutesLabel={minutesLabel}
        secondsLabel={secondsLabel}
        timePeriodLabel={timePeriodLabel}
        timePickerLabel={timePickerLabel}
        onChange={handleChange}
      />
    </Popup>
  );
};
