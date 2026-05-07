import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useToday } from "@/hooks/use-today";

describe("useToday", () => {
  it("returns a Date instance after mount on client", () => {
    const { result } = renderHook(() => useToday());
    expect(result.current).toBeInstanceOf(Date);
    expect(Number.isNaN((result.current as Date).getTime())).toBe(false);
  });

  it("resolved Date is close to system time", () => {
    const before = Date.now();
    const { result } = renderHook(() => useToday());
    const after = Date.now();
    const t = (result.current as Date).getTime();
    expect(t).toBeGreaterThanOrEqual(before);
    expect(t).toBeLessThanOrEqual(after);
  });
});
