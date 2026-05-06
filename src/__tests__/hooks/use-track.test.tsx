import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrack } from "@/hooks/use-track";

describe("useTrack RAF lifecycle", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelSpy: ReturnType<typeof vi.spyOn>;
  let nextFrameId: number;
  let frames: Map<number, FrameRequestCallback>;

  const renderTrack = () =>
    renderHook(() =>
      useTrack({
        count: 12,
        initialIndex: 0,
        pixelsPerItem: 10,
        onChange: vi.fn(),
      }),
    );

  const flushNextFrame = () => {
    const next = frames.entries().next().value;
    if (!next) throw new Error("Expected a queued animation frame");

    const [id, callback] = next;
    frames.delete(id);
    act(() => {
      callback(performance.now());
    });
  };

  beforeEach(() => {
    nextFrameId = 1;
    frames = new Map();

    rafSpy = vi
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        const id = nextFrameId;
        nextFrameId += 1;
        frames.set(id, callback);
        return id;
      });

    cancelSpy = vi
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((id: number) => {
        frames.delete(id);
      });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not schedule animation frames while idle after mount", () => {
    renderTrack();

    expect(rafSpy).not.toHaveBeenCalled();
    expect(frames.size).toBe(0);
  });

  it("starts on scrollTo and stops after settling", () => {
    const { result } = renderTrack();

    act(() => {
      result.current.scrollTo(4);
    });

    expect(rafSpy).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 200 && frames.size > 0; i += 1) {
      flushNextFrame();
    }

    expect(frames.size).toBe(0);
    expect(result.current.position).toBe(Math.round(result.current.position));
  });

  it("cancels a queued animation frame on unmount", () => {
    const { result, unmount } = renderTrack();

    act(() => {
      result.current.scrollTo(4);
    });

    expect(frames.size).toBe(1);

    unmount();

    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(frames.size).toBe(0);
  });
});
