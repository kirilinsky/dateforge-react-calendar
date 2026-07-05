/**
 * `@dateforge/react-calendar/context` — the v3 context hooks for composing
 * custom modules. Unlike v2's split `useConfig`/`useNavigation`/`useSelection`,
 * v3 exposes a single store (`useCalendarStore`, read with a selector) plus an
 * actions hook (`useCalendarActions`); `useUI` / `useLabels` cover popup state
 * and the aria-label registry.
 */

// State/action shapes — what `useStoreSelector` selectors receive and what the
// store dispatches; custom modules type against these.
export type {
  CalendarAction,
  CalendarActionType,
} from "../core/actions";
export type {
  CalendarState,
  InteractionState,
  PointSelection,
  SelectionState,
  SpanSelection,
  ViewState,
} from "../core/state";
export { useLabels } from "./labels-context";
export {
  type CalendarActions,
  useCalendarActions,
  useCalendarStore,
} from "./provider";
export type { CalendarStore } from "./store";
export { type SchemeMode, useUI } from "./ui-context";
export { useStoreSelector } from "./use-store-selector";
