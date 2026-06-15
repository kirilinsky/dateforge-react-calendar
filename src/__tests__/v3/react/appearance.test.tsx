import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/react-v3/calendar";
import {
  createAppearance,
  resolveAppearance,
} from "@/styles-v3/appearance-tokens";
import { APPEARANCES, loft, zenith } from "@/styles-v3/appearances";
import { buildConfig, D } from "../fixtures/builders";

function root(container: HTMLElement) {
  return container.querySelector("[data-dateforge-root]") as HTMLElement;
}

function mount(appearance?: Parameters<typeof Calendar>[0]["appearance"]) {
  return render(
    <Calendar
      config={buildConfig({ mode: "single" })}
      initialView={D(2026, 6, 1)}
      appearance={appearance}
    >
      <div />
    </Calendar>,
  );
}

describe("appearance system", () => {
  it("createAppearance maps tokens to --cal-* vars", () => {
    const a = createAppearance({ radius: "1em", spacing: "2em" });
    expect(a.vars).toEqual({ "--cal-radius": "1em", "--cal-spacing": "2em" });
  });

  it("resolveAppearance: name → data-appearance, object → inline vars", () => {
    expect(resolveAppearance("zenith")).toEqual({ dataAppearance: "zenith" });
    expect(
      resolveAppearance(createAppearance({ radius: "1em" })).style,
    ).toEqual({ "--cal-radius": "1em" });
    expect(resolveAppearance(undefined)).toEqual({});
  });

  it("no appearance prop → no data-appearance (v3 default look)", () => {
    const { container } = mount();
    expect(root(container).getAttribute("data-appearance")).toBeNull();
  });

  it("string appearance sets data-appearance on the root", () => {
    const { container } = mount("zenith");
    expect(root(container).getAttribute("data-appearance")).toBe("zenith");
  });

  it("custom appearance applies inline --cal-* vars (no data-appearance)", () => {
    const { container } = mount(createAppearance({ radius: "0.3em" }));
    const el = root(container);
    expect(el.getAttribute("data-appearance")).toBeNull();
    expect(el.style.getPropertyValue("--cal-radius")).toBe("0.3em");
  });

  it("built-in zenith object carries the v2-default radius", () => {
    const { container } = mount(zenith);
    expect(root(container).style.getPropertyValue("--cal-radius")).toBe(
      "0.5em",
    );
  });

  it("ships the 8 ported appearances", () => {
    expect(Object.keys(APPEARANCES).sort()).toEqual([
      "airy",
      "bubble",
      "compact",
      "loft",
      "press",
      "soft",
      "square",
      "zenith",
    ]);
  });

  it("ported loft object carries its container radius", () => {
    const { container } = mount(loft);
    expect(
      root(container).style.getPropertyValue("--cal-container-radius"),
    ).toBe("2.5em");
  });

  it("appearances drive UIKit control tokens (border, padding, weight)", () => {
    const { container } = mount(loft);
    const el = root(container);
    // loft = borderless container AND buttons + roomy control box.
    expect(el.style.getPropertyValue("--cal-border")).toBe("0px");
    expect(el.style.getPropertyValue("--cal-control-border")).toBe("0px");
    expect(el.style.getPropertyValue("--cal-control-padding")).toBe(
      "0.5em 0.95em",
    );
    expect(el.style.getPropertyValue("--cal-control-weight")).toBe("600");
    expect(el.style.getPropertyValue("--cal-tile-padding")).toBe(
      "0.5em 0.75em",
    );
  });

  it("zenith mirrors the v2 default: bordered container, borderless buttons", () => {
    const { container } = mount(zenith);
    const el = root(container);
    expect(el.style.getPropertyValue("--cal-border")).toBe("1px"); // container
    expect(el.style.getPropertyValue("--cal-control-border")).toBe("0px"); // buttons
  });

  it("appearances drive day weight + height (not width)", () => {
    const wide = root(mount(loft).container);
    expect(wide.style.getPropertyValue("--cal-day-weight")).toBe("500");
    expect(wide.style.getPropertyValue("--cal-day-height")).toBe("3em");
    // No --cal-day-ratio anymore (it skewed cell width vs the headers).
    expect(wide.style.getPropertyValue("--cal-day-ratio")).toBe("");
    // Default sets none — day cells keep the v3 floor/weight.
    const def = root(mount().container);
    expect(def.style.getPropertyValue("--cal-day-weight")).toBe("");
    expect(def.style.getPropertyValue("--cal-day-height")).toBe("");
  });

  it("default (no appearance) sets no control vars — buttons unchanged", () => {
    const { container } = mount();
    const el = root(container);
    expect(el.style.getPropertyValue("--cal-control-padding")).toBe("");
    expect(el.style.getPropertyValue("--cal-border")).toBe("");
  });
});
