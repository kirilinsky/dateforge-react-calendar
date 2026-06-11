import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useThemeScope } from "./theme-scope";

/**
 * A portalled popup anchored to a trigger. Rendered into `document.body` with
 * `position: fixed`, so it floats above everything and is NEVER clipped by a
 * short calendar container (the v2 bug where popups didn't fit). It flips above
 * the anchor when there's no room below, and clamps within the viewport.
 *
 * Closes on Escape and on a pointer-down outside both the popup and its anchor.
 * Re-declares `data-theme` / `data-scheme` (from theme-scope) so `--c-*` tokens
 * resolve even though it lives outside the root shell.
 */
export type CalendarPopupProps = {
  open: boolean;
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
  /** Accessible label for the dialog. */
  label?: string;
};

type Pos = { top: number; left: number; placement: "top" | "bottom" };

const GAP = 4;
const MARGIN = 8;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Tabbable descendants in DOM order. The selector already drops `[disabled]` and
 * `tabindex="-1"`; we don't filter by visibility because the popup content is
 * controlled (triggers, grid cells) and `offsetParent`-based checks are
 * unreliable across test DOMs.
 */
function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE));
}

export function CalendarPopup({
  open,
  anchor,
  onClose,
  children,
  label,
}: CalendarPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme, scheme } = useThemeScope();
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<Pos | null>(null);

  useEffect(() => setMounted(true), []);

  // Position against the anchor; flip up when below would overflow.
  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      const ph = el.offsetHeight;
      const pw = el.offsetWidth;
      const below = window.innerHeight - a.bottom;
      const flip = below < ph + GAP && a.top > below;
      const top = flip ? a.top - ph - GAP : a.bottom + GAP;
      const left = Math.max(
        MARGIN,
        Math.min(a.left, window.innerWidth - pw - MARGIN),
      );
      setPos({ top, left, placement: flip ? "top" : "bottom" });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchor]);

  // Focus the popup on open; restore focus to the anchor on close.
  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  // Escape + outside pointer close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        anchor?.focus();
        return;
      }
      if (e.key === "Tab") {
        const el = ref.current;
        if (!el) return;
        const items = focusableWithin(el);
        // Nothing tabbable inside: keep focus pinned on the dialog itself.
        if (items.length === 0) {
          e.preventDefault();
          el.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        // Wrap at the edges; treat the dialog container as "before first".
        if (e.shiftKey && (active === first || active === el)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, anchor, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      tabIndex={-1}
      data-dateforge-popup=""
      data-theme={theme}
      data-scheme={scheme}
      data-placement={pos?.placement}
      style={{
        position: "fixed",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        // Hidden until measured to avoid a flash at (0,0).
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
