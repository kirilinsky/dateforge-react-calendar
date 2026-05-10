import { describe, expect, it } from "vitest";
import { THEMES_DATA, type ThemeTokens } from "../../../themes/themes";

const MIN_NORMAL_TEXT_CONTRAST = 4.5;

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "").slice(0, 6);
  return [0, 2, 4].map((i) => Number.parseInt(value.slice(i, i + 2), 16)) as [
    number,
    number,
    number,
  ];
}

function channelToLinear(value: number): number {
  const normalized = value / 255;
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [red, green, blue] = hexToRgb(hex).map(channelToLinear);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground: string, background: string): number {
  const fg = luminance(foreground);
  const bg = luminance(background);
  const lighter = Math.max(fg, bg);
  const darker = Math.min(fg, bg);
  return (lighter + 0.05) / (darker + 0.05);
}

describe("built-in theme contrast tokens", () => {
  it.each(
    Object.entries(THEMES_DATA),
  )("%s muted and disabled text pass normal text contrast", (_name, theme) => {
    const foregrounds = ["mutedText", "disabledText"] as const;
    const backgrounds = ["backdrop", "tone"] as const;

    for (const foreground of foregrounds) {
      for (const background of backgrounds) {
        expect(
          contrastRatio(theme[foreground], theme[background]),
          `${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(MIN_NORMAL_TEXT_CONTRAST);
      }
    }
  });

  it("covers every built-in theme with the new a11y tokens", () => {
    for (const theme of Object.values(THEMES_DATA) as ThemeTokens[]) {
      expect(theme.mutedText).toMatch(/^#[0-9a-f]{6}$/i);
      expect(theme.disabledText).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
