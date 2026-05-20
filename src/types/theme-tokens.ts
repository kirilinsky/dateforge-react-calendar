/**
 * token keys map directly to CSS variable suffixes: --c-{key}
 * accent=a, activeText=at, todayDot=t-d, backdrop=b, highlight=h, tone=t, text=c, stroke=s, shadow=x, disabled=d,
 * mutedText=m, disabledText=dt, weekend=we, range=r, error=e, outOfMonth=oom
 */
export type ThemeTokens = {
  accent: string;
  activeText: string;
  todayDot: string;
  backdrop: string;
  highlight: string;
  tone: string;
  text: string;
  stroke: string;
  shadow: string;
  disabled: string;
  mutedText: string;
  disabledText: string;
  weekend: string;
  range: string;
  error: string;
  outOfMonth?: string;
};

export const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  accent: "--c-a",
  activeText: "--c-at",
  todayDot: "--c-t-d",
  backdrop: "--c-b",
  highlight: "--c-h",
  tone: "--c-t",
  text: "--c-c",
  stroke: "--c-s",
  shadow: "--c-x",
  disabled: "--c-d",
  mutedText: "--c-m",
  disabledText: "--c-dt",
  weekend: "--c-we",
  range: "--c-r",
  error: "--c-e",
  outOfMonth: "--c-oom",
};
