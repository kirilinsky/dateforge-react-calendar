import { describe, expect, it, vi } from "vitest";
import { createWarner, WARNINGS } from "@/core/warnings";

function capturing() {
  const messages: { message: string; id: string }[] = [];
  const warner = createWarner((message, id) => messages.push({ message, id }));
  return { warner, messages };
}

describe("createWarner", () => {
  it("emits a built message with its id through the sink", () => {
    const { warner, messages } = capturing();
    warner.warnOnce("duplicatePresetId", "today");
    expect(messages).toHaveLength(1);
    expect(messages[0].id).toBe("duplicatePresetId");
    expect(messages[0].message).toContain('"today"');
    expect(messages[0].message).toContain("unique id"); // explains the fix
  });

  it("warns once per distinct message", () => {
    const { warner, messages } = capturing();
    warner.warnOnce("duplicatePresetId", "today");
    warner.warnOnce("duplicatePresetId", "today");
    expect(messages).toHaveLength(1);
  });

  it("treats different args as different warnings", () => {
    const { warner, messages } = capturing();
    warner.warnOnce("duplicatePresetId", "today");
    warner.warnOnce("duplicatePresetId", "this-week");
    expect(messages).toHaveLength(2);
  });

  it("reset() lets a warning fire again", () => {
    const { warner, messages } = capturing();
    warner.warnOnce("maxRangesReached", 3);
    warner.reset();
    warner.warnOnce("maxRangesReached", 3);
    expect(messages).toHaveLength(2);
  });

  it("isolates dedupe state between warners", () => {
    const a = capturing();
    const b = capturing();
    a.warner.warnOnce("emptySelectionAfterExclude");
    b.warner.warnOnce("emptySelectionAfterExclude");
    expect(a.messages).toHaveLength(1);
    expect(b.messages).toHaveLength(1);
  });

  it("is silent in production builds", () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    try {
      const { warner, messages } = capturing();
      warner.warnOnce("invalidTimeZone", "Mars/Phobos");
      expect(messages).toHaveLength(0);
    } finally {
      process.env.NODE_ENV = prev;
    }
  });

  it("falls back to console.warn by default", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      createWarner().warnOnce("invalidFirstDayOfWeek", 9);
      expect(spy).toHaveBeenCalledOnce();
      expect(spy.mock.calls[0][0]).toContain("[dateforge]");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("WARNINGS registry", () => {
  it("every builder returns a non-empty string", () => {
    expect(WARNINGS.invalidFirstDayOfWeek(9)).toBeTruthy();
    expect(WARNINGS.malformedDateRule("bad range").length).toBeGreaterThan(0);
    expect(WARNINGS.emptySelectionAfterExclude()).toBeTruthy();
  });
});
