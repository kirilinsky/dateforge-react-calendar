import { act, renderHook } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useItemWidth } from "@/hooks/use-item-width";

type ROCallback = (entries: ResizeObserverEntry[]) => void;
let roCallback: ROCallback | null = null;

const MockResizeObserver = vi.fn(function (cb: ROCallback) {
  return {
    observe: vi.fn(() => {
      roCallback = cb;
    }),
    disconnect: vi.fn(() => {
      roCallback = null;
    }),
  };
});

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  roCallback = null;
});

afterEach(() => {
  vi.unstubAllGlobals();
  MockResizeObserver.mockClear();
});

function makeContainer(itemWidth?: number) {
  const container = document.createElement("div");
  if (itemWidth !== undefined) {
    const item = document.createElement("div");
    item.setAttribute("data-item", "");
    Object.defineProperty(item, "offsetWidth", {
      value: itemWidth,
      configurable: true,
    });
    container.appendChild(item);
  }
  document.body.appendChild(container);
  return container;
}

describe("useItemWidth", () => {
  it("returns initialWidth before ResizeObserver fires", () => {
    const container = makeContainer();
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 44);
    });
    expect(result.current).toBe(44);
    document.body.removeChild(container);
  });

  it("updates when ResizeObserver fires with [data-item] child", () => {
    const container = makeContainer(80);
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 44);
    });

    act(() => {
      roCallback?.([]);
    });

    expect(result.current).toBe(80);
    document.body.removeChild(container);
  });

  it("no [data-item] child → stays at initialWidth", () => {
    const container = makeContainer(); // no item child
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 52);
    });

    act(() => {
      roCallback?.([]);
    });

    expect(result.current).toBe(52);
    document.body.removeChild(container);
  });

  it("ResizeObserver undefined (SSR) → no crash, returns initialWidth", () => {
    vi.stubGlobal("ResizeObserver", undefined);
    const container = makeContainer(80);
    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 44);
    });
    expect(result.current).toBe(44);
    document.body.removeChild(container);
  });

  it("custom selector respected", () => {
    const container = document.createElement("div");
    const item = document.createElement("div");
    item.setAttribute("data-custom", "");
    Object.defineProperty(item, "offsetWidth", {
      value: 100,
      configurable: true,
    });
    container.appendChild(item);
    document.body.appendChild(container);

    const { result } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 44, "[data-custom]");
    });

    act(() => {
      roCallback?.([]);
    });

    expect(result.current).toBe(100);
    document.body.removeChild(container);
  });

  it("disconnects ResizeObserver on unmount", () => {
    const container = makeContainer();
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      return useItemWidth(ref, 44);
    });
    const instance = MockResizeObserver.mock.results[0]?.value;
    unmount();
    expect(instance?.disconnect).toHaveBeenCalled();
    document.body.removeChild(container);
  });
});
