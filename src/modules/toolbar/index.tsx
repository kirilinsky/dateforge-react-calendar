import type React from "react";
import { useCallback, useMemo, useState } from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useNavigation } from "@/context/navigation-context";
import { useSelectionValue } from "@/context/selection-context";
import { useUI } from "@/context/ui-context";
import { useBoundDateView } from "@/hooks/use-bound-date-view";
import type { CalendarTheme } from "@/types/themes";
import {
  DEFAULT_CALENDAR_NAVIGATION_LABEL,
  resolveActionLabel,
} from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { resolveThemeScope } from "@/utils/resolve-theme-scope";
import { runViewTransition } from "@/utils/view-transition";
import styles from "./toolbar.module.css";
import type { ToolbarContextValue } from "./toolbar-context";
import { ToolbarContext } from "./toolbar-context";

export interface CalendarToolbarProps {
  /** Number of equal columns, or a raw CSS grid-template-columns string. */
  cols?: number | string;
  /** Placement in the parent Calendar grid (same as other modules). */
  col?: number | string;
  /** CSS justify-content for the toolbar row/grid. */
  justify?: React.CSSProperties["justifyContent"];
  /** Accessible label for the toolbar landmark. */
  label?: string;
  /** Accessible label override matching the root action label naming. */
  calendarNavigationLabel?: string;
  theme?: CalendarTheme;
  bound?: "from" | "to";
  /** Month offset relative to viewDate. */
  offset?: number;
  children?: React.ReactNode;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  cols,
  col,
  justify,
  label,
  calendarNavigationLabel,
  theme,
  bound,
  offset = 0,
  children,
}) => {
  const { actionLabels, motion, range } = useConfig();
  const { viewDate } = useNavigation();
  const { rangeStart, rangeEnd } = useSelectionValue();
  const { activeTheme } = useUI();

  const { isBound, boundDate, refDate, setLocalView } = useBoundDateView({
    bound,
    range,
    rangeStart,
    rangeEnd,
    viewDate,
  });

  const date = useMemo(() => {
    const raw = isBound ? refDate : viewDate;
    if (!offset) return raw;
    return new Date(
      raw.getFullYear(),
      raw.getMonth() + offset,
      1,
      raw.getHours(),
      raw.getMinutes(),
      raw.getSeconds(),
      raw.getMilliseconds(),
    );
  }, [isBound, refDate, viewDate, offset]);

  const [timePopupOpen, setTimePopupOpen] = useState(false);
  const [monthPopupOpen, setMonthPopupOpen] = useState(false);
  const [yearPopupOpen, setYearPopupOpen] = useState(false);
  const transitionEnabled = motion === "view-transition";

  const setToolbarTimePopupOpen = useCallback(
    (next: boolean) => {
      runViewTransition(transitionEnabled, () => setTimePopupOpen(next));
    },
    [transitionEnabled],
  );
  const setToolbarMonthPopupOpen = useCallback(
    (next: boolean) => {
      runViewTransition(transitionEnabled, () => setMonthPopupOpen(next));
    },
    [transitionEnabled],
  );
  const setToolbarYearPopupOpen = useCallback(
    (next: boolean) => {
      runViewTransition(transitionEnabled, () => setYearPopupOpen(next));
    },
    [transitionEnabled],
  );

  const themeScope = resolveThemeScope(theme, activeTheme);
  const resolvedLabel = resolveActionLabel(
    label ?? calendarNavigationLabel,
    actionLabels.calendarNavigationLabel,
    DEFAULT_CALENDAR_NAVIGATION_LABEL,
  );

  const gridTemplateColumns = useMemo(() => {
    if (cols === undefined) return undefined;
    if (typeof cols === "number") return `repeat(${cols}, minmax(0, 1fr))`;
    return cols;
  }, [cols]);

  const ctx = useMemo<ToolbarContextValue>(
    () => ({
      bound,
      offset,
      date,
      isBound,
      boundDate,
      setLocalView,
      timePopupOpen,
      monthPopupOpen,
      yearPopupOpen,
      setTimePopupOpen: setToolbarTimePopupOpen,
      setMonthPopupOpen: setToolbarMonthPopupOpen,
      setYearPopupOpen: setToolbarYearPopupOpen,
    }),
    [
      bound,
      offset,
      date,
      isBound,
      boundDate,
      setLocalView,
      timePopupOpen,
      monthPopupOpen,
      yearPopupOpen,
      setToolbarTimePopupOpen,
      setToolbarMonthPopupOpen,
      setToolbarYearPopupOpen,
    ],
  );

  return (
    <ToolbarContext.Provider value={ctx}>
      <div
        role="toolbar"
        aria-label={resolvedLabel}
        data-area="toolbar"
        data-cols={cols !== undefined || undefined}
        data-theme={themeScope.dataTheme}
        className={styles.toolbar}
        style={{
          ...getGridSlotStyle(col),
          ...themeScope.style,
          ...(gridTemplateColumns ? { gridTemplateColumns } : undefined),
          ...(justify ? { justifyContent: justify } : undefined),
        }}
      >
        {children}
      </div>
    </ToolbarContext.Provider>
  );
};

export { CalendarToolbarClear } from "./clear";
export { CalendarToolbarClock } from "./clock";
export { CalendarToolbarDayLabel } from "./day-label";
export { CalendarToolbarGroup } from "./group";
export { CalendarToolbarHome } from "./home";
export { CalendarToolbarLabel } from "./label";
export { CalendarToolbarMonthLabel } from "./month-label";
export { CalendarToolbarMonthTrigger } from "./month-trigger";
export { CalendarToolbarNext } from "./next";
export { CalendarToolbarPrev } from "./prev";
export { CalendarToolbarThemeToggle } from "./theme-toggle";
export { CalendarToolbarTime } from "./time";
export { CalendarToolbarYearLabel } from "./year-label";
export { CalendarToolbarYearTrigger } from "./year-trigger";
