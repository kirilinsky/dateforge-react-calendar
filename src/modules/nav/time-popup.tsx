import { useRef, useState } from "react";
import { Popup } from "@/components/popup/popup";
import { TimeTrack } from "@/components/time-track/time-track";

interface TimePopupProps {
  date: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  hour12?: boolean;
  showSeconds?: boolean;
  readOnly?: boolean;
}

export const TimePopup = ({
  date,
  onConfirm,
  onClose,
  hour12 = false,
  showSeconds = false,
  readOnly = false,
}: TimePopupProps) => {
  const [current, setCurrent] = useState(date);
  const currentRef = useRef(current);

  const handleChange = (newDate: Date) => {
    currentRef.current = newDate;
    setCurrent(newDate);
  };

  return (
    <Popup
      label="Select time"
      onConfirm={() => onConfirm(currentRef.current)}
      onClose={onClose}
    >
      <TimeTrack
        date={current}
        hour12={hour12}
        showSeconds={showSeconds}
        readOnly={readOnly}
        onChange={handleChange}
      />
    </Popup>
  );
};
