import { useEffect, useRef, useState } from "react";
import type { CalendarDateTime } from "../core-v3/calendar-date-time";
import type { CalendarRange } from "../core-v3/calendar-range";
import type { CalendarConfig, SelectionState } from "../core-v3/state";
import { useLabels } from "./labels-context";
import { useCalendarStore } from "./provider";
import { useStoreSelector } from "./use-store-selector";

/**
 * Off-screen `role="status"` live region announcing committed selection
 * changes to screen readers (v2 parity): a picked date, a completed range, or
 * a cleared selection. Watches the store's committed selection — hover, focus
 * moves and the pending range anchor never produce identical committed text,
 * so they never chatter. Mounted once by the Calendar root, permanently (live
 * regions must exist before their first update to be picked up reliably).
 */

const HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  border: 0,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

function formatPoint(dt: CalendarDateTime, config: CalendarConfig): string {
  // Display-only formatting: the wall-clock parts are already in the calendar
  // zone, so a local Date carrying the same parts renders correctly.
  const d = new Date(
    dt.date.year,
    dt.date.month - 1,
    dt.date.day,
    dt.time.hour,
    dt.time.minute,
  );
  return new Intl.DateTimeFormat(config.locale, {
    dateStyle: "long",
    ...(config.withTime ? { timeStyle: "short" } : undefined),
  }).format(d);
}

function formatRange(r: CalendarRange, config: CalendarConfig): string {
  const fmt = new Intl.DateTimeFormat(config.locale, { dateStyle: "long" });
  const day = (d: { year: number; month: number; day: number }) =>
    fmt.format(new Date(d.year, d.month - 1, d.day));
  return `${day(r.start)} – ${day(r.end)}`;
}

/** The committed selection as human text; empty string when nothing is committed. */
function describeSelection(
  selection: SelectionState,
  config: CalendarConfig,
): string {
  if (selection.shape === "point") {
    return selection.dates.map((dt) => formatPoint(dt, config)).join(", ");
  }
  return selection.ranges.map((r) => formatRange(r, config)).join(", ");
}

export function CalendarAnnouncer() {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const selection = useStoreSelector(store, (s) => s.selection);

  const text = describeSelection(selection, config);
  const prev = useRef(text); // seeded with the mount value: no announce on mount
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (text === prev.current) return;
    const had = prev.current !== "";
    prev.current = text;
    setMessage(
      text
        ? t("announceSelected", { value: text })
        : had
          ? t("announceCleared")
          : "",
    );
  }, [text, t]);

  return (
    <span role="status" aria-live="polite" style={HIDDEN}>
      {message}
    </span>
  );
}
