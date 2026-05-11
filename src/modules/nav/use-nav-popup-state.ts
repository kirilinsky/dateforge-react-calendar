import { useEffect, useState } from "react";
import { useUI } from "@/context/ui-context";

type SetBool = (v: boolean) => void;

interface NavPopupState {
  timePopupOpen: boolean;
  monthPopupOpen: boolean;
  yearPopupOpen: boolean;
  setTimePopupOpen: SetBool;
  setMonthPopupOpen: SetBool;
  setYearPopupOpen: SetBool;
  closeSharedPopups: () => void;
}

export const useNavPopupState = (useLocal: boolean): NavPopupState => {
  const {
    showTimePopup,
    showMonthPopup,
    showYearPopup,
    setShowTimePopup,
    setShowMonthPopup,
    setShowYearPopup,
  } = useUI();

  const [localTime, setLocalTime] = useState(false);
  const [localMonth, setLocalMonth] = useState(false);
  const [localYear, setLocalYear] = useState(false);

  useEffect(() => {
    if (!useLocal) return;
    if (!showTimePopup && !showMonthPopup && !showYearPopup) return;
    setLocalTime(false);
    setLocalMonth(false);
    setLocalYear(false);
  }, [useLocal, showTimePopup, showMonthPopup, showYearPopup]);

  const closeSharedPopups = () => {
    setShowTimePopup(false);
    setShowMonthPopup(false);
    setShowYearPopup(false);
  };

  return useLocal
    ? {
        timePopupOpen: localTime,
        monthPopupOpen: localMonth,
        yearPopupOpen: localYear,
        setTimePopupOpen: setLocalTime,
        setMonthPopupOpen: setLocalMonth,
        setYearPopupOpen: setLocalYear,
        closeSharedPopups,
      }
    : {
        timePopupOpen: showTimePopup,
        monthPopupOpen: showMonthPopup,
        yearPopupOpen: showYearPopup,
        setTimePopupOpen: setShowTimePopup,
        setMonthPopupOpen: setShowMonthPopup,
        setYearPopupOpen: setShowYearPopup,
        closeSharedPopups,
      };
};
