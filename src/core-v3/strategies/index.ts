import { noChange } from "../effects";
import type { CalendarConfig } from "../state";
import { selectionShape } from "../state";
import type { SelectionStrategy } from "../strategy";
import { multipleStrategy } from "./multiple";
import { rangeStrategy } from "./range";
import { singleStrategy } from "./single";
import { singleSpanStrategy } from "./single-span";

/**
 * Placeholder strategy — selection actions are a no-op for modes not yet wired
 * (Phase D.4–D.6). Removed once every mode has a real strategy.
 */
const pendingStrategy: SelectionStrategy = {
  selectDay: (ctx) => noChange(ctx.state),
  setTime: (ctx) => noChange(ctx.state),
  clear: (ctx) => noChange(ctx.state),
  applyPreset: (ctx) => noChange(ctx.state),
};

/** Pick the strategy for the configured unit × mode. */
export function resolveStrategy(config: CalendarConfig): SelectionStrategy {
  const shape = selectionShape(config.unit, config.mode);
  if (shape === "point") {
    return config.mode === "multiple" ? multipleStrategy : singleStrategy;
  }
  // span shape (week/month units, or range/multi-range modes)
  if (config.mode === "single") return singleSpanStrategy;
  if (config.mode === "range") return rangeStrategy;
  return pendingStrategy; // multi-range, week/month multiple — Phase D.6
}
