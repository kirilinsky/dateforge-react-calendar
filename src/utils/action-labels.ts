import type { CalendarActionLabels } from "@/types/calendar";

export const DEFAULT_CALENDAR_ACTION_LABELS = {
  clearLabel: "Clear",
  homeLabel: "Go to current month",
} as const satisfies Required<CalendarActionLabels>;

export const resolveActionLabel = (
  moduleLabel: string | undefined,
  globalLabel: string | undefined,
  fallback: string,
): string => moduleLabel ?? globalLabel ?? fallback;
