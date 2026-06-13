/*
 * Built-in appearance objects. Import and pass as the `appearance` prop:
 *
 *   import { zenith } from "@dateforge/react-calendar/appearances";
 *   <Calendar appearance={zenith} />
 *
 * Each is a `createAppearance` token object (self-contained inline vars), so it
 * works without the `appearances.css` sheet. The string form
 * (`appearance="zenith"`) resolves the same values via that sheet's
 * `[data-appearance="<name>"]` rule instead. The token RECORDS below are the
 * single source for both; `appearances.css` mirrors them (a future generator
 * will emit the sheet from these, like the themes).
 *
 * Ported from the v2 appearance set; v2-only tokens with no v3 consumer yet
 * (track sizes, nav metrics, type scale) are dropped — they fold back in as the
 * modules adopt those vars.
 */
import { type AppearanceTokens, createAppearance } from "./appearance-tokens";

type Tokens = Partial<AppearanceTokens>;

/** v2-default look ported as an opt-in appearance. */
export const ZENITH_TOKENS: Tokens = {
  controlPadding: "0.3em 0.7em",
  controlBorder: "0px",
  controlWeight: "500",
  tilePadding: "0.4em 0.6em",
  radius: "0.5em",
  containerRadius: "0.8em",
  containerGap: "1px",
  daysGap: "0.15em",
  spacing: "0.6em",
  border: "1px",
  transition: "0.2s",
  shadowSm: "0 0.1em 0.3em var(--c-shadow)",
  shadowMd: "0 0.2em 0.6em var(--c-shadow)",
  shadowLg: "0 0.2em 0.8em var(--c-shadow)",
  font: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  opacityDisabled: "0.4",
  opacityMuted: "0.6",
  opacityHover: "0.8",
  letterSpacing: "0.01em",
};

export const AIRY_TOKENS: Tokens = {
  controlPadding: "0.5em 1em",
  controlBorder: "0px",
  controlWeight: "300",
  tilePadding: "0.6em 0.85em",
  radius: "0.4em",
  containerRadius: "0.6em",
  border: "1px",
  spacing: "1em",
  shadowSm: "none",
  shadowMd: "none",
  shadowLg: "none",
  fontSize: "clamp(13px, 3.2cqw, 20px)",
  dayFontSize: "clamp(0.9em, 5.2cqi, 1.4em)",
  transition: "0.2s",
  daysPadding: "1.2em",
  popupPadding: "1em",
  chipSize: "2em",
  opacityDisabled: "0.3",
  opacityMuted: "0.4",
  opacityHover: "0.75",
  letterSpacing: "0.1em",
};

export const BUBBLE_TOKENS: Tokens = {
  controlPadding: "0.5em 1.1em",
  controlBorder: "0px",
  controlWeight: "500",
  tilePadding: "0.55em 0.85em",
  radius: "1.5em",
  containerRadius: "2.2em",
  border: "1px",
  spacing: "0.7em",
  shadowSm: "0 0.15em 0.5em var(--c-shadow)",
  shadowMd: "0 0.25em 0.9em var(--c-shadow)",
  shadowLg: "0 0.35em 1.4em var(--c-shadow)",
  fontSize: "clamp(12px, 2.9cqw, 19px)",
  dayFontSize: "clamp(0.78em, 4.6cqi, 1.22em)",
  transition: "0.28s",
  daysPadding: "1em",
  popupPadding: "0.9em",
  chipSize: "2.4em",
  opacityDisabled: "0.45",
  opacityMuted: "0.65",
  opacityHover: "0.82",
};

export const COMPACT_TOKENS: Tokens = {
  controlPadding: "0.2em 0.45em",
  controlBorder: "1px",
  controlWeight: "500",
  tilePadding: "0.25em 0.4em",
  radius: "0.3em",
  border: "1px",
  spacing: "0.35em",
  shadowSm: "0 0.05em 0.15em var(--c-shadow)",
  shadowMd: "0 0.1em 0.3em var(--c-shadow)",
  shadowLg: "0 0.1em 0.4em var(--c-shadow)",
  fontSize: "clamp(11px, 2.3cqw, 15px)",
  dayFontSize: "clamp(0.68em, 4.2cqi, 1em)",
  transition: "0.15s",
  daysPadding: "0.45em",
  popupPadding: "0.5em",
  chipSize: "1.9em",
  opacityDisabled: "0.4",
  opacityMuted: "0.55",
  opacityHover: "0.75",
};

export const LOFT_TOKENS: Tokens = {
  controlPadding: "0.5em 0.95em",
  controlBorder: "0px",
  controlWeight: "600",
  tilePadding: "0.5em 0.75em",
  radius: "1em",
  containerRadius: "2.5em",
  border: "0px",
  spacing: "1em",
  shadowSm: "0 0.3em 0.9em var(--c-shadow)",
  shadowMd: "0 0.8em 2em var(--c-shadow)",
  shadowLg: "0 1.5em 3.5em var(--c-shadow)",
  fontSize: "clamp(14px, 3.5cqw, 22px)",
  dayFontSize: "clamp(0.82em, 4.8cqi, 1.28em)",
  transition: "0.35s",
  daysPadding: "1.8em",
  popupPadding: "1em",
  chipSize: "2.5em",
  opacityDisabled: "0.35",
  opacityMuted: "0.6",
  opacityHover: "0.82",
};

export const PRESS_TOKENS: Tokens = {
  controlPadding: "0.3em 0.65em",
  controlBorder: "1px",
  controlWeight: "400",
  tilePadding: "0.35em 0.55em",
  radius: "0.05em",
  containerRadius: "0.1em",
  border: "1px",
  spacing: "0.35em",
  shadowSm: "none",
  shadowMd: "none",
  shadowLg: "none",
  font: "'Iowan Old Style', 'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  fontSize: "clamp(14px, 3.4cqw, 22px)",
  dayFontSize: "clamp(1em, 5.2cqi, 1.54em)",
  letterSpacing: "0.18em",
  transition: "0.18s",
  daysPadding: "1.2em",
  popupPadding: "0.9em",
  chipSize: "2.2em",
  opacityDisabled: "0.25",
  opacityMuted: "0.55",
  opacityHover: "0.78",
};

export const SOFT_TOKENS: Tokens = {
  controlPadding: "0.4em 0.85em",
  controlBorder: "0px",
  controlWeight: "500",
  tilePadding: "0.45em 0.7em",
  radius: "0.75em",
  border: "1px",
  spacing: "0.7em",
  shadowSm: "0 0.15em 0.5em var(--c-shadow)",
  shadowMd: "0 0.25em 0.8em var(--c-shadow)",
  shadowLg: "0 0.3em 1.2em var(--c-shadow)",
  dayFontSize: "clamp(0.74em, 4.4cqi, 1.16em)",
  transition: "0.25s",
  daysPadding: "0.95em",
  popupPadding: "0.85em",
  chipSize: "2.2em",
  opacityDisabled: "0.45",
  opacityMuted: "0.65",
  opacityHover: "0.82",
};

export const SQUARE_TOKENS: Tokens = {
  controlPadding: "0.3em 0.6em",
  controlBorder: "1px",
  controlWeight: "500",
  tilePadding: "0.3em 0.5em",
  radius: "0",
  border: "1px",
  spacing: "0.5em",
  dayFontSize: "clamp(0.72em, 4.4cqi, 1.12em)",
  transition: "0.12s",
  popupPadding: "0.7em",
  chipSize: "2em",
  opacityDisabled: "0.3",
  opacityMuted: "0.5",
  opacityHover: "0.72",
  letterSpacing: "0.04em",
};

/** name → token record. Source for the objects below AND `appearances.css`. */
export const APPEARANCES: Record<string, Tokens> = {
  zenith: ZENITH_TOKENS,
  airy: AIRY_TOKENS,
  bubble: BUBBLE_TOKENS,
  compact: COMPACT_TOKENS,
  loft: LOFT_TOKENS,
  press: PRESS_TOKENS,
  soft: SOFT_TOKENS,
  square: SQUARE_TOKENS,
};

export const zenith = createAppearance(ZENITH_TOKENS);
export const airy = createAppearance(AIRY_TOKENS);
export const bubble = createAppearance(BUBBLE_TOKENS);
export const compact = createAppearance(COMPACT_TOKENS);
export const loft = createAppearance(LOFT_TOKENS);
export const press = createAppearance(PRESS_TOKENS);
export const soft = createAppearance(SOFT_TOKENS);
export const square = createAppearance(SQUARE_TOKENS);

export {
  type AppearanceTokens,
  type CalendarAppearance,
  type CustomAppearance,
  createAppearance,
} from "./appearance-tokens";
