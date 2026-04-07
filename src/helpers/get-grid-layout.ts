import { CSSProperties } from "react";

type GridLayoutProps = {
  time?: boolean;
  timeGrid?: boolean;
  presets?: boolean;
  monthsGrid?: boolean;
  years?: boolean;
  months?: boolean;
  compactYears?: boolean;
  compactMonths?: boolean;
  selectedDates?: boolean;
  twoMonthsLayout?: boolean;
  monthsColumn?: boolean;
};

export type LayoutMode = "wide" | "medium" | "stacked";

export const getTwoMonthsNarrowThreshold = (
  props: Pick<GridLayoutProps, "monthsGrid" | "timeGrid">,
) => {
  const panelCount = (props.monthsGrid ? 1 : 0) + (props.timeGrid ? 1 : 0);
  if (panelCount === 2) return 1000;
  if (panelCount === 1) return 680;
  return 540;
};

export const getLayoutMode = (
  containerWidth: number,
  props: Pick<
    GridLayoutProps,
    "monthsGrid" | "timeGrid" | "twoMonthsLayout" | "monthsColumn"
  >,
): LayoutMode => {
  if (props.twoMonthsLayout) {
    const threshold = getTwoMonthsNarrowThreshold(props);
    if (
      !!props.monthsColumn ||
      (containerWidth > 0 && containerWidth < threshold)
    ) {
      return "stacked";
    }
  }

  const hasSidePanel = !!(props.monthsGrid || props.timeGrid);
  const hasBothPanels = !!(props.monthsGrid && props.timeGrid);

  if (hasSidePanel && containerWidth > 0 && containerWidth < 300)
    return "stacked";
  if (hasBothPanels && containerWidth >= 300 && containerWidth < 460)
    return "medium";
  return "wide";
};

export const getGridLayout = (
  p: GridLayoutProps,
  containerWidth = 0,
): CSSProperties => {
  const hasHeader = !!(
    p.years ||
    p.compactMonths ||
    p.compactYears ||
    p.months ||
    p.time
  );

  if (p.twoMonthsLayout) {
    const narrowThreshold = getTwoMonthsNarrowThreshold(p);
    const isNarrow =
      !!p.monthsColumn ||
      (containerWidth > 0 && containerWidth < narrowThreshold);

    if (isNarrow) {
      const areaRows = [
        hasHeader && '"HH"',
        p.monthsGrid && '"MM"',
        '"DD"',
        '"LB"',
        '"D2"',
        p.timeGrid && '"TT"',
        p.selectedDates && '"SD"',
        p.presets && '"PP"',
      ].filter(Boolean) as string[];

      return {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: areaRows.map(() => "auto").join(" "),
        gridTemplateAreas: areaRows.join(" "),
      };
    }

    const hasMonthPanel = !!p.monthsGrid;
    const hasTimePanel = !!p.timeGrid;

    if (!hasMonthPanel && !hasTimePanel) {
      const areas = [
        hasHeader && '"HH HH"',
        '"DD D2"',
        p.selectedDates && '"SD SD"',
        p.presets && '"PP PP"',
      ]
        .filter(Boolean)
        .join(" ");

      const rows = [
        hasHeader && "auto",
        "auto",
        p.selectedDates && "auto",
        p.presets && "auto",
      ]
        .filter(Boolean)
        .join(" ");

      return {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: rows,
        gridTemplateAreas: areas,
      };
    }

    const isCramped = hasMonthPanel && hasTimePanel;
    const colCount = (hasMonthPanel ? 1 : 0) + 2 + (hasTimePanel ? 1 : 0);

    const buildRow = (
      left: string,
      mid1: string,
      mid2: string,
      right: string,
    ) =>
      [hasMonthPanel && left, mid1, mid2, hasTimePanel && right]
        .filter(Boolean)
        .join(" ");

    const fullRow = (key: string) => Array(colCount).fill(key).join(" ");

    const areas = [
      hasHeader && `"${buildRow("MM", "HH", "HH", "TT")}"`,
      `"${buildRow("MM", "DD", "D2", "TT")}"`,
      p.selectedDates && `"${fullRow("SD")}"`,
      p.presets && `"${fullRow("PP")}"`,
    ]
      .filter(Boolean)
      .join(" ");

    const cols = [
      hasMonthPanel && (isCramped ? "1.6fr" : "1.8fr"),
      "2.5fr",
      "2.5fr",
      hasTimePanel && (isCramped ? "1.3fr" : "1.4fr"),
    ]
      .filter(Boolean)
      .join(" ");

    const rows = [
      hasHeader && "auto",
      "auto",
      p.selectedDates && "auto",
      p.presets && "auto",
    ]
      .filter(Boolean)
      .join(" ");

    return {
      display: "grid",
      gridTemplateColumns: cols,
      gridTemplateRows: rows,
      gridTemplateAreas: areas,
    };
  }

  const mode = getLayoutMode(containerWidth, p);

  if (mode === "stacked") {
    const areaRows = [
      hasHeader && '"HH"',
      p.monthsGrid && '"MM"',
      '"DD"',
      p.selectedDates && '"SD"',
      p.timeGrid && '"TT"',
      p.presets && '"PP"',
    ].filter(Boolean) as string[];

    return {
      display: "grid",
      gridTemplateColumns: "1fr",
      gridTemplateRows: areaRows.map(() => "auto").join(" "),
      gridTemplateAreas: areaRows.join(" "),
    };
  }

  if (mode === "medium") {
    const areaRows = [
      hasHeader && '"HH HH"',
      '"DD DD"',
      p.selectedDates && '"SD SD"',
      '"MM TT"',
      p.presets && '"PP PP"',
    ].filter(Boolean) as string[];

    return {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: areaRows.map(() => "auto").join(" "),
      gridTemplateAreas: areaRows.join(" "),
    };
  }

  const isCramped = !!(p.monthsGrid && p.timeGrid);
  const colCount = (p.monthsGrid ? 1 : 0) + 1 + (p.timeGrid ? 1 : 0);

  const cols = [
    p.monthsGrid && (isCramped ? "1.6fr" : "2fr"),
    "5fr",
    p.timeGrid && (isCramped ? "1.3fr" : "1.4fr"),
  ]
    .filter(Boolean)
    .join(" ");

  const mainRow = [p.monthsGrid && "MM", "DD", p.timeGrid && "TT"]
    .filter(Boolean)
    .join(" ");

  const fullWidth = (key: string) => `"${Array(colCount).fill(key).join(" ")}"`;

  const areas = [
    hasHeader && fullWidth("HH"),
    `"${mainRow}"`,
    p.selectedDates && fullWidth("SD"),
    p.presets && fullWidth("PP"),
  ]
    .filter(Boolean)
    .join(" ");

  const rows = [
    hasHeader && "auto",
    "auto",
    p.selectedDates && "auto",
    p.presets && "auto",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    display: "grid",
    gridTemplateColumns: cols,
    gridTemplateRows: rows,
    gridTemplateAreas: areas,
  };
};
