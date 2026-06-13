import { render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePageSlide } from "@/hooks/use-page-slide";

function Probe({ ordinal }: { ordinal: number }) {
  const ref = useRef<HTMLDivElement>(null);
  usePageSlide(ref, ordinal);
  return <div ref={ref} data-testid="pane" />;
}

const animateSpy = vi.fn(() => ({ cancel: vi.fn() }) as unknown as Animation);

describe("usePageSlide", () => {
  beforeEach(() => {
    animateSpy.mockClear();
    Element.prototype.animate = animateSpy;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does not animate on first mount", () => {
    render(<Probe ordinal={5} />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it("slides from the right when the ordinal advances", () => {
    const { rerender } = render(<Probe ordinal={5} />);
    rerender(<Probe ordinal={6} />);
    expect(animateSpy).toHaveBeenCalledTimes(1);
    const [frames] = animateSpy.mock.calls[0] as unknown as [Keyframe[]];
    expect(String(frames[0].transform)).toContain("translateX(14px)");
  });

  it("slides from the left when the ordinal retreats", () => {
    const { rerender } = render(<Probe ordinal={5} />);
    rerender(<Probe ordinal={4} />);
    const [frames] = animateSpy.mock.calls[0] as unknown as [Keyframe[]];
    expect(String(frames[0].transform)).toContain("translateX(-14px)");
  });

  it("respects prefers-reduced-motion", () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as unknown as typeof window.matchMedia;
    const { rerender } = render(<Probe ordinal={5} />);
    rerender(<Probe ordinal={6} />);
    expect(animateSpy).not.toHaveBeenCalled();
  });

  it("no-ops when the ordinal is unchanged", () => {
    const { rerender } = render(<Probe ordinal={5} />);
    rerender(<Probe ordinal={5} />);
    expect(animateSpy).not.toHaveBeenCalled();
  });
});
