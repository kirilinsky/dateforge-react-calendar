import { useClientValue } from "./use-client-value";

/**
 * SSR-safe "today" Date. Returns `null` on the server and during the first
 * client render, then resolves to `new Date()` after mount.
 *
 * Use this instead of `new Date()` as the initial value for a controlled
 * `<Calendar value={...} />` in SSR contexts (Next.js, Remix, etc.).
 * `new Date()` evaluated on the server vs the client returns different
 * timestamps — and across midnight even different days — which causes a
 * React hydration mismatch and can leave two day cells visually selected.
 *
 * @example
 * const today = useToday();
 * const [date, setDate] = useState<Date | null>(null);
 * useEffect(() => { if (today && !date) setDate(today); }, [today]);
 * return <Calendar value={date} onChange={setDate}><CalendarDays /></Calendar>;
 */
export function useToday(): Date | null {
  return useClientValue<Date | null>(() => new Date(), null);
}
