import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDays } from "@/modules/days";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarInfo } from "@/modules/info";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeWheel } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";
import { TestToolbar } from "../helpers/test-toolbar";

const D = (y: number, m: number, d: number) => new Date(y, m, d);

describe("action aria labels", () => {
  it("uses global Calendar labels across modules", () => {
    const { getAllByLabelText } = render(
      <Calendar
        mode="single"
        value={D(2024, 5, 15)}
        clearLabel="Очистить"
        homeLabel="Текущий месяц"
      >
        <TestToolbar home clear />
        <CalendarInfo showHome allowClear />
        <CalendarSelectedDates allowClear />
        <CalendarManualInput />
      </Calendar>,
    );

    expect(getAllByLabelText("Текущий месяц")).toHaveLength(2);
    expect(getAllByLabelText("Очистить")).toHaveLength(4);
  });

  it("lets module labels override global Calendar labels", () => {
    const { getByLabelText, queryByLabelText } = render(
      <Calendar
        mode="single"
        value={D(2024, 5, 15)}
        clearLabel="Global clear"
        homeLabel="Global home"
      >
        <TestToolbar
          home
          clear
          clearLabel="Toolbar clear"
          homeLabel="Toolbar home"
        />
        <CalendarInfo
          showHome
          allowClear
          clearLabel="Info clear"
          homeLabel="Info home"
        />
      </Calendar>,
    );

    expect(getByLabelText("Toolbar clear")).toBeTruthy();
    expect(getByLabelText("Toolbar home")).toBeTruthy();
    expect(getByLabelText("Info clear")).toBeTruthy();
    expect(getByLabelText("Info home")).toBeTruthy();
    expect(queryByLabelText("Global clear")).toBeNull();
    expect(queryByLabelText("Global home")).toBeNull();
  });

  it("uses global Calendar labels for module controls", () => {
    const { getAllByLabelText, getByLabelText } = render(
      <Calendar
        mode="multiple"
        value={[D(2024, 5, 15)]}
        defaultViewDate={D(2024, 5, 15)}
        calendarNavigationLabel="Main toolbar"
        changeMonthLabel="Open month {month}"
        changeTimeLabel="Open time {time}"
        changeYearLabel="Open year {year}"
        dayTrackLabel="Day rail"
        hoursLabel="Hour drum"
        minutesLabel="Minute drum"
        monthGridLabel="Month grid {year}"
        monthTrackLabel="Month rail"
        nextMonthLabel="Forward month"
        nextYearLabel="Forward year"
        nextYearsLabel="Forward years"
        previousMonthLabel="Back month"
        previousYearLabel="Back year"
        previousYearsLabel="Back years"
        removeSelectedDateLabel="Remove day"
        saveSelectedDateLabel="Save day"
        timePickerLabel="Time controls"
        weekLabel="Week row"
        yearGridLabel="Year grid {from}-{to}"
        yearPageNavigationLabel="Year pages"
        yearTrackLabel="Year rail"
      >
        <TestToolbar showTime showMonthPicker showYearPicker />
        <CalendarDays weekNumbers />
        <CalendarDaysTrack />
        <CalendarMonthsTrack />
        <CalendarYearsTrack />
        <CalendarTimeWheel />
        <CalendarMonthsGrid />
        <CalendarYearsGrid />
      </Calendar>,
    );

    expect(getByLabelText("Main toolbar")).toBeTruthy();
    expect(getByLabelText(/Open time/)).toBeTruthy();
    expect(getByLabelText(/Open month/)).toBeTruthy();
    expect(getByLabelText("Back month")).toBeTruthy();
    expect(getByLabelText("Forward month")).toBeTruthy();
    expect(getByLabelText(/Open year/)).toBeTruthy();
    expect(getByLabelText("Back year")).toBeTruthy();
    expect(getByLabelText("Forward year")).toBeTruthy();
    expect(getByLabelText("Day rail")).toBeTruthy();
    expect(getByLabelText("Remove day")).toBeTruthy();
    expect(getByLabelText("Month rail")).toBeTruthy();
    expect(getByLabelText("Year rail")).toBeTruthy();
    expect(getByLabelText("Time controls")).toBeTruthy();
    expect(getAllByLabelText(/Week row \d+/).length).toBeGreaterThan(0);
    expect(getByLabelText("Hour drum")).toBeTruthy();
    expect(getByLabelText("Minute drum")).toBeTruthy();
    expect(getByLabelText("Month grid 2024")).toBeTruthy();
    expect(getByLabelText(/Year grid \d+-\d+/)).toBeTruthy();
    expect(getByLabelText("Year pages")).toBeTruthy();
    expect(getByLabelText("Back years")).toBeTruthy();
    expect(getByLabelText("Forward years")).toBeTruthy();
  });
});
