import type { CustomAppearance } from "../src/types/appearances";

export const soft: CustomAppearance = {
  __type: "custom-appearance",
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
  __type: "custom-appearance",
  vars: {
    "--cal-radius":    "0.3em",
    "--cal-border":    "1px",
    "--cal-spacing":   "0.35em",
    "--cal-shadow-sm": "0 0.05em 0.15em var(--c-x)",
    "--cal-shadow-md": "0 0.1em 0.3em var(--c-x)",
    "--cal-shadow-lg": "0 0.1em 0.4em var(--c-x)",
  },
};

export const square: CustomAppearance = {
  __type: "custom-appearance",
  vars: {
    "--cal-radius":  "0",
    "--cal-border":  "1px",
    "--cal-spacing": "0.5em",
  },
};

export const bubble: CustomAppearance = {
  __type: "custom-appearance",
  vars: {
    "--cal-radius":           "1.5em",
    "--cal-container-radius": "2.2em",
    "--header-min-height":    "4em",
    "--cal-border":           "1px",
    "--cal-spacing":          "0.7em",
    "--cal-shadow-sm":        "0 0.15em 0.5em var(--c-x)",
    "--cal-shadow-md":        "0 0.25em 0.9em var(--c-x)",
    "--cal-shadow-lg":        "0 0.35em 1.4em var(--c-x)",
  },
};
