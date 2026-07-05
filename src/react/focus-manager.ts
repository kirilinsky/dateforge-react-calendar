import { type RefObject, useEffect, useRef } from "react";
import { type CalendarDate, dateKey } from "../core/calendar-date";

/**
 * Focus Manager (Phase F) — lean seam.
 *
 * Two focus concerns exist in v3:
 *
 * 1. **First focus** — should mounting the calendar move DOM focus into a day,
 *    and which one? Owned here, resolved from the root `initialFocus` prop and
 *    seeded into `interaction.focusDate` (the Days module DOM-focuses it). Seeding
 *    state instead of firing a mount effect keeps this StrictMode-safe — no
 *    effect-time module registration, which can double-invoke in dev and is
 *    absent in SSR.
 *
 * 2. **Focus return** — popups restore focus to their trigger on close. Already
 *    owned by `CalendarPopup` (Escape + outside-close paths). No central wiring
 *    needed while popups are self-contained.
 *
 * DEFERRED (until a second focusable module competes for first focus, Phase I+):
 * the static per-module focus-priority registry. With Days as the only interactive
 * grid there is exactly one first-focus claimant, so a priority resolver would be
 * speculative infra. When Tracks/Wheels land, add ref-based priority claims here
 * (NOT effect-based registration) and resolve the highest priority.
 */

/**
 * Root `initialFocus` intent:
 * - `false` / omitted — do NOT steal focus on mount (default; a calendar
 *   rendered inline must not grab focus or scroll the page);
 * - `"view"` — focus the day at the current view anchor;
 * - a specific `CalendarDate` — focus that day.
 */
export type InitialFocus = CalendarDate | "view" | false;

/** Resolve the root `initialFocus` prop to the day to seed as the focus target. */
export function resolveInitialFocus(
  initialFocus: InitialFocus | undefined,
  viewDate: CalendarDate,
): CalendarDate | undefined {
  if (!initialFocus) return undefined;
  if (initialFocus === "view") return viewDate;
  return initialFocus;
}

/**
 * Owns the EXPLICIT first DOM focus, once on mount. Days deliberately refuses to
 * steal focus on mount (it only follows keyboard moves already inside the grid),
 * so when `initialFocus` is requested the manager performs the focus from the
 * root — bypassing that guard while keeping it intact for keyboard navigation.
 * Runs once: the resolved `target` is computed at mount and never re-focuses.
 */
export function useFirstFocus(
  rootRef: RefObject<HTMLElement | null>,
  target: CalendarDate | undefined,
): void {
  // Mount-only: re-running on target change would steal focus mid-use. The
  // ref/target are read lazily inside, so the empty dep list is intentional.
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !target) return;
    ran.current = true;
    rootRef.current
      ?.querySelector<HTMLElement>(`[data-date="${dateKey(target)}"]`)
      ?.focus();
  });
}
