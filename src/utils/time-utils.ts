export const padTime = (n: number) => n.toString().padStart(2, "0");

export const getDrumValue = (
  current: number,
  offset: number,
  max: number,
): number => {
  const val = (current + offset) % max;
  return val < 0 ? val + max : val;
};

export const addTime = (date: Date, amount: number, unit: "h" | "m") => {
  const n = new Date(date.getTime());
  if (unit === "h") n.setHours(getDrumValue(n.getHours(), amount, 24));
  else n.setMinutes(getDrumValue(n.getMinutes(), amount, 60));
  return n;
};

export const getTimeString = (date: Date, hour12 = false): string =>
  new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    hour12,
  }).format(date);
