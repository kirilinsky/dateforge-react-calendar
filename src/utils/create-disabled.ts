import { DisabledConfig, DisabledRule } from "../types/calendar";

interface CreateDisabledInit {
  all?: boolean;
  weekends?: boolean;
  weekdays?: number[];
  before?: Date;
  after?: Date;
  dates?: Date[];
  ranges?: Array<{ from: Date; to: Date }>;
}

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
  const rules: DisabledRule[] = [];
  if (init.all) rules.push(true);
  if (init.weekends) rules.push({ dayOfWeek: [0, 6] });
  if (init.weekdays?.length) rules.push({ dayOfWeek: init.weekdays });
  if (init.before) rules.push({ before: init.before });
  if (init.after) rules.push({ after: init.after });
  if (init.dates?.length) rules.push(...init.dates);
  if (init.ranges?.length) {
    for (const r of init.ranges) rules.push({ from: r.from, to: r.to });
  }
  return { __type: "disabled-config", rules };
}
