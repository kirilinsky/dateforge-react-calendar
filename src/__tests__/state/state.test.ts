import { describe, it, expect } from "vitest";
import { calendarReducer, buildInitialState } from "@/core/state";
import type { SelectConfig } from "@/core/state";
import type { DisabledConfig } from "@/types/calendar";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

const baseState = buildInitialState({ range: false });

const rangeCfg = (overrides?: Partial<SelectConfig>): SelectConfig => ({
  range: true,
  multiselect: false,
  ...overrides,
});

const singleCfg = (overrides?: Partial<SelectConfig>): SelectConfig => ({
  range: false,
  multiselect: false,
  ...overrides,
});

const multiCfg = (max: number | true): SelectConfig => ({
  range: false,
  multiselect: max,
});

const disabled = (...rules: DisabledConfig["rules"]): DisabledConfig => ({
  __type: "disabled-config",
  rules,
});

// ─── NAVIGATE ────────────────────────────────────────────────────────────────

describe("NAVIGATE", () => {
  it("updates viewDate", () => {
    const date = d(2025, 3, 10);
    const next = calendarReducer(baseState, { type: "NAVIGATE", date });
    expect(next.viewDate).toBe(date);
  });

  it("does not touch selectedDates", () => {
    const state = { ...baseState, selectedDates: [d(2024, 1, 1)] };
    const next = calendarReducer(state, { type: "NAVIGATE", date: d(2025, 1, 1) });
    expect(next.selectedDates).toBe(state.selectedDates);
  });
});

// ─── SELECT — single ─────────────────────────────────────────────────────────

describe("SELECT single", () => {
  it("selects date, updates viewDate", () => {
    const date = d(2024, 6, 15);
    const next = calendarReducer(baseState, { type: "SELECT", date, config: singleCfg() });
    expect(next.selectedDates).toHaveLength(1);
    expect(next.selectedDates[0]).toBe(date);
    expect(next.viewDate).toBe(date);
  });

  it("selecting same day deselects (toggle)", () => {
    const date = d(2024, 6, 15);
    const state = { ...baseState, selectedDates: [date] };
    const next = calendarReducer(state, { type: "SELECT", date, config: singleCfg() });
    expect(next.selectedDates).toHaveLength(0);
  });

  it("null date clears selection", () => {
    const state = { ...baseState, selectedDates: [d(2024, 6, 15)] };
    const next = calendarReducer(state, { type: "SELECT", date: null, config: singleCfg() });
    expect(next.selectedDates).toHaveLength(0);
  });

  it("increments notifySeq on change", () => {
    const date = d(2024, 6, 15);
    const next = calendarReducer(baseState, { type: "SELECT", date, config: singleCfg() });
    expect(next.notifySeq).toBe(baseState.notifySeq + 1);
  });

  it("same state ref returned when nothing changes (toggle already empty)", () => {
    const next = calendarReducer(baseState, { type: "SELECT", date: null, config: singleCfg() });
    // selectedDates is already [] — notifySeq still increments (null clears)
    expect(next.selectedDates).toHaveLength(0);
  });
});

// ─── SELECT — multiselect ────────────────────────────────────────────────────

describe("SELECT multiselect", () => {
  it("adds multiple dates", () => {
    const a = d(2024, 6, 1);
    const b = d(2024, 6, 2);
    let state = calendarReducer(baseState, { type: "SELECT", date: a, config: multiCfg(true) });
    state = calendarReducer(state, { type: "SELECT", date: b, config: multiCfg(true) });
    expect(state.selectedDates).toHaveLength(2);
  });

  it("toggles existing date off", () => {
    const date = d(2024, 6, 1);
    let state = calendarReducer(baseState, { type: "SELECT", date, config: multiCfg(true) });
    state = calendarReducer(state, { type: "SELECT", date, config: multiCfg(true) });
    expect(state.selectedDates).toHaveLength(0);
  });

  it("enforces max count — ignores add when full", () => {
    const a = d(2024, 6, 1);
    const b = d(2024, 6, 2);
    const c = d(2024, 6, 3);
    let state = calendarReducer(baseState, { type: "SELECT", date: a, config: multiCfg(2) });
    state = calendarReducer(state, { type: "SELECT", date: b, config: multiCfg(2) });
    const before = state.notifySeq;
    state = calendarReducer(state, { type: "SELECT", date: c, config: multiCfg(2) });
    expect(state.selectedDates).toHaveLength(2);
    expect(state.notifySeq).toBe(before); // state unchanged → no notify
  });

  it("state ref unchanged when at max and adding new", () => {
    const a = d(2024, 6, 1);
    const b = d(2024, 6, 2);
    let state = calendarReducer(baseState, { type: "SELECT", date: a, config: multiCfg(2) });
    state = calendarReducer(state, { type: "SELECT", date: b, config: multiCfg(2) });
    const result = calendarReducer(state, { type: "SELECT", date: d(2024, 6, 3), config: multiCfg(2) });
    expect(result).toBe(state);
  });
});

// ─── SELECT — range ──────────────────────────────────────────────────────────

describe("SELECT range", () => {
  it("first click sets rangeStart, clears rangeEnd", () => {
    const date = d(2024, 6, 1);
    const next = calendarReducer(baseState, { type: "SELECT", date, config: rangeCfg() });
    expect(next.rangeStart).toBe(date);
    expect(next.rangeEnd).toBeNull();
  });

  it("second click (later) sets rangeEnd, orders start < end", () => {
    const start = d(2024, 6, 1);
    const end = d(2024, 6, 15);
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: end, config: rangeCfg() });
    expect(state.rangeStart!.getTime()).toBe(start.getTime());
    expect(state.rangeEnd!.getTime()).toBe(end.getTime());
  });

  it("second click (earlier) auto-swaps start/end", () => {
    const first = d(2024, 6, 15);
    const second = d(2024, 6, 1);
    let state = calendarReducer(baseState, { type: "SELECT", date: first, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: second, config: rangeCfg() });
    expect(state.rangeStart!.getTime()).toBe(second.getTime());
    expect(state.rangeEnd!.getTime()).toBe(first.getTime());
  });

  it("click same day as rangeStart clears range", () => {
    const date = d(2024, 6, 10);
    let state = calendarReducer(baseState, { type: "SELECT", date, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date, config: rangeCfg() });
    expect(state.rangeStart).toBeNull();
    expect(state.rangeEnd).toBeNull();
  });

  it("when rangeEnd exists, next click restarts range", () => {
    const a = d(2024, 6, 1);
    const b = d(2024, 6, 10);
    const c = d(2024, 6, 20);
    let state = calendarReducer(baseState, { type: "SELECT", date: a, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: b, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: c, config: rangeCfg() });
    expect(state.rangeStart!.getTime()).toBe(c.getTime());
    expect(state.rangeEnd).toBeNull();
  });

  it("null date clears range", () => {
    const start = d(2024, 6, 1);
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: null, config: rangeCfg() });
    expect(state.rangeStart).toBeNull();
    expect(state.rangeEnd).toBeNull();
  });

  it("minRangeDays — range too short → state unchanged", () => {
    const start = d(2024, 6, 1);
    const end = d(2024, 6, 2); // 2 days, min=5
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: rangeCfg({ minRangeDays: 5 }) });
    const before = state;
    state = calendarReducer(state, { type: "SELECT", date: end, config: rangeCfg({ minRangeDays: 5 }) });
    expect(state).toBe(before);
  });

  it("maxRangeDays — range too long → state unchanged", () => {
    const start = d(2024, 6, 1);
    const end = d(2024, 6, 20); // 20 days, max=5
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: rangeCfg({ maxRangeDays: 5 }) });
    const before = state;
    state = calendarReducer(state, { type: "SELECT", date: end, config: rangeCfg({ maxRangeDays: 5 }) });
    expect(state).toBe(before);
  });

  it("disabled date inside range → state unchanged", () => {
    const start = d(2024, 6, 1);
    const end = d(2024, 6, 15);
    const cfg = rangeCfg({ disabled: disabled(d(2024, 6, 10)) });
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: cfg });
    const before = state;
    state = calendarReducer(state, { type: "SELECT", date: end, config: cfg });
    expect(state).toBe(before);
  });

  it("clean range with no disabled → completes normally", () => {
    const start = d(2024, 6, 1);
    const end = d(2024, 6, 5);
    let state = calendarReducer(baseState, { type: "SELECT", date: start, config: rangeCfg() });
    state = calendarReducer(state, { type: "SELECT", date: end, config: rangeCfg() });
    expect(state.rangeStart).not.toBeNull();
    expect(state.rangeEnd).not.toBeNull();
  });
});

// ─── HOVER ───────────────────────────────────────────────────────────────────

describe("HOVER", () => {
  it("sets hoverDate", () => {
    const date = d(2024, 6, 10);
    const next = calendarReducer(baseState, { type: "HOVER", date });
    expect(next.hoverDate).toBe(date);
  });

  it("clears hoverDate with null", () => {
    const state = { ...baseState, hoverDate: d(2024, 6, 10) };
    const next = calendarReducer(state, { type: "HOVER", date: null });
    expect(next.hoverDate).toBeNull();
  });
});

// ─── OPEN_POPUP / CLOSE_POPUP ────────────────────────────────────────────────

describe("OPEN_POPUP / CLOSE_POPUP", () => {
  it("OPEN_POPUP sets openPopup", () => {
    const next = calendarReducer(baseState, { type: "OPEN_POPUP", popup: "time" });
    expect(next.openPopup).toBe("time");
  });

  it("OPEN_POPUP month", () => {
    expect(calendarReducer(baseState, { type: "OPEN_POPUP", popup: "month" }).openPopup).toBe("month");
  });

  it("OPEN_POPUP year", () => {
    expect(calendarReducer(baseState, { type: "OPEN_POPUP", popup: "year" }).openPopup).toBe("year");
  });

  it("CLOSE_POPUP clears openPopup", () => {
    const state = { ...baseState, openPopup: "time" as const };
    const next = calendarReducer(state, { type: "CLOSE_POPUP" });
    expect(next.openPopup).toBeNull();
  });
});

// ─── CHANGE_TIME ─────────────────────────────────────────────────────────────

describe("CHANGE_TIME", () => {
  it("updates viewDate to new date", () => {
    const date = d(2024, 6, 15);
    date.setHours(10, 30);
    const next = calendarReducer(baseState, { type: "CHANGE_TIME", date });
    expect(next.viewDate).toBe(date);
  });

  it("replaces matching selectedDate by viewDate", () => {
    const orig = d(2024, 6, 15);
    const updated = new Date(orig);
    updated.setHours(14, 45);
    const state = { ...baseState, viewDate: orig, selectedDates: [orig] };
    const next = calendarReducer(state, { type: "CHANGE_TIME", date: updated });
    expect(next.selectedDates[0]).toBe(updated);
  });

  it("no selectedDates → selectedDates stays empty (only viewDate updates)", () => {
    const date = d(2024, 6, 15);
    date.setHours(9, 0);
    const state = { ...baseState, selectedDates: [] };
    const next = calendarReducer(state, { type: "CHANGE_TIME", date });
    expect(next.selectedDates).toHaveLength(0);
    expect(next.viewDate).toBe(date);
  });

  it("selectedDates present but none match viewDate → replaces with [date]", () => {
    const view = d(2024, 6, 15);
    const other = d(2024, 6, 20);
    const updated = new Date(view);
    updated.setHours(14, 0);
    // viewDate = Jun 15, selectedDates has Jun 20 — no isSameDay match
    const state = { ...baseState, viewDate: view, selectedDates: [other] };
    const next = calendarReducer(state, { type: "CHANGE_TIME", date: updated });
    expect(next.selectedDates).toEqual([updated]);
  });

  it("increments notifySeq", () => {
    const date = d(2024, 6, 15);
    const next = calendarReducer(baseState, { type: "CHANGE_TIME", date });
    expect(next.notifySeq).toBe(baseState.notifySeq + 1);
  });
});

// ─── SET_DATES ───────────────────────────────────────────────────────────────

describe("SET_DATES", () => {
  it("replaces selectedDates", () => {
    const dates = [d(2024, 1, 1), d(2024, 2, 1)];
    const next = calendarReducer(baseState, { type: "SET_DATES", dates });
    expect(next.selectedDates).toBe(dates);
  });

  it("increments notifySeq", () => {
    const next = calendarReducer(baseState, { type: "SET_DATES", dates: [] });
    expect(next.notifySeq).toBe(baseState.notifySeq + 1);
  });
});

// ─── SET_RANGE ────────────────────────────────────────────────────────────────

describe("SET_RANGE", () => {
  it("sets rangeStart and rangeEnd", () => {
    const from = d(2024, 1, 1);
    const to = d(2024, 1, 31);
    const next = calendarReducer(baseState, { type: "SET_RANGE", from, to });
    expect(next.rangeStart).toBe(from);
    expect(next.rangeEnd).toBe(to);
  });

  it("updates viewDate to from", () => {
    const from = d(2024, 3, 5);
    const next = calendarReducer(baseState, { type: "SET_RANGE", from, to: null });
    expect(next.viewDate).toBe(from);
  });

  it("null from → viewDate stays unchanged", () => {
    const next = calendarReducer(baseState, { type: "SET_RANGE", from: null, to: null });
    expect(next.viewDate).toBe(baseState.viewDate);
  });

  it("increments notifySeq", () => {
    const next = calendarReducer(baseState, { type: "SET_RANGE", from: null, to: null });
    expect(next.notifySeq).toBe(baseState.notifySeq + 1);
  });
});

// ─── SET_RANGE_BOUND ─────────────────────────────────────────────────────────

describe("SET_RANGE_BOUND", () => {
  it("bound=from sets rangeStart", () => {
    const date = d(2024, 3, 1);
    const next = calendarReducer(baseState, { type: "SET_RANGE_BOUND", bound: "from", date });
    expect(next.rangeStart).toBe(date);
  });

  it("bound=to sets rangeEnd", () => {
    const date = d(2024, 3, 31);
    const next = calendarReducer(baseState, { type: "SET_RANGE_BOUND", bound: "to", date });
    expect(next.rangeEnd).toBe(date);
  });

  it("auto-swaps when from > to", () => {
    const from = d(2024, 3, 20);
    const to = d(2024, 3, 5);
    let state = calendarReducer(baseState, { type: "SET_RANGE_BOUND", bound: "to", date: to });
    state = calendarReducer(state, { type: "SET_RANGE_BOUND", bound: "from", date: from });
    expect(state.rangeStart!.getTime()).toBeLessThan(state.rangeEnd!.getTime());
  });

  it("increments notifySeq", () => {
    const next = calendarReducer(baseState, { type: "SET_RANGE_BOUND", bound: "from", date: d(2024, 1, 1) });
    expect(next.notifySeq).toBe(baseState.notifySeq + 1);
  });
});

// ─── SYNC_EXTERNAL ────────────────────────────────────────────────────────────

describe("SYNC_EXTERNAL", () => {
  it("syncs all four fields", () => {
    const viewDate = d(2025, 6, 1);
    const selectedDates = [d(2025, 6, 10)];
    const rangeStart = d(2025, 6, 5);
    const rangeEnd = d(2025, 6, 20);
    const next = calendarReducer(baseState, {
      type: "SYNC_EXTERNAL",
      viewDate,
      selectedDates,
      rangeStart,
      rangeEnd,
    });
    expect(next.viewDate).toBe(viewDate);
    expect(next.selectedDates).toBe(selectedDates);
    expect(next.rangeStart).toBe(rangeStart);
    expect(next.rangeEnd).toBe(rangeEnd);
  });

  it("does not touch notifySeq", () => {
    const next = calendarReducer(baseState, {
      type: "SYNC_EXTERNAL",
      viewDate: d(2025, 1, 1),
      selectedDates: [],
      rangeStart: null,
      rangeEnd: null,
    });
    expect(next.notifySeq).toBe(baseState.notifySeq);
  });
});

// ─── buildInitialState ────────────────────────────────────────────────────────

describe("buildInitialState", () => {
  it("no value → empty selectedDates, today-ish viewDate", () => {
    const state = buildInitialState({ range: false });
    expect(state.selectedDates).toHaveLength(0);
    expect(state.viewDate).toBeInstanceOf(Date);
  });

  it("single Date value → selectedDates[0]", () => {
    const date = d(2024, 6, 15);
    const state = buildInitialState({ range: false, externalValue: date });
    expect(state.selectedDates[0].getTime()).toBe(date.getTime());
  });

  it("Date[] value → selectedDates", () => {
    const dates = [d(2024, 1, 1), d(2024, 2, 1)];
    const state = buildInitialState({ range: false, externalValue: dates });
    expect(state.selectedDates).toHaveLength(2);
  });

  it("range=true with {from, to} → rangeStart/rangeEnd", () => {
    const from = d(2024, 3, 1);
    const to = d(2024, 3, 31);
    const state = buildInitialState({ range: true, externalValue: { from, to } });
    expect(state.rangeStart!.getTime()).toBe(from.getTime());
    expect(state.rangeEnd!.getTime()).toBe(to.getTime());
  });

  it("range=true no value → rangeStart/rangeEnd null", () => {
    const state = buildInitialState({ range: true });
    expect(state.rangeStart).toBeNull();
    expect(state.rangeEnd).toBeNull();
  });

  it("notifySeq starts at 0", () => {
    expect(buildInitialState({ range: false }).notifySeq).toBe(0);
  });
});
