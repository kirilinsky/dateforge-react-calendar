import { type ButtonHTMLAttributes, forwardRef } from "react";
import styles from "./button.module.css";

/**
 * The ONE action-button primitive for v3 modules (toolbar nav, wheel resets,
 * info actions, clear buttons, pager arrows). Internal — not part of the
 * public API; modules compose it, consumers never import it.
 *
 * Style guide (see _lab/UIKit.stories.tsx and .notes/ui-styleguide.md):
 * - `outline` (default): 1px `--c-stroke` border — primary toolbar language.
 * - `ghost`: borderless, `--c-mutedText` ink that darkens on hover — quiet
 *   in-content actions (info row, clear-inside-input).
 * - `sm`: 0.85em — actions sitting inside other modules' content.
 * - States come from tokens only: hover `--c-tone`, disabled
 *   `--c-disabledText` + opacity; the focus ring is global (cal-base).
 * - Always `type="button"` unless overridden — never submits a host form.
 *
 * Styles live in `cal-base`, so module CSS (cal-modules) can override freely
 * (e.g. ManualInput positions its clear overlay) without `!important`.
 */
export type UIButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline" | "ghost";
  size?: "md" | "sm";
};

export const UIButton = forwardRef<HTMLButtonElement, UIButtonProps>(
  function UIButton(
    { variant = "outline", size = "md", className, type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        data-ui-button=""
        data-variant={variant}
        data-size={size === "sm" ? "sm" : undefined}
        className={[styles.button, className].filter(Boolean).join(" ")}
        {...rest}
      />
    );
  },
);
