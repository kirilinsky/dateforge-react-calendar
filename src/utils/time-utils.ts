export const padTime = (n: number) => n.toString().padStart(2, "0");

export const getDrumValue = (
  current: number,
  offset: number,
  max: number,
): number => {
  const val = (current + offset) % max;
  return val < 0 ? val + max : val;
};
