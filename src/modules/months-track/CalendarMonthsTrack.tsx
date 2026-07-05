import { type CSSProperties, useMemo } from "react";
import { boundDateOf } from "../../core/bound";
import { calendarDate, daysInMonth } from "../../core/calendar-date";
import { useLabels } from "../../react/labels-context";
import { useCalendarActions, useCalendarStore } from "../../react/provider";
import { useStoreSelector } from "../../react/use-store-selector";
import { VirtualTrack } from "../../react/VirtualTrack";
import track from "../../react/virtual-track.module.css";

export type CalendarMonthsTrackProps = {
  short?: boolean;
  /** Show the year as a sub-label on the active month. */
  showYearLabel?: boolean;
  /** Span modes: edit a range bound (`"from"`/`"to"`)'s month instead of view. */
  bound?: "from" | "to";
  col?: number | string;
  className?: string;
  /** Per-module theme override (`data-theme` on the track). */
  theme?: string;
  /** Per-module scheme override (`data-scheme` on the track). */
  scheme?: "light" | "dark" | "auto";
  onMonthSelect?: (year: number, month: number) => void;
};

function monthNames(locale: string | undefined, short: boolean): string[] {
  const fmt = new Intl.DateTimeFormat(locale, {
    month: short ? "short" : "long",
  });
  return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2021, m, 1)));
}

/**
 * Months as a horizontal physics track (the v2 months-track). Landing on a
 * month navigates the view. Circular; clamps to `min`/`max` within the year.
 */
export function CalendarMonthsTrack({
  short = true,
  showYearLabel = false,
  bound,
  col,
  className,
  theme,
  scheme,
  onMonthSelect,
}: CalendarMonthsTrackProps) {
  const store = useCalendarStore();
  const config = store.getConfig();
  const t = useLabels();
  const { navigateTo, setBoundDate } = useCalendarActions();
  const viewDate = useStoreSelector(store, (s) => s.view.viewDate);
  const selection = useStoreSelector(store, (s) => s.selection);

  const boundDate = boundDateOf(selection, bound);
  const refDate = boundDate ?? viewDate;
  const year = refDate.year;
  const names = useMemo(
    () => monthNames(config.locale, short),
    [config.locale, short],
  );
  const longFmt = useMemo(
    () => new Intl.DateTimeFormat(config.locale, { month: "long" }),
    [config.locale],
  );

  const minIndex =
    config.min && config.min.year === year ? config.min.month - 1 : undefined;
  const maxIndex =
    config.max && config.max.year === year ? config.max.month - 1 : undefined;
  const minIdx = minIndex ?? 0;
  const maxIdx = maxIndex ?? 11;

  // Long month names overflow the default item width — widen the (uniform) item
  // to fit the longest name; short names keep the appearance default.
  const trackStyle = useMemo<CSSProperties | undefined>(() => {
    if (short) return undefined;
    const longest = Math.max(...names.map((n) => n.length));
    return {
      "--cal-size-track-item": `${(longest * 0.62 + 1.4).toFixed(2)}em`,
    } as CSSProperties;
  }, [short, names]);

  return (
    <VirtualTrack
      dataArea="months-track"
      className={className}
      style={trackStyle}
      count={12}
      initialIndex={refDate.month - 1}
      circular
      minIndex={minIndex}
      maxIndex={maxIndex}
      half={4}
      initialItemWidth={52}
      ariaLabel={t("monthTrack")}
      getAriaValueNow={(i) => i + 1}
      getAriaValueMin={() => minIdx + 1}
      getAriaValueMax={() => maxIdx + 1}
      getAriaValueText={(i) => longFmt.format(new Date(year, i, 1))}
      col={col}
      theme={theme}
      scheme={scheme}
      onChange={(index) => {
        const m = index + 1;
        if (boundDate) {
          const day = Math.min(boundDate.day, daysInMonth(year, m));
          setBoundDate(calendarDate(year, m, day), bound!);
        } else {
          navigateTo(calendarDate(year, m, 1));
        }
        onMonthSelect?.(year, m);
      }}
      renderItem={({ idx, isActive }) =>
        isActive && showYearLabel ? (
          <span className={track.activeLabel}>
            <span>{names[idx]}</span>
            <span className={track.subLabel}>{year}</span>
          </span>
        ) : (
          names[idx]
        )
      }
    />
  );
}
