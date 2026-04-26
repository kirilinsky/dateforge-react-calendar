import { useEffect, useLayoutEffect, useState } from "react";

// SSR-safe layout effect: useLayoutEffect on client so the resolved value is
// applied before the browser paints (no flash), useEffect on server (no
// warning, no DOM access). Aliasing the symbol — not switching at call site —
// keeps React's hook-order rule intact.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Returns `fallback` on the first (server-side or pre-hydration) render and the
 * result of `getter()` after mount. Use this for any value that depends on the
 * browser environment (matchMedia, Date, Intl, navigator, ...) so server-rendered
 * HTML matches the client's first render and React does not produce a hydration
 * mismatch warning.
 *
 * The getter runs in a layout effect — the resolved value is applied
 * synchronously before the browser paints, so consumers like `theme="auto"`
 * do not flash the fallback (light) before resolving (dark).
 * Re-running requires remounting the consumer — by design.
 */
export function useClientValue<T>(getter: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useIsoLayoutEffect(() => {
    setValue(getter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
