import { useState, useRef } from "react";
import { TimeTrack } from "@/components/time-track/time-track";
import { Popup } from "@/components/popup/popup";

interface TimePopupProps {
  date: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  hour12?: boolean;
  showSeconds?: boolean;
}

export const TimePopup = ({
  date,
  onConfirm,
  onClose,
  hour12 = false,
  showSeconds = false,
}: TimePopupProps) => {
  const [current, setCurrent] = useState(date);
  const currentRef = useRef(current);

  const handleChange = (newDate: Date) => {
    currentRef.current = newDate;
    setCurrent(newDate);
  };

  return (
    <Popup label="Select time" onConfirm={() => onConfirm(currentRef.current)} onClose={onClose}>
      <TimeTrack date={current} hour12={hour12} showSeconds={showSeconds} onChange={handleChange} />
    </Popup>
  );
};
