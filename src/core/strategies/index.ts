import type { CalendarConfig } from "../state";
import { selectionShape } from "../state";
import type { SelectionStrategy } from "../strategy";
import { multiSpanStrategy } from "./multi-span";
import { multipleStrategy } from "./multiple";
import { rangeStrategy } from "./range";
import { singleStrategy } from "./single";
import { singleSpanStrategy } from "./single-span";

/** Pick the strategy for the configured unit × mode. */
export function resolveStrategy(config: CalendarConfig): SelectionStrategy {
  const shape = selectionShape(config.unit, config.mode);
  if (shape === "point") {
    return config.mode === "multiple" ? multipleStrategy : singleStrategy;
  }
  // span shape (week/month units, or range/multi-range modes)
  if (config.mode === "single") return singleSpanStrategy;
  if (config.mode === "range") return rangeStrategy;
  return multiSpanStrategy;
}
