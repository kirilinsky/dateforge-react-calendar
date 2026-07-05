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
export { type CalendarDate, calendarDate } from "../core/calendar-date";
export type { DateRuleReason } from "../core/date-rule-engine";
// ── Disabled / exclude rules ──────────────────────────────────────────────────
// `compileDateRules` is the engine; `createDisabled` is its v2-familiar name.
export {
  compileDateRules,
  compileDateRules as createDisabled,
  type DateRuleConfig,
  type DateRuleDayInput,
  type DateRuleRangeInput,
} from "../core/date-rule-engine";
export type {
  EvaluatedPreset,
  PresetStatus,
  PresetValidationContext,
} from "../core/preset-engine";
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
} from "../core/preset-engine";
export type {
  AnyCalendarValue,
  CalendarChangeDetails,
  CalendarValue,
  ChangeReason,
} from "../core/public-value";
export type { SelectionMode, SelectionUnit } from "../core/selection-types";
export type { CalendarConfig } from "../core/state";
export type {
  AmbiguousTimePolicy,
  NonexistentTimePolicy,
} from "../core/timezone-boundary";
// ── Validation (what `onValidationReject` hands you) ─────────────────────────
export {
  type BuiltInValidationScope,
  customScope,
  type ValidationReason,
  type ValidationResult,
  type ValidationScope,
} from "../core/validation";
export { useToday } from "../hooks/use-today";
// ── Appearances (shape/spacing, non-color) ────────────────────────────────────
export {
  type AppearanceTokens,
  type CalendarAppearance,
  type CustomAppearance,
  createAppearance,
  isCustomAppearance,
} from "../styles/appearance-tokens";
// ── Themes (colors) ───────────────────────────────────────────────────────────
export {
  createTheme,
  type ThemeFamily,
  type ThemeFamilyInput,
  type ThemeMode,
  type ThemeTokens,
} from "../styles/theme-tokens";
// ── Shell ────────────────────────────────────────────────────────────────────
export { Calendar, type CalendarProps } from "./calendar";
// ── Config factory (the ergonomic way to build `config`) ─────────────────────
export {
  type CalendarConfigOptions,
  createCalendarConfig,
} from "./config";
