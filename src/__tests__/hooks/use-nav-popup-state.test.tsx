import { act, renderHook } from "@testing-library/react";
import { type ReactNode, useMemo, useState } from "react";
import { describe, expect, it } from "vitest";
import { type CalendarUI, UIContext } from "@/context/ui-context";
import { useNavPopupState } from "@/modules/nav/use-nav-popup-state";

const makeWrapper = () => {
  let ui!: CalendarUI;
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const [showTimePopup, setShowTimePopup] = useState(false);
    const [showMonthPopup, setShowMonthPopup] = useState(false);
    const [showYearPopup, setShowYearPopup] = useState(false);
    ui = useMemo(
      () =>
        ({
          containerRef: { current: null },
          toggleTheme: () => {},
          activeTheme: "light",
          containerWidth: 0,
          showTimePopup,
          setShowTimePopup,
          showMonthPopup,
          setShowMonthPopup,
          showYearPopup,
          setShowYearPopup,
          daysTrackActive: false,
          setDaysTrackActive: () => {},
          popupAnchorEl: null,
          setPopupAnchorEl: () => {},
          navShowSeconds: false,
          setNavShowSeconds: () => {},
        }) as CalendarUI,
      [showTimePopup, showMonthPopup, showYearPopup],
    );
    return <UIContext.Provider value={ui}>{children}</UIContext.Provider>;
  };
  return {
    Wrapper,
    getUI: () => ui,
  };
};

describe("useNavPopupState", () => {
  it("shared mode: returns UI context popup state and setters", () => {
    const { Wrapper, getUI } = makeWrapper();
    const { result } = renderHook(() => useNavPopupState(false), {
      wrapper: Wrapper,
    });

    expect(result.current.timePopupOpen).toBe(false);
    expect(result.current.monthPopupOpen).toBe(false);
    expect(result.current.yearPopupOpen).toBe(false);

    act(() => result.current.setTimePopupOpen(true));
    expect(getUI().showTimePopup).toBe(true);
    expect(result.current.timePopupOpen).toBe(true);

    act(() => result.current.setMonthPopupOpen(true));
    expect(getUI().showMonthPopup).toBe(true);

    act(() => result.current.setYearPopupOpen(true));
    expect(getUI().showYearPopup).toBe(true);
  });

  it("local mode: setters don't mutate shared UI state", () => {
    const { Wrapper, getUI } = makeWrapper();
    const { result } = renderHook(() => useNavPopupState(true), {
      wrapper: Wrapper,
    });

    act(() => result.current.setTimePopupOpen(true));
    expect(result.current.timePopupOpen).toBe(true);
    expect(getUI().showTimePopup).toBe(false);

    act(() => result.current.setMonthPopupOpen(true));
    expect(result.current.monthPopupOpen).toBe(true);
    expect(getUI().showMonthPopup).toBe(false);

    act(() => result.current.setYearPopupOpen(true));
    expect(result.current.yearPopupOpen).toBe(true);
    expect(getUI().showYearPopup).toBe(false);
  });

  it("local mode: closes own popups when shared popup opens elsewhere", () => {
    const { Wrapper, getUI } = makeWrapper();
    const { result } = renderHook(() => useNavPopupState(true), {
      wrapper: Wrapper,
    });

    act(() => {
      result.current.setTimePopupOpen(true);
      result.current.setMonthPopupOpen(true);
      result.current.setYearPopupOpen(true);
    });
    expect(result.current.timePopupOpen).toBe(true);
    expect(result.current.monthPopupOpen).toBe(true);
    expect(result.current.yearPopupOpen).toBe(true);

    act(() => getUI().setShowTimePopup(true));

    expect(result.current.timePopupOpen).toBe(false);
    expect(result.current.monthPopupOpen).toBe(false);
    expect(result.current.yearPopupOpen).toBe(false);
  });

  it("shared mode: reset effect does not clobber its own state", () => {
    const { Wrapper } = makeWrapper();
    const { result } = renderHook(() => useNavPopupState(false), {
      wrapper: Wrapper,
    });

    act(() => result.current.setTimePopupOpen(true));
    expect(result.current.timePopupOpen).toBe(true);
  });

  it("closeSharedPopups always clears UI context popups", () => {
    const { Wrapper, getUI } = makeWrapper();
    const { result } = renderHook(() => useNavPopupState(true), {
      wrapper: Wrapper,
    });

    act(() => {
      getUI().setShowTimePopup(true);
      getUI().setShowMonthPopup(true);
      getUI().setShowYearPopup(true);
    });

    act(() => result.current.closeSharedPopups());

    expect(getUI().showTimePopup).toBe(false);
    expect(getUI().showMonthPopup).toBe(false);
    expect(getUI().showYearPopup).toBe(false);
  });
});
