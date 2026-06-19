/**
 * `@dateforge/react-calendar/context` — the v3 context hooks for composing
 * custom modules. Unlike v2's split `useConfig`/`useNavigation`/`useSelection`,
 * v3 exposes a single store (`useCalendarStore`, read with a selector) plus an
 * actions hook (`useCalendarActions`); `useUI` / `useLabels` cover popup state
 * and the aria-label registry.
 */

export { useLabels } from "./labels-context";
export {
  type CalendarActions,
  useCalendarActions,
  useCalendarStore,
} from "./provider";
export type { CalendarStore } from "./store";
export { type SchemeMode, useUI } from "./ui-context";
export { useStoreSelector } from "./use-store-selector";
