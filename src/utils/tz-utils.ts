function normalizeTZ(tz: string): string {
  const m = tz.match(/^UTC([+-])(\d{1,2})$/i);
  if (m) {
    const sign = m[1] === "+" ? "-" : "+";
    return `Etc/GMT${sign}${parseInt(m[2], 10)}`;
  }
  return tz;
}

export function getTodayInTimezone(timeZone: string): Date {
  const tz = normalizeTZ(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)!.value, 10);
  return new Date(get("year"), get("month") - 1, get("day"));
}

export function toTZMidnight(localDate: Date, timeZone: string): Date {
  const tz = normalizeTZ(timeZone);
  const y = localDate.getFullYear();
  const mo = localDate.getMonth();
  const d = localDate.getDate();

  const noon = new Date(Date.UTC(y, mo, d, 12));
  const tzMs = new Date(
    noon.toLocaleString("en-US", { timeZone: tz }),
  ).getTime();
  const utcMs = new Date(
    noon.toLocaleString("en-US", { timeZone: "UTC" }),
  ).getTime();
  const offsetMs = tzMs - utcMs;

  return new Date(Date.UTC(y, mo, d, 0) - offsetMs);
}
