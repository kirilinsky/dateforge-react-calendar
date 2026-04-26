import { useEffect, useState } from "react";

/**
 * Returns `fallback` on the first (server-side or pre-hydration) render and the
 * result of `getter()` after mount. Use this for any value that depends on the
 * browser environment (matchMedia, Date, Intl, navigator, ...) so server-rendered
 * HTML matches the client's first render and React does not produce a hydration
 * mismatch warning.
 *
 * The getter is called once after mount via useEffect. Re-running it requires
 * remounting the consumer — by design; values that need to stay live should use
 * their own subscription effect on top.
 */
export function useClientValue<T>(getter: () => T, fallback: T): T {
  const [value, setValue] = useState<T>(fallback);
  useEffect(() => {
    setValue(getter());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
