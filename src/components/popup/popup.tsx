import { useRef } from "react";
import type { ReactNode } from "react";
import { Check } from "@/Icons";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import styles from "./popup.module.css";

export interface PopupProps {
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  label?: string;
}

export const Popup = ({ children, onConfirm, onClose, label = "Dialog" }: PopupProps) => {
  const popupRef = useRef<HTMLDivElement>(null);
  useFocusTrap(popupRef, { onEscape: onClose });

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        ref={popupRef}
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          className={styles.confirm}
          aria-label="Confirm"
          onClick={onConfirm}
        >
          <Check />
        </button>
      </div>
    </div>
  );
};
