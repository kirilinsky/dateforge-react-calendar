import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollAccumulator } from "@/hooks/use-scroll-accumulator";

function makeEl() {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function fireWheel(el: Element, deltaY: number) {
  el.dispatchEvent(
    new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }),
  );
}

function fireTouchStart(el: Element, clientY: number) {
  el.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [{ clientY } as Touch],
      bubbles: true,
      cancelable: true,
    }),
  );
}

function fireTouchMove(el: Element, clientY: number) {
  el.dispatchEvent(
    new TouchEvent("touchmove", {
      touches: [{ clientY } as Touch],
      bubbles: true,
      cancelable: true,
    }),
  );
}

function fireTouchEnd(el: Element) {
  el.dispatchEvent(
    new TouchEvent("touchend", { bubbles: true, cancelable: true }),
  );
}

describe("useScrollAccumulator", () => {
  let el: HTMLDivElement;
  beforeEach(() => {
    el = makeEl();
  });

  it("wheel delta below threshold → no step", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { wheelThreshold: 40 });
    });
    fireWheel(el, 20);
    expect(onStep).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("wheel delta crosses threshold → step fires with +1", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { wheelThreshold: 40 });
    });
    fireWheel(el, 50);
    expect(onStep).toHaveBeenCalledWith(1);
    document.body.removeChild(el);
  });

  it("wheel negative delta crosses threshold → step fires with -1", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { wheelThreshold: 40 });
    });
    fireWheel(el, -50);
    expect(onStep).toHaveBeenCalledWith(-1);
    document.body.removeChild(el);
  });

  it("accumulator resets after threshold crossed — second small delta no step", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { wheelThreshold: 40 });
    });
    fireWheel(el, 50); // crosses → fires, resets
    fireWheel(el, 10); // below threshold after reset
    expect(onStep).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it("requireHover=true → wheel ignored when not hovered", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, {
        wheelThreshold: 40,
        requireHover: true,
      });
    });
    fireWheel(el, 100);
    expect(onStep).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("requireHover=true → wheel fires when hovered", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, {
        wheelThreshold: 40,
        requireHover: true,
      });
    });
    el.dispatchEvent(new MouseEvent("mouseenter", { bubbles: true }));
    fireWheel(el, 100);
    expect(onStep).toHaveBeenCalledWith(1);
    document.body.removeChild(el);
  });

  it("touch accumulates and fires at threshold", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { touchThreshold: 28 });
    });
    // finger moves UP: start=100, move=65 → delta=-35 → touchAccum -= (-35) = +35 → dir=+1
    fireTouchStart(el, 100);
    fireTouchMove(el, 65);
    expect(onStep).toHaveBeenCalledWith(1);
    document.body.removeChild(el);
  });

  it("touch move below threshold → no step", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { touchThreshold: 28 });
    });
    fireTouchStart(el, 100);
    fireTouchMove(el, 90); // delta = 10 → not enough
    expect(onStep).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("touchend resets accumulator", () => {
    const onStep = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep, { touchThreshold: 28 });
    });
    fireTouchStart(el, 100);
    fireTouchMove(el, 85); // 15px — below threshold
    fireTouchEnd(el);
    fireTouchStart(el, 100);
    fireTouchMove(el, 87); // 13px after reset — still below
    expect(onStep).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it("removes event listeners on unmount", () => {
    const onStep = vi.fn();
    const removeSpy = vi.spyOn(el, "removeEventListener");
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(el);
      useScrollAccumulator(ref, onStep);
    });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("wheel", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("touchmove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("touchend", expect.any(Function));
    document.body.removeChild(el);
  });
});
