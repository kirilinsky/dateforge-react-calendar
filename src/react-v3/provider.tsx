import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CalendarDate } from "../core-v3/calendar-date";
import type { CalendarTime } from "../core-v3/calendar-time";
import type { PresetResult } from "../core-v3/preset-engine";
import {
  type AnyCalendarValue,
  type CalendarChangeDetails,
  type ChangeReason,
  fromPublicValue,
  toPublicValue,
  toSegments,
  valueKey,
} from "../core-v3/public-value";
import {
  type CalendarConfig,
  createInitialState,
  type SelectionState,
} from "../core-v3/state";
import { today } from "../core-v3/timezone-boundary";
import type { ValidationResult } from "../core-v3/validation";
import { type InitialFocus, resolveInitialFocus } from "./focus-manager";
import { type CalendarStore, createCalendarStore } from "./store";

/**
 * Wires the pure store into the React tree and interprets the reducer's effects
 * as host side effects (the reducer itself never calls a user callback). The
 * store is created once and is referentially stable, so `useCalendarActions`
 * and every selector subscription stay stable across renders; user callbacks
 * are read through a latest-ref so changing `onChange` never rebuilds the store.
 */
export type CalendarProviderProps = {
  /** Compiled, static config (engines compiled, locale resolved). */
  config: CalendarConfig;
  /**
   * Controlled value. When provided (including `null` = empty), the host owns
   * the selection: changes are synced into the store and `onChange` reports the
   * host's intent. Omit (`undefined`) for uncontrolled use with `defaultSelection`.
   */
  value?: AnyCalendarValue;
  /** Seeded selection for uncontrolled use (defaultValue). */
  defaultSelection?: SelectionState;
  /** Initial view anchor. Defaults to today in the configured zone. */
  initialView?: CalendarDate;
  /**
   * Whether mounting moves DOM focus into a day, and which (Focus Manager).
   * `false`/omitted = don't steal focus (default); `"view"` = the view anchor;
   * a `CalendarDate` = that day.
   */
  initialFocus?: InitialFocus;
  /**
   * Committed selection changed. Receives the public `Date`-based value (logical
   * spans; shape fixed by `unit × mode`) and {@link CalendarChangeDetails} —
   * `segments` (business-day cut when `exclude`/`disabled` apply) and `reason`.
   */
  onChange?: (value: AnyCalendarValue, details: CalendarChangeDetails) => void;
  /** View anchor moved (prev/next, navigateTo). */
  onViewChange?: (viewDate: CalendarDate) => void;
  /** A transient action was rejected (disabled click, cap reached, crossing). */
  onValidationReject?: (result: ValidationResult) => void;
  children: ReactNode;
};

const StoreContext = createContext<CalendarStore | null>(null);

/** Map the committing action to the public `reason` carried in change details. */
function changeReason(actionType: string): ChangeReason {
  switch (actionType) {
    case "clear":
      return "clear";
    case "applyPreset":
      return "preset";
    case "setTime":
      return "time";
    case "removeDate":
    case "removeRange":
      return "remove";
    default:
      return "select";
  }
}

type Callbacks = Pick<
  CalendarProviderProps,
  "onChange" | "onViewChange" | "onValidationReject"
>;

export function CalendarProvider({
  config,
  value,
  defaultSelection,
  initialView,
  initialFocus,
  onChange,
  onViewChange,
  onValidationReject,
  children,
}: CalendarProviderProps) {
  // Latest-ref: the store reads current callbacks without being recreated.
  const callbacks = useRef<Callbacks>({});
  callbacks.current.onChange = onChange;
  callbacks.current.onViewChange = onViewChange;
  callbacks.current.onValidationReject = onValidationReject;

  const controlled = value !== undefined;

  const [store] = useState<CalendarStore>(() => {
    const view = initialView ?? today(config.timeZone);
    return createCalendarStore(
      config,
      createInitialState(config, {
        view,
        // Controlled mount seeds from `value`; otherwise from `defaultSelection`.
        selection: controlled
          ? fromPublicValue(value, config)
          : defaultSelection,
        // First focus is resolved once at mount (Focus Manager). Default: none.
        focus: resolveInitialFocus(initialFocus, view),
      }),
      (effect, state, action) => {
        const cb = callbacks.current;
        switch (effect.type) {
          case "notify":
            // Emit logical spans as the value (§2d); the segmented business-day
            // view rides in details.segments. Both derive from the committed
            // state selection — the single source of truth.
            cb.onChange?.(toPublicValue(state.selection, config), {
              segments: toSegments(state.selection, config),
              reason: changeReason(action.type),
            });
            break;
          case "viewChanged":
            cb.onViewChange?.(effect.viewDate);
            break;
          case "validationRejected":
            cb.onValidationReject?.(effect.result);
            break;
        }
      },
    );
  });

  // Controlled sync: when the host's value changes (by serialized identity, not
  // object reference), replace the store's selection without echoing onChange.
  const syncKey = controlled ? valueKey(value, config) : null;
  const firstSync = useRef(true);
  useEffect(() => {
    if (!controlled) return;
    // Mount already seeded the store from `value`; skip the first run.
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    store.dispatch({
      type: "syncExternal",
      selection: fromPublicValue(value, config),
    });
  }, [syncKey]);

  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
}

/** The store for the nearest `CalendarProvider`. Throws when used outside one. */
export function useCalendarStore(): CalendarStore {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useCalendarStore must be used within a CalendarProvider");
  }
  return store;
}

export type CalendarActions = {
  selectDay(date: CalendarDate): void;
  setTime(time: CalendarTime, bound?: "from" | "to"): void;
  setBoundDate(date: CalendarDate, bound: "from" | "to"): void;
  navigateTo(date: CalendarDate): void;
  navigateBy(step: "day" | "month" | "year", amount: number): void;
  hover(date?: CalendarDate): void;
  focus(date?: CalendarDate): void;
  clear(): void;
  applyPreset(result: PresetResult): void;
  removeDate(date: CalendarDate): void;
  removeRange(index: number): void;
};

/**
 * Stable action dispatchers for the current store. The store is referentially
 * stable, so this object is built once and never changes identity — safe to
 * pass to memoized children without churn.
 */
export function useCalendarActions(): CalendarActions {
  const store = useCalendarStore();
  return useMemo<CalendarActions>(
    () => ({
      selectDay: (date) => store.dispatch({ type: "selectDay", date }),
      setTime: (time, bound) =>
        store.dispatch({ type: "setTime", time, bound }),
      setBoundDate: (date, bound) =>
        store.dispatch({ type: "setBoundDate", date, bound }),
      navigateTo: (date) => store.dispatch({ type: "navigateTo", date }),
      navigateBy: (step, amount) =>
        store.dispatch({ type: "navigateBy", step, amount }),
      hover: (date) => store.dispatch({ type: "hover", date }),
      focus: (date) => store.dispatch({ type: "focus", date }),
      clear: () => store.dispatch({ type: "clear" }),
      applyPreset: (result) => store.dispatch({ type: "applyPreset", result }),
      removeDate: (date) => store.dispatch({ type: "removeDate", date }),
      removeRange: (index) => store.dispatch({ type: "removeRange", index }),
    }),
    [store],
  );
}
