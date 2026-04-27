import { renderHook } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "@/hooks/use-focus-trap";

function makeContainer(...buttonCount: number[]) {
  const div = document.createElement("div");
  const count = buttonCount[0] ?? 3;
  for (let i = 0; i < count; i++) {
    const btn = document.createElement("button");
    btn.textContent = `btn${i}`;
    div.appendChild(btn);
  }
  document.body.appendChild(div);
  return div;
}

function tabKey(shiftKey = false) {
  return new KeyboardEvent("keydown", {
    key: "Tab",
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
}

function escKey() {
  return new KeyboardEvent("keydown", {
    key: "Escape",
    bubbles: true,
    cancelable: true,
  });
}

describe("useFocusTrap", () => {
  it("focuses first focusable element on mount", () => {
    const container = makeContainer(3);
    const buttons = container.querySelectorAll("button");
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      useFocusTrap(ref, { onEscape: vi.fn() });
    });
    expect(document.activeElement).toBe(buttons[0]);
    document.body.removeChild(container);
  });

  it("Escape calls onEscape", () => {
    const container = makeContainer(2);
    const onEscape = vi.fn();
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      useFocusTrap(ref, { onEscape });
    });
    document.dispatchEvent(escKey());
    expect(onEscape).toHaveBeenCalled();
    document.body.removeChild(container);
  });

  it("Tab on last element wraps to first", () => {
    const container = makeContainer(3);
    const buttons = Array.from(container.querySelectorAll("button"));
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      useFocusTrap(ref, { onEscape: vi.fn() });
    });
    buttons[buttons.length - 1].focus();
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    document.dispatchEvent(tabKey(false));
    expect(document.activeElement).toBe(buttons[0]);
    document.body.removeChild(container);
  });

  it("Shift+Tab on first element wraps to last", () => {
    const container = makeContainer(3);
    const buttons = Array.from(container.querySelectorAll("button"));
    renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      useFocusTrap(ref, { onEscape: vi.fn() });
    });
    buttons[0].focus();
    document.dispatchEvent(tabKey(true));
    expect(document.activeElement).toBe(buttons[buttons.length - 1]);
    document.body.removeChild(container);
  });

  it("removes keydown listener on unmount", () => {
    const container = makeContainer(2);
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(
        container as unknown as HTMLDivElement,
      );
      useFocusTrap(ref, { onEscape: vi.fn() });
    });
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
    removeSpy.mockRestore();
    document.body.removeChild(container);
  });
});
