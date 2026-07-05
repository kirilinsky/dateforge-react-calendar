/**
 * `@dateforge/react-calendar` — v3 root entry.
 *
 * The shell (`Calendar`), the value-shaping helpers (themes, appearances,
 * disabled rules, presets) and the public types. Unlike v2's high-level prop
 * API, v3's `Calendar` takes a pre-compiled `config: CalendarConfig` — so the
 * config-building helpers (`createDisabled`, `calendarDate`, the preset packs)
 * are part of this surface. Modules live under `/modules`, context hooks under
 * `/context`, palettes under `/themes` + `/appearances`.
 */

// ── Core types (build a config, read the value) ───────────────────────────────
export { type CalendarDate, calendarDate } from "../core-v3/calendar-date";
export type { DateRuleReason } from "../core-v3/date-rule-engine";
// ── Disabled / exclude rules ──────────────────────────────────────────────────
// `compileDateRules` is the engine; `createDisabled` is its v2-familiar name.
export {
  compileDateRules,
  compileDateRules as createDisabled,
  type DateRuleConfig,
  type DateRuleDayInput,
  type DateRuleRangeInput,
} from "../core-v3/date-rule-engine";
export type {
  EvaluatedPreset,
  PresetStatus,
  PresetValidationContext,
} from "../core-v3/preset-engine";
// ── Presets ───────────────────────────────────────────────────────────────────
export {
  commonPresets,
  compilePresets,
  definePreset,
  type Preset,
  type PresetContext,
  type PresetInput,
  type PresetLabel,
  type PresetResult,
  presetLast7Days,
  presetLastMonth,
  presetLastWeek,
  presetLastYear,
  presetNextMonth,
  presetNextWeek,
  presetNextYear,
  presetThisMonth,
  presetThisWeek,
  presetToday,
  presetTomorrow,
  presetYesterday,
  relativePresets,
  resolvePresetLabel,
} from "../core-v3/preset-engine";
export type {
  AnyCalendarValue,
  CalendarChangeDetails,
  CalendarValue,
  ChangeReason,
} from "../core-v3/public-value";
export type { SelectionMode, SelectionUnit } from "../core-v3/selection-types";
export type { CalendarConfig } from "../core-v3/state";
export type {
  AmbiguousTimePolicy,
  NonexistentTimePolicy,
} from "../core-v3/timezone-boundary";
// ── Validation (what `onValidationReject` hands you) ─────────────────────────
export {
  type BuiltInValidationScope,
  customScope,
  type ValidationReason,
  type ValidationResult,
  type ValidationScope,
} from "../core-v3/validation";
export { useToday } from "../hooks/use-today";
// ── Appearances (shape/spacing, non-color) ────────────────────────────────────
export {
  type AppearanceTokens,
  type CalendarAppearance,
  type CustomAppearance,
  createAppearance,
  isCustomAppearance,
} from "../styles-v3/appearance-tokens";
// ── Themes (colors) ───────────────────────────────────────────────────────────
export {
  createTheme,
  type ThemeFamily,
  type ThemeFamilyInput,
  type ThemeMode,
  type ThemeTokens,
} from "../styles-v3/theme-tokens";
// ── Shell ────────────────────────────────────────────────────────────────────
export { Calendar, type CalendarProps } from "./calendar";
// ── Config factory (the ergonomic way to build `config`) ─────────────────────
export {
  type CalendarConfigOptions,
  createCalendarConfig,
} from "./config";
