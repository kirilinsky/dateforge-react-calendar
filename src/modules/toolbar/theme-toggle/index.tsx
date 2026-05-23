import type React from "react";
import "@/styles/layers.css";
import { useConfig } from "@/context/config-context";
import { useUI } from "@/context/ui-context";
import shared from "@/global/global.module.css";
import { ThemeToggle } from "@/Icons";
import {
  DEFAULT_THEME_SWITCH_TO_DARK_LABEL,
  DEFAULT_THEME_SWITCH_TO_LIGHT_LABEL,
  DEFAULT_THEME_TOGGLE_LABEL,
  resolveActionLabel,
} from "@/utils/action-labels";
import { getGridSlotStyle } from "@/utils/get-grid-slot-style";
import { useToolbarContext } from "../toolbar-context";
import styles from "./theme-toggle.module.css";

export interface CalendarToolbarThemeToggleProps {
  col?: number | string;
  themeSwitchToDarkLabel?: string;
  themeSwitchToLightLabel?: string;
  themeToggleLabel?: string;
}

export const CalendarToolbarThemeToggle: React.FC<
  CalendarToolbarThemeToggleProps
> = ({
  col,
  themeSwitchToDarkLabel,
  themeSwitchToLightLabel,
  themeToggleLabel,
}) => {
  const tb = useToolbarContext();
  const { actionLabels } = useConfig();
  const { activeTheme, toggleTheme } = useUI();

  if (!tb) return null;

  const resolvedToggleLabel = resolveActionLabel(
    themeToggleLabel,
    actionLabels.themeToggleLabel,
    DEFAULT_THEME_TOGGLE_LABEL,
  );
  const resolvedToDarkLabel = resolveActionLabel(
    themeSwitchToDarkLabel,
    actionLabels.themeSwitchToDarkLabel,
    DEFAULT_THEME_SWITCH_TO_DARK_LABEL,
  );
  const resolvedToLightLabel = resolveActionLabel(
    themeSwitchToLightLabel,
    actionLabels.themeSwitchToLightLabel,
    DEFAULT_THEME_SWITCH_TO_LIGHT_LABEL,
  );
  const ariaLabel =
    activeTheme === "dark"
      ? resolvedToLightLabel
      : activeTheme === "light"
        ? resolvedToDarkLabel
        : resolvedToggleLabel;

  return (
    <button
      type="button"
      className={`${styles.button} ${shared.interactive} ${shared.hovered}`}
      aria-label={ariaLabel}
      aria-pressed={activeTheme === "dark"}
      style={getGridSlotStyle(col)}
      onClick={toggleTheme}
    >
      <ThemeToggle />
    </button>
  );
};
