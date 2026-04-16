import { useState, useRef, useEffect } from "react";
import styles from "./time-popup.module.css";
import { TimeTrack } from "../time-track/time-track";
import type { ReactNode } from "react";

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface PopupProps {
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export const Popup = ({ children, onConfirm, onClose }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement;

    const el = popupRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE);
    focusable[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const nodes = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      (triggerRef.current as HTMLElement | null)?.focus();
    };
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={popupRef}
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-label="Select time"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          className={styles.confirm}
          aria-label="Confirm time"
          onClick={onConfirm}
        >
          ✓
        </button>
      </div>
    </div>
  );
};

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
  const currentRef = useRef(current);

  const handleChange = (newDate: Date) => {
    currentRef.current = newDate;
    setCurrent(newDate);
  };

  return (
    <Popup onConfirm={() => onConfirm(currentRef.current)} onClose={onClose}>
      <TimeTrack date={current} hour12={hour12} gestures={gestures} onChange={handleChange} />
    </Popup>
  );
};
