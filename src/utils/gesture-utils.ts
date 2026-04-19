import { DisabledRule } from "@/types/calendar";
import { navBoundsFromDisabled } from "./date-core";

export const getNextMonthFromSwipe = (
  deltaX: number,
  currentDate: Date,
  startDate?: Date,
  endDate?: Date,
  threshold = 50,
  disabled?: DisabledRule | DisabledRule[],
): Date | null => {
  if (Math.abs(deltaX) < threshold) return null;
  const dir = deltaX > 0 ? 1 : -1;
  const d = new Date(currentDate);
  const expectedMonth = (d.getMonth() + dir + 12) % 12;
  d.setMonth(d.getMonth() + dir);
  if (d.getMonth() !== expectedMonth) d.setDate(0);
  const ym = d.getFullYear() * 12 + d.getMonth();
  if (startDate && ym < startDate.getFullYear() * 12 + startDate.getMonth())
    return null;
  if (endDate && ym > endDate.getFullYear() * 12 + endDate.getMonth())
    return null;
  const { min, max } = navBoundsFromDisabled(disabled);
  if (min && ym < min.getFullYear() * 12 + min.getMonth()) return null;
  if (max && ym > max.getFullYear() * 12 + max.getMonth()) return null;
  return d;
};
