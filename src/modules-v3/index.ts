/**
 * `@dateforge/react-calendar/modules` — the composable module surface (v3).
 *
 * Mirrors the v2 modules barrel: each module is also its OWN subpath export
 * (`@dateforge/react-calendar/modules/days`, …) so a consumer pulls only the
 * bundles it uses. Importing from here pulls them all; prefer the subpaths for
 * tree-shaking. Pulls the layer cascade once so module styles resolve even when
 * a consumer renders a module without the root shell.
 */
import "../styles-v3/layers.css";

export { CalendarDays, type CalendarDaysProps } from "./days/CalendarDays";
export {
  CalendarDaysTrack,
  type CalendarDaysTrackProps,
} from "./days-track/CalendarDaysTrack";
export { CalendarInfo, type CalendarInfoProps } from "./info/CalendarInfo";
export { CalendarLunar, type CalendarLunarProps } from "./lunar/CalendarLunar";
export {
  CalendarManualInput,
  type CalendarManualInputProps,
} from "./manual-input/CalendarManualInput";
export {
  CalendarMonthsGrid,
  type CalendarMonthsGridProps,
} from "./months-grid/CalendarMonthsGrid";
export {
  CalendarMonthsTrack,
  type CalendarMonthsTrackProps,
} from "./months-track/CalendarMonthsTrack";
export {
  CalendarMonthsWheel,
  type CalendarMonthsWheelProps,
} from "./months-wheel/CalendarMonthsWheel";
export {
  CalendarPresets,
  type CalendarPresetsProps,
} from "./presets/CalendarPresets";
export {
  CalendarSelectedDates,
  type CalendarSelectedDatesProps,
} from "./selected-dates/CalendarSelectedDates";
export {
  CalendarTimeWheel,
  type CalendarTimeWheelProps,
} from "./time/CalendarTimeWheel";
// Toolbar — the composable nav primitives (the v3 stand-in for `<CalendarNav>`).
// Also its own subpath: `@dateforge/react-calendar/modules/toolbar`.
export * from "./toolbar/CalendarToolbar";
export {
  CalendarYearsGrid,
  type CalendarYearsGridProps,
} from "./years-grid/CalendarYearsGrid";
export {
  CalendarYearsTrack,
  type CalendarYearsTrackProps,
} from "./years-track/CalendarYearsTrack";
export {
  CalendarYearsWheel,
  type CalendarYearsWheelProps,
} from "./years-wheel/CalendarYearsWheel";
