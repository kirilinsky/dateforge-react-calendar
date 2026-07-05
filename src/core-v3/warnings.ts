/**
 * Warning registry — dev-only, centralized, fix-oriented.
 *
 * Rules (from the v3 plan): stable ids, warn once per distinct message, and
 * every message explains the fix, not just the failure. Malformed user input
 * never throws — it degrades to a safe fallback and emits one of these.
 *
 * Warnings are gated to non-production builds and routed through an injectable
 * sink so tests can capture them deterministically instead of spying on the
 * console.
 */

/**
 * Message builders, keyed by stable id. Each returns a full sentence that names
 * the problem and the fix. Args are typed per id.
 */
export const WARNINGS = {
  invalidFirstDayOfWeek: (value: unknown) =>
    `Invalid firstDayOfWeek "${String(value)}". Expected an integer 0-6 (0=Sunday). Normalizing instead.`,
  duplicatePresetId: (id: string) =>
    `Duplicate preset id "${id}". Only the first is kept — give each preset a unique id.`,
  malformedDateRule: (detail: string) =>
    `Skipped a malformed date rule (${detail}). Check the disabled/exclude config.`,
  invalidTimeZone: (tz: string) =>
    `Unknown time zone "${tz}". Falling back to the system zone. Use a valid IANA name.`,
  emptySelectionAfterExclude: () =>
    `The selected span is empty after exclude rules removed every day; nothing was committed.`,
  maxRangesReached: (max: number) =>
    `maxRanges (${max}) reached. Ignoring the new range — raise maxRanges or remove one first.`,
  invalidValue: (detail: string) =>
    `Dropped an invalid \`value\`/\`defaultValue\` entry (${detail}). Pass valid Date objects in the shape of the configured unit × mode.`,
  invalidMinMax: () =>
    `\`min\` is after \`max\` — no day is selectable. Swap or fix the bounds.`,
  invalidPreset: (detail: string) =>
    `Skipped an invalid preset (${detail}). Each preset needs a \`label\` (or \`id\`) and a resolvable value.`,
  presetResolveError: (id: string, error: string) =>
    `Preset "${id}" threw while resolving (${error}). It is treated as empty — make its getValue/resolve never throw.`,
} as const;

export type WarningId = keyof typeof WARNINGS;

export type WarningSink = (message: string, id: WarningId) => void;

function isDev(): boolean {
  // Only production explicitly silences warnings; everything else is dev.
  return !(
    typeof process !== "undefined" && process.env.NODE_ENV === "production"
  );
}

const defaultSink: WarningSink = (message) => {
  console.warn(`[dateforge] ${message}`);
};

export type Warner = {
  warnOnce<K extends WarningId>(
    id: K,
    ...args: Parameters<(typeof WARNINGS)[K]>
  ): void;
  /** Clear the seen set (test helper). */
  reset(): void;
};

/**
 * Create an isolated warner with its own dedupe state and sink. Library code
 * uses the shared {@link warnOnce}; tests create their own with a capturing
 * sink.
 */
export function createWarner(sink: WarningSink = defaultSink): Warner {
  const seen = new Set<string>();
  return {
    warnOnce(id, ...args) {
      if (!isDev()) return;
      const build = WARNINGS[id] as (...a: unknown[]) => string;
      const message = build(...args);
      const key = `${id}::${message}`;
      if (seen.has(key)) return;
      seen.add(key);
      sink(message, id);
    },
    reset() {
      seen.clear();
    },
  };
}

const shared = createWarner();

/** Shared library warner — warns once per distinct message, dev-only. */
export const warnOnce = shared.warnOnce;
/** Reset the shared warner's dedupe state (mainly for tests). */
export const resetWarnings = shared.reset;
