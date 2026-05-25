import { useLayoutEffect } from "react";

/**
 * Freezes `new Date()` and `Date.now()` globally for the duration of the
 * component's lifecycle. Used in stories that render live clocks (e.g.
 * `<CalendarNav showNowTime />`) so Chromatic snapshots are deterministic.
 *
 * Layout-effect timing matters: the override must be installed before the
 * library reads the clock during render. Cleanup restores the real Date.
 */
export const useFrozenTime = (frozenAt: Date): void => {
  useLayoutEffect(() => {
    const RealDate = globalThis.Date;
    const fixed = frozenAt.getTime();

    class FrozenDate extends RealDate {
      // biome-ignore lint/suspicious/noExplicitAny: variadic Date constructor
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(fixed);
        } else {
          // biome-ignore lint/suspicious/noExplicitAny: pass-through
          super(...(args as [any]));
        }
      }
      static now(): number {
        return fixed;
      }
    }

    globalThis.Date = FrozenDate as DateConstructor;
    return () => {
      globalThis.Date = RealDate;
    };
  }, [frozenAt]);
};
