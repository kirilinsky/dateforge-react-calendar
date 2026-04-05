import { useState } from "react";
import styles from "./time-popup.module.css";
import { TimeTrack } from "../time-track/time-track";
import type { ReactNode } from "react";

interface PopupProps {
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const Popup = ({ children, onConfirm, onClose }: PopupProps) => (
  <div className={styles.backdrop} onClick={onClose}>
    <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
      {children}
      <button className={styles.confirm} onClick={onConfirm}>
        ✓
      </button>
    </div>
  </div>
);

interface TimePopupProps {
  date: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
  hour12?: boolean;
  gestures?: boolean;
}

export const TimePopup = ({
  date,
  onConfirm,
  onClose,
  hour12 = false,
  gestures,
}: TimePopupProps) => {
  const [current, setCurrent] = useState(date);

  return (
    <Popup onConfirm={() => onConfirm(current)} onClose={onClose}>
      <TimeTrack date={current} hour12={hour12} gestures={gestures} onChange={setCurrent} />
    </Popup>
  );
};
