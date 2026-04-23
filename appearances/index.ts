import { CUSTOM_APPEARANCE_BRAND } from "../src/types/appearances";
import type { CustomAppearance } from "../src/types/appearances";

export const soft: CustomAppearance = {
  [CUSTOM_APPEARANCE_BRAND]: true,
  vars: {
    "--cal-radius":    "0.75em",
    "--cal-border":    "1px",
    "--cal-spacing":   "0.7em",
    "--cal-shadow-sm": "0 0.15em 0.5em var(--c-x)",
    "--cal-shadow-md": "0 0.25em 0.8em var(--c-x)",
    "--cal-shadow-lg": "0 0.3em 1.2em var(--c-x)",
  },
};

export const compact: CustomAppearance = {
  [CUSTOM_APPEARANCE_BRAND]: true,
  vars: {
    "--cal-radius":    "0.3em",
    "--cal-border":    "1px",
    "--cal-spacing":   "0.35em",
    "--cal-shadow-sm": "0 0.05em 0.15em var(--c-x)",
    "--cal-shadow-md": "0 0.1em 0.3em var(--c-x)",
    "--cal-shadow-lg": "0 0.1em 0.4em var(--c-x)",
    "--cal-day-ratio": "1 / 0.7",
  },
};

export const square: CustomAppearance = {
  [CUSTOM_APPEARANCE_BRAND]: true,
  vars: {
    "--cal-radius":     "0",
    "--cal-border":     "1px",
    "--cal-spacing":    "0.5em",
    "--cal-transition": "0.12s",
    "--cal-day-ratio":  "1 / 1",
  },
};

export const loft: CustomAppearance = {
  [CUSTOM_APPEARANCE_BRAND]: true,
  vars: {
    "--cal-radius":           "1em",
    "--cal-container-radius": "2.5em",
    "--header-min-height":    "5em",
    "--cal-border":           "0px",
    "--cal-spacing":          "1em",
    "--cal-shadow-sm":        "0 0.3em 0.9em var(--c-x)",
    "--cal-shadow-md":        "0 0.8em 2em var(--c-x)",
    "--cal-shadow-lg":        "0 1.5em 3.5em var(--c-x)",
    "--cal-font-size":        "clamp(14px, 3.5cqw, 22px)",
    "--cal-transition":       "0.35s",
    "--cal-days-padding":     "1.8em",
    "--cal-track-height":     "5em",
    "--cal-day-ratio":        "1 / 1",
  },
};

export const bubble: CustomAppearance = {
  [CUSTOM_APPEARANCE_BRAND]: true,
  vars: {
    "--cal-radius":           "1.5em",
    "--cal-container-radius": "2.2em",
    "--header-min-height":    "4em",
    "--cal-border":           "1px",
    "--cal-spacing":          "0.7em",
    "--cal-shadow-sm":        "0 0.15em 0.5em var(--c-x)",
    "--cal-shadow-md":        "0 0.25em 0.9em var(--c-x)",
    "--cal-shadow-lg":        "0 0.35em 1.4em var(--c-x)",
    "--cal-day-ratio":        "1 / 1",
  },
};
