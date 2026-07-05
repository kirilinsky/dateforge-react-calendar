import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Ephemeral UI state that is NOT selection — which transient popup is open and
 * what anchors it. Kept OUT of the reducer (per the v3 plan): popups are view
 * concerns, never serialized, never part of `onChange`. Lives in its own context
 * so opening a month picker doesn't churn selection subscribers.
 */
export type PopupKind = "month" | "year" | "time";

/** Light/dark choice. `"auto"` follows the OS via `prefers-color-scheme`. */
export type SchemeMode = "light" | "dark" | "auto";

export type UIContextValue = {
  popup: PopupKind | null;
  anchor: HTMLElement | null;
  isOpen: (kind: PopupKind) => boolean;
  open: (kind: PopupKind, anchor: HTMLElement) => void;
  close: () => void;
  toggle: (kind: PopupKind, anchor: HTMLElement) => void;
  /** Active scheme on the root (`data-scheme`); `"auto"` defers to the OS. */
  scheme: SchemeMode;
  /** Flip light↔dark, resolving `"auto"` against the OS at flip time. */
  toggleScheme: () => void;
};

const UIContext = createContext<UIContextValue | null>(null);

const noop = () => {};

export function UIProvider({
  scheme = "auto",
  toggleScheme = noop,
  children,
}: {
  scheme?: SchemeMode;
  toggleScheme?: () => void;
  children: ReactNode;
}) {
  const [popup, setPopup] = useState<PopupKind | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  const value = useMemo<UIContextValue>(
    () => ({
      popup,
      anchor,
      isOpen: (kind) => popup === kind,
      open: (kind, el) => {
        setPopup(kind);
        setAnchor(el);
      },
      close: () => {
        setPopup(null);
        setAnchor(null);
      },
      toggle: (kind, el) => {
        if (popup === kind) {
          setPopup(null);
          setAnchor(null);
        } else {
          setPopup(kind);
          setAnchor(el);
        }
      },
      scheme,
      toggleScheme,
    }),
    [popup, anchor, scheme, toggleScheme],
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/** Popup UI state for the nearest provider. Throws when used outside one. */
export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error("useUI must be used within a CalendarProvider");
  return ctx;
}
