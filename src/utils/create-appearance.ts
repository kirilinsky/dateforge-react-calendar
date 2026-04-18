import { APPEARANCE_TOKEN_TO_VAR } from "../types/appearances";
import type { AppearanceTokens, CustomAppearance } from "../types/appearances";

/**
 * create custom appearance from shape/shadow tokens.
 * use result as `appearance` prop for Calendar.
 *
 * @example
 * const myAppearance = createAppearance({ radius: "0.26em", border: "3px", spacing... });
 * <Calendar appearance={myAppearance} />
 */
export function createAppearance(tokens: Partial<AppearanceTokens>): CustomAppearance {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = APPEARANCE_TOKEN_TO_VAR[key as keyof AppearanceTokens];
    if (cssVar && value) vars[cssVar] = value;
  }
  return { __type: "custom-appearance", vars };
}
