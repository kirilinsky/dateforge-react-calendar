import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTrack } from "@/hooks/use-track";

type UseTrackOptions = Parameters<typeof useTrack>[0];

describe("useTrack RAF lifecycle", () => {
  let rafSpy: ReturnType<typeof vi.spyOn>;
  let cancelSpy: ReturnType<typeof vi.spyOn>;
  let nextFrameId: number;
  let frames: Map<number, FrameRequestCallback>;

  const renderTrack = (overrides: Partial<UseTrackOptions> = {}) =>
    renderHook(() =>
      useTrack({
        count: 12,
        initialIndex: 0,
        pixelsPerItem: 10,
        onChange: vi.fn(),
        ...overrides,
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

  const flushFrames = (count: number) => {
    for (let i = 0; i < count && frames.size > 0; i += 1) {
      flushNextFrame();
    }
  };

  const pointerEvent = (type: string, clientX: number) => {
    const event = new Event(type) as PointerEvent;
    Object.defineProperty(event, "clientX", { value: clientX });
    return event;
  };

  const wheelEvent = (deltaX: number, deltaY: number, deltaMode: number) => {
    const event = new Event("wheel", {
      bubbles: true,
      cancelable: true,
    }) as WheelEvent;
    Object.defineProperty(event, "deltaX", { value: deltaX });
    Object.defineProperty(event, "deltaY", { value: deltaY });
    Object.defineProperty(event, "deltaMode", { value: deltaMode });
    return event;
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

    Object.defineProperty(navigator, "vibrate", {
      configurable: true,
      value: vi.fn(),
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

  it("syncs when initialIndex changes", () => {
    const { result, rerender } = renderHook(
      ({ initialIndex }) =>
        useTrack({
          count: 12,
          initialIndex,
          pixelsPerItem: 10,
          onChange: vi.fn(),
        }),
      { initialProps: { initialIndex: 0 } },
    );

    rerender({ initialIndex: 5 });
    expect(frames.size).toBe(1);

    flushFrames(60);

    expect(result.current.position).toBe(5);
    expect(frames.size).toBe(0);
  });

  it("syncs circular initialIndex changes through the shortest path", () => {
    const { result, rerender } = renderHook(
      ({ initialIndex }) =>
        useTrack({
          count: 12,
          initialIndex,
          pixelsPerItem: 10,
          circular: true,
          onChange: vi.fn(),
        }),
      { initialProps: { initialIndex: 0 } },
    );

    rerender({ initialIndex: 11 });
    flushFrames(40);

    expect(result.current.position).toBeGreaterThan(10);
  });

  it("rescales position when pixelsPerItem changes", () => {
    const { result, rerender } = renderHook(
      ({ pixelsPerItem }) =>
        useTrack({
          count: 12,
          initialIndex: 2,
          pixelsPerItem,
          onChange: vi.fn(),
        }),
      { initialProps: { pixelsPerItem: 10 } },
    );

    rerender({ pixelsPerItem: 20 });

    expect(result.current.position).toBe(2);
  });

  it("updates position during pointer drag and vibrates on gesture change", () => {
    const onChange = vi.fn();
    const { result } = renderTrack({ onChange });

    act(() => {
      result.current.onPointerDown({ clientX: 50 } as React.PointerEvent);
      window.dispatchEvent(pointerEvent("pointermove", 20));
    });

    expect(result.current.position).toBe(3);
    expect(onChange).toHaveBeenCalledWith(3);
    expect(navigator.vibrate).toHaveBeenCalledWith(8);

    act(() => {
      window.dispatchEvent(pointerEvent("pointerup", 20));
    });

    expect(frames.size).toBe(1);
  });

  it("ignores pointer moves before drag starts", () => {
    const onChange = vi.fn();
    const { result } = renderTrack({ onChange });

    act(() => {
      window.dispatchEvent(pointerEvent("pointermove", 20));
    });

    expect(result.current.position).toBe(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("wraps circular pointer movement", () => {
    const { result } = renderTrack({ circular: true });

    act(() => {
      result.current.onPointerDown({ clientX: 10 } as React.PointerEvent);
      window.dispatchEvent(pointerEvent("pointermove", 30));
    });

    expect(result.current.position).toBe(10);
  });

  it("handles wheel input and ignores zero deltas", () => {
    const ref = { current: document.createElement("div") };
    const onChange = vi.fn();
    const { result } = renderTrack({ ref, onChange });

    act(() => {
      ref.current.dispatchEvent(wheelEvent(0, 0, 0));
    });
    expect(result.current.position).toBe(0);

    act(() => {
      ref.current.dispatchEvent(wheelEvent(0, 20, 0));
    });
    expect(result.current.position).toBe(2);

    act(() => {
      ref.current.dispatchEvent(wheelEvent(-2, 1, 1));
    });
    expect(onChange).toHaveBeenCalled();
  });

  it("wraps circular wheel input", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderTrack({ ref, circular: true });

    act(() => {
      ref.current.dispatchEvent(wheelEvent(-20, 0, 0));
    });

    expect(result.current.position).toBe(10);
  });

  it("keeps scrollTo bounded by min and max indexes", () => {
    const { result } = renderTrack({ minIndex: 2, maxIndex: 4 });

    act(() => {
      result.current.scrollTo(10);
    });
    flushFrames(80);

    expect(result.current.position).toBeGreaterThanOrEqual(2);
    expect(result.current.position).toBeLessThanOrEqual(4);
  });

  it("exposes no-op pointer handlers for React props", () => {
    const { result } = renderTrack();

    result.current.onPointerMove();
    result.current.onPointerUp();
    result.current.onPointerCancel();

    expect(result.current.position).toBe(0);
  });
});
