type SidePanelProps = {
  monthsGrid?: boolean;
  timeGrid?: boolean;
};

export const getTwoMonthsNarrowThreshold = (props: SidePanelProps): number => {
  const panelCount = (props.monthsGrid ? 1 : 0) + (props.timeGrid ? 1 : 0);
  if (panelCount === 2) return 1000;
  if (panelCount === 1) return 680;
  return 540;
};
