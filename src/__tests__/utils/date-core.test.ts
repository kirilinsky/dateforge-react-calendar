import { describe, expect, it } from "vitest";
import type { DisabledConfig } from "@/types/calendar";
import {
  addDate,
  checkIsDateDisabled,
  hasDisabledInRange,
  isSameDay,
  setMonth,
  setYear,
  toLimitTimestamp,
} from "@/utils/date-core";

const d = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const disabled = (...rules: DisabledConfig["rules"]): DisabledConfig => ({
  __type: "disabled-config",
  rules,
});

// ─── isSameDay ───────────────────────────────────────────────────────────────

describe("isSameDay", () => {
  it("same day", () =>
    expect(isSameDay(d(2024, 1, 15), d(2024, 1, 15))).toBe(true));
  it("different day", () =>
    expect(isSameDay(d(2024, 1, 15), d(2024, 1, 16))).toBe(false));
  it("different month", () =>
    expect(isSameDay(d(2024, 1, 15), d(2024, 2, 15))).toBe(false));
  it("different year", () =>
    expect(isSameDay(d(2023, 1, 15), d(2024, 1, 15))).toBe(false));
  it("cross-year same date", () =>
    expect(isSameDay(d(2024, 12, 31), d(2025, 12, 31))).toBe(false));
  it("different times same day", () => {
    const a = new Date(2024, 0, 15, 9, 0, 0);
    const b = new Date(2024, 0, 15, 23, 59, 59);
    expect(isSameDay(a, b)).toBe(true);
  });
});

// ─── toLimitTimestamp ────────────────────────────────────────────────────────

describe("toLimitTimestamp", () => {
  it("null input → null", () => expect(toLimitTimestamp(null)).toBeNull());
  it("undefined input → null", () =>
    expect(toLimitTimestamp(undefined)).toBeNull());
  it("min boundary sets 00:00:00.000", () => {
    const ts = toLimitTimestamp(d(2024, 3, 10));
    expect(new Date(ts!).getHours()).toBe(0);
    expect(new Date(ts!).getMinutes()).toBe(0);
    expect(new Date(ts!).getMilliseconds()).toBe(0);
  });
  it("max boundary sets 23:59:59.999", () => {
    const ts = toLimitTimestamp(d(2024, 3, 10), true);
    expect(new Date(ts!).getHours()).toBe(23);
    expect(new Date(ts!).getMinutes()).toBe(59);
    expect(new Date(ts!).getSeconds()).toBe(59);
    expect(new Date(ts!).getMilliseconds()).toBe(999);
  });
});

// ─── setMonth ────────────────────────────────────────────────────────────────

describe("setMonth", () => {
  it("normal month change", () => {
    expect(setMonth(d(2024, 1, 15), 5).getMonth()).toBe(5);
  });
  it("day overflow: Jan 31 → Feb clamps to 29 (leap 2024)", () => {
    const result = setMonth(d(2024, 1, 31), 1);
    expect(result.getDate()).toBe(29);
    expect(result.getMonth()).toBe(1);
  });
  it("day overflow: Jan 31 → Feb clamps to 28 (non-leap 2023)", () => {
    const result = setMonth(d(2023, 1, 31), 1);
    expect(result.getDate()).toBe(28);
    expect(result.getMonth()).toBe(1);
  });
  it("does not mutate input", () => {
    const orig = d(2024, 1, 15);
    const ts = orig.getTime();
    setMonth(orig, 5);
    expect(orig.getTime()).toBe(ts);
  });
});

// ─── addDate ─────────────────────────────────────────────────────────────────

describe("addDate", () => {
  it("add 1 month", () => {
    expect(addDate(d(2024, 1, 15), 1, "month").getMonth()).toBe(1);
  });
  it("add 1 year", () => {
    expect(addDate(d(2024, 1, 15), 1, "year").getFullYear()).toBe(2025);
  });
  it("subtract 1 month", () => {
    expect(addDate(d(2024, 3, 15), -1, "month").getMonth()).toBe(1);
  });
  it("clamps to endDate when overflows", () => {
    const end = d(2024, 6, 1);
    const result = addDate(d(2024, 5, 15), 3, "month", null, end);
    expect(result.getTime()).toBeLessThanOrEqual(end.getTime() + 1000);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
  });
  it("clamps to startDate when underflows", () => {
    const start = d(2024, 3, 1);
    const result = addDate(d(2024, 4, 15), -3, "month", start, null);
    expect(result.getMonth()).toBe(2);
  });
  it("does not mutate input", () => {
    const orig = d(2024, 1, 15);
    const ts = orig.getTime();
    addDate(orig, 1, "month");
    expect(orig.getTime()).toBe(ts);
  });
});

// ─── setYear ─────────────────────────────────────────────────────────────────

describe("setYear", () => {
  it("sets year", () =>
    expect(setYear(d(2024, 6, 15), 2030).getFullYear()).toBe(2030));
  it("clamps leap day when target year is not leap", () => {
    const result = setYear(d(2024, 2, 29), 2025);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(28);
  });
  it("does not mutate input", () => {
    const orig = d(2024, 6, 15);
    const ts = orig.getTime();
    setYear(orig, 2030);
    expect(orig.getTime()).toBe(ts);
  });
});

// ─── checkIsDateDisabled ─────────────────────────────────────────────────────

describe("checkIsDateDisabled", () => {
  it("no rules → false", () => {
    expect(checkIsDateDisabled(d(2024, 6, 15))).toBe(false);
  });

  it("boolean true rule → true", () => {
    expect(
      checkIsDateDisabled(d(2024, 6, 15), null, null, disabled(true)),
    ).toBe(true);
  });

  it("boolean false rule → false", () => {
    expect(
      checkIsDateDisabled(d(2024, 6, 15), null, null, disabled(false)),
    ).toBe(false);
  });

  it("Date rule matches same day", () => {
    expect(
      checkIsDateDisabled(d(2024, 6, 15), null, null, disabled(d(2024, 6, 15))),
    ).toBe(true);
  });

  it("Date rule different day → false", () => {
    expect(
      checkIsDateDisabled(d(2024, 6, 15), null, null, disabled(d(2024, 6, 16))),
    ).toBe(false);
  });

  it("dayOfWeek rule matches", () => {
    const sunday = d(2024, 6, 16); // Sunday = 0
    expect(
      checkIsDateDisabled(sunday, null, null, disabled({ dayOfWeek: [0] })),
    ).toBe(true);
  });

  it("dayOfWeek rule no match", () => {
    const monday = d(2024, 6, 17);
    expect(
      checkIsDateDisabled(monday, null, null, disabled({ dayOfWeek: [0] })),
    ).toBe(false);
  });

  it("from/to range: inside → true", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 6, 15),
        null,
        null,
        disabled({ from: d(2024, 6, 10), to: d(2024, 6, 20) }),
      ),
    ).toBe(true);
  });

  it("from/to range: boundary start → true", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 6, 10),
        null,
        null,
        disabled({ from: d(2024, 6, 10), to: d(2024, 6, 20) }),
      ),
    ).toBe(true);
  });

  it("from/to range: outside → false", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 6, 5),
        null,
        null,
        disabled({ from: d(2024, 6, 10), to: d(2024, 6, 20) }),
      ),
    ).toBe(false);
  });

  it("before rule: date before threshold → true", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 1, 1),
        null,
        null,
        disabled({ before: d(2024, 6, 1) }),
      ),
    ).toBe(true);
  });

  it("before rule: date after threshold → false", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 12, 1),
        null,
        null,
        disabled({ before: d(2024, 6, 1) }),
      ),
    ).toBe(false);
  });

  it("after rule: date after threshold → true", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 12, 1),
        null,
        null,
        disabled({ after: d(2024, 6, 1) }),
      ),
    ).toBe(true);
  });

  it("startDate window: before min → true", () => {
    expect(checkIsDateDisabled(d(2024, 1, 1), d(2024, 6, 1))).toBe(true);
  });

  it("startDate window: after min → false", () => {
    expect(checkIsDateDisabled(d(2024, 12, 1), d(2024, 6, 1))).toBe(false);
  });

  it("endDate window: after max → true", () => {
    expect(checkIsDateDisabled(d(2024, 12, 31), null, d(2024, 6, 1))).toBe(
      true,
    );
  });

  it("combined rules: rule matches → true even if date in window", () => {
    expect(
      checkIsDateDisabled(
        d(2024, 6, 15),
        d(2024, 1, 1),
        d(2024, 12, 31),
        disabled(d(2024, 6, 15)),
      ),
    ).toBe(true);
  });
});

// ─── hasDisabledInRange ──────────────────────────────────────────────────────

describe("hasDisabledInRange", () => {
  it("no disabled → false", () => {
    expect(hasDisabledInRange(d(2024, 6, 1), d(2024, 6, 30))).toBe(false);
  });

  it("disabled day in middle of range → true", () => {
    expect(
      hasDisabledInRange(
        d(2024, 6, 1),
        d(2024, 6, 30),
        null,
        null,
        disabled(d(2024, 6, 15)),
      ),
    ).toBe(true);
  });

  it("disabled day at range start → true", () => {
    expect(
      hasDisabledInRange(
        d(2024, 6, 1),
        d(2024, 6, 10),
        null,
        null,
        disabled(d(2024, 6, 1)),
      ),
    ).toBe(true);
  });

  it("disabled day at range end → true", () => {
    expect(
      hasDisabledInRange(
        d(2024, 6, 1),
        d(2024, 6, 10),
        null,
        null,
        disabled(d(2024, 6, 10)),
      ),
    ).toBe(true);
  });

  it("range of 1 day, not disabled → false", () => {
    expect(hasDisabledInRange(d(2024, 6, 15), d(2024, 6, 15))).toBe(false);
  });

  it("range of 1 day, disabled → true", () => {
    expect(
      hasDisabledInRange(
        d(2024, 6, 15),
        d(2024, 6, 15),
        null,
        null,
        disabled(d(2024, 6, 15)),
      ),
    ).toBe(true);
  });

  it("disabled outside range → false", () => {
    expect(
      hasDisabledInRange(
        d(2024, 6, 1),
        d(2024, 6, 10),
        null,
        null,
        disabled(d(2024, 6, 20)),
      ),
    ).toBe(false);
  });

  it("endDate boundary cuts the range → true when range exceeds endDate", () => {
    expect(
      hasDisabledInRange(d(2024, 6, 1), d(2024, 6, 30), null, d(2024, 6, 15)),
    ).toBe(true);
  });

  it("dayOfWeek in range → true", () => {
    // 2024-06-01 is Saturday (6), 2024-06-02 is Sunday (0)
    expect(
      hasDisabledInRange(
        d(2024, 6, 1),
        d(2024, 6, 7),
        null,
        null,
        disabled({ dayOfWeek: [0] }),
      ),
    ).toBe(true);
  });
});
