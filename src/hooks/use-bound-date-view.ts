import { useEffect, useState } from "react";

interface UseBoundDateViewParams {
  bound?: "from" | "to";
  range: boolean;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  viewDate: Date;
}

interface UseBoundDateViewResult {
  isBound: boolean;
  boundDate: Date | null;
  localView: Date;
  setLocalView: React.Dispatch<React.SetStateAction<Date>>;
  refDate: Date;
}

export function useBoundDateView({
  bound,
  range,
  rangeStart,
  rangeEnd,
  viewDate,
}: UseBoundDateViewParams): UseBoundDateViewResult {
  const isBound = !!(range && bound);
  const boundDate = isBound ? (bound === "from" ? rangeStart : rangeEnd) : null;

  const [localView, setLocalView] = useState<Date>(() => boundDate ?? viewDate);

  useEffect(() => {
    if (isBound && boundDate) setLocalView(boundDate);
  }, [isBound, boundDate?.getTime()]); // eslint-disable-line react-hooks/exhaustive-deps

  const refDate = isBound ? localView : viewDate;

  return { isBound, boundDate, localView, setLocalView, refDate };
}
