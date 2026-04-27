import { warnOnce } from "../core/dev-warn";
import type { DisabledConfig, DisabledRule } from "../types/calendar";

interface CreateDisabledInit {
  all?: boolean;
  weekends?: boolean;
  weekdays?: number[];
  before?: Date;
  after?: Date;
  dates?: Date[];
  ranges?: Array<{ from: Date; to: Date }>;
}

const isValidDate = (d: unknown): d is Date =>
  d instanceof Date && !Number.isNaN(d.getTime());

const sanitizeDate = (d: unknown, field: string): Date | undefined => {
  if (d == null) return undefined;
  if (isValidDate(d)) return d;
  warnOnce(
    `createDisabled:invalid-date:${field}`,
    `createDisabled.${field} is not a valid Date instance — entry skipped.`,
  );
  return undefined;
};

const sanitizeWeekdays = (input: unknown): number[] | undefined => {
  if (input == null) return undefined;
  if (!Array.isArray(input)) {
    warnOnce(
      "createDisabled:weekdays-not-array",
      `createDisabled.weekdays must be an array of integers 0..6 — entry skipped.`,
    );
    return undefined;
  }
  const out = input.filter(
    (n): n is number =>
      typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 6,
  );
  if (out.length !== input.length) {
    warnOnce(
      "createDisabled:weekdays-bad-values",
      `createDisabled.weekdays contains values outside 0..6 (or non-integers); they were dropped.`,
    );
  }
  return out.length > 0 ? out : undefined;
};

/**
 * Creates a `DisabledConfig` object for the `disabled` prop of `<Calendar />`.
 *
 * @example
 * // Disable weekends and a specific date range
 * const disabled = createDisabled({
 *   weekends: true,
 *   ranges: [{ from: new Date('2024-05-01'), to: new Date('2024-05-10') }],
 * })
 *
 * @example
 * // Disable everything before a date and specific individual dates
 * const disabled = createDisabled({
 *   before: new Date('2024-01-01'),
 *   dates: [new Date('2024-03-15'), new Date('2024-03-20')],
 * })
 */
export function createDisabled(init: CreateDisabledInit): DisabledConfig {
  if (init == null || typeof init !== "object" || Array.isArray(init)) {
    warnOnce(
      "createDisabled:invalid-init",
      `createDisabled() expects an object. Received: ${JSON.stringify(init)}. Returning empty config.`,
    );
    return { __type: "disabled-config", rules: [] };
  }

  const rules: DisabledRule[] = [];

  if (init.all) rules.push(true);
  if (init.weekends) rules.push({ dayOfWeek: [0, 6] });

  const weekdays = sanitizeWeekdays(init.weekdays);
  if (weekdays) rules.push({ dayOfWeek: weekdays });

  const before = sanitizeDate(init.before, "before");
  if (before) rules.push({ before });

  const after = sanitizeDate(init.after, "after");
  if (after) rules.push({ after });

  if (init.dates != null) {
    if (!Array.isArray(init.dates)) {
      warnOnce(
        "createDisabled:dates-not-array",
        `createDisabled.dates must be Date[] — entry skipped.`,
      );
    } else {
      for (let i = 0; i < init.dates.length; i++) {
        const d = init.dates[i];
        if (isValidDate(d)) rules.push(d);
        else {
          warnOnce(
            `createDisabled:dates-invalid:${i}`,
            `createDisabled.dates[${i}] is not a valid Date — dropped.`,
          );
        }
      }
    }
  }

  if (init.ranges != null) {
    if (!Array.isArray(init.ranges)) {
      warnOnce(
        "createDisabled:ranges-not-array",
        `createDisabled.ranges must be an array of { from, to } — entry skipped.`,
      );
    } else {
      for (let i = 0; i < init.ranges.length; i++) {
        const r = init.ranges[i];
        if (r == null || typeof r !== "object") {
          warnOnce(
            `createDisabled:range-not-object:${i}`,
            `createDisabled.ranges[${i}] is not an object — dropped.`,
          );
          continue;
        }
        if (!isValidDate(r.from) || !isValidDate(r.to)) {
          warnOnce(
            `createDisabled:range-invalid-dates:${i}`,
            `createDisabled.ranges[${i}] has invalid Date(s) — dropped.`,
          );
          continue;
        }
        if (r.from.getTime() > r.to.getTime()) {
          warnOnce(
            `createDisabled:range-inverted:${i}`,
            `createDisabled.ranges[${i}] has from > to — values were swapped.`,
          );
          rules.push({ from: r.to, to: r.from });
        } else {
          rules.push({ from: r.from, to: r.to });
        }
      }
    }
  }

  return { __type: "disabled-config", rules };
}
