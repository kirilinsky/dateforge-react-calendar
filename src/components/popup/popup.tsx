import { useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ReactNode, CSSProperties } from "react";
import { Check } from "@/Icons";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useUI } from "@/context/ui-context";
import styles from "./popup.module.css";

export interface PopupProps {
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  label?: string;
}

export const Popup = ({ children, onConfirm, onClose, label = "Dialog" }: PopupProps) => {
  const { popupAnchorEl, setPopupAnchorEl, containerRef } = useUI();
  const backdropRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const [panelStyle, setPanelStyle] = useState<CSSProperties>({ opacity: 0 });
  const [direction, setDirection] = useState<"down" | "up">("down");

  useLayoutEffect(() => {
    const backdrop = backdropRef.current;
    const panel = popupRef.current;
    if (!backdrop || !panel) return;

    const bRect = backdrop.getBoundingClientRect();
    const panelH = panel.offsetHeight;
    const panelW = panel.offsetWidth;
    const GAP = 4;

    let top: number | undefined;
    let bottom: number | undefined;
    let left: number;
    let maxHeight: number;

    if (popupAnchorEl) {
      const aRect = popupAnchorEl.getBoundingClientRect();
      const spaceBelow = bRect.bottom - aRect.bottom - GAP;
      const spaceAbove = aRect.top - bRect.top - GAP;
      const goUp = spaceBelow < panelH && spaceAbove > spaceBelow;

      left = Math.max(GAP, Math.min(aRect.left - bRect.left, bRect.width - panelW - GAP));

      if (goUp) {
        bottom = bRect.bottom - aRect.top + GAP;
        maxHeight = Math.max(0, spaceAbove);
        setDirection("up");
      } else {
        top = aRect.bottom - bRect.top + GAP;
        maxHeight = Math.max(0, spaceBelow);
        setDirection("down");
      }
    } else {
      top = GAP;
      left = GAP;
      maxHeight = Math.max(0, bRect.height - GAP * 2);
      setDirection("down");
    }

    setPanelStyle({ top, bottom, left, maxHeight, opacity: 1 });
  }, [popupAnchorEl]);

  useFocusTrap(popupRef, { onEscape: handleClose });

  function handleClose() {
    setPopupAnchorEl(null);
    onClose();
  }

  const content = (
    <div ref={backdropRef} className={styles.backdrop} onClick={handleClose}>
      <div
        ref={popupRef}
        className={styles.popup}
        data-direction={direction}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button
          type="button"
          className={styles.confirm}
          aria-label="Confirm"
          onClick={onConfirm}
        >
          <Check />
        </button>
      </div>
    </div>
  );

  return containerRef.current
    ? createPortal(content, containerRef.current)
    : content;
};
