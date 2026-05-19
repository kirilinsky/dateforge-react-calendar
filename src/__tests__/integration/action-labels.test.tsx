import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarDaysTrack } from "@/modules/days-track";
import { CalendarInfo } from "@/modules/info";
import { CalendarManualInput } from "@/modules/manual-input";
import { CalendarMonthsGrid } from "@/modules/months-grid";
import { CalendarMonthsTrack } from "@/modules/months-track";
import { CalendarNav } from "@/modules/nav";
import { CalendarSelectedDates } from "@/modules/selected-dates";
import { CalendarTimeGrid } from "@/modules/time";
import { CalendarYearsGrid } from "@/modules/years-grid";
import { CalendarYearsTrack } from "@/modules/years-track";

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
        <CalendarNav home clear />
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
        <CalendarNav home clear clearLabel="Nav clear" homeLabel="Nav home" />
        <CalendarInfo
          showHome
          allowClear
          clearLabel="Info clear"
          homeLabel="Info home"
        />
      </Calendar>,
    );

    expect(getByLabelText("Nav clear")).toBeTruthy();
    expect(getByLabelText("Nav home")).toBeTruthy();
    expect(getByLabelText("Info clear")).toBeTruthy();
    expect(getByLabelText("Info home")).toBeTruthy();
    expect(queryByLabelText("Global clear")).toBeNull();
    expect(queryByLabelText("Global home")).toBeNull();
  });

  it("uses global Calendar labels for module controls", () => {
    const { getByLabelText } = render(
      <Calendar
        mode="multiple"
        value={[D(2024, 5, 15)]}
        defaultViewDate={D(2024, 5, 15)}
        calendarNavigationLabel="Main nav"
        changeMonthLabel="Open month {month}"
        changeTimeLabel="Open time {time}"
        changeYearLabel="Open year {year}"
        dayTrackLabel="Day rail"
        hoursLabel="Hour drum"
        minutesLabel="Minute drum"
        monthGridLabel="Month grid {year}"
        monthPickerLabel="Month controls"
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
        yearGridLabel="Year grid {from}-{to}"
        yearPageNavigationLabel="Year pages"
        yearPickerLabel="Year controls"
        yearTrackLabel="Year rail"
      >
        <CalendarNav showTime showMonthPicker showYearPicker />
        <CalendarDaysTrack />
        <CalendarMonthsTrack />
        <CalendarYearsTrack />
        <CalendarTimeGrid />
        <CalendarMonthsGrid />
        <CalendarYearsGrid />
      </Calendar>,
    );

    expect(getByLabelText("Main nav")).toBeTruthy();
    expect(getByLabelText(/Open time/)).toBeTruthy();
    expect(getByLabelText("Month controls")).toBeTruthy();
    expect(getByLabelText(/Open month/)).toBeTruthy();
    expect(getByLabelText("Back month")).toBeTruthy();
    expect(getByLabelText("Forward month")).toBeTruthy();
    expect(getByLabelText("Year controls")).toBeTruthy();
    expect(getByLabelText(/Open year/)).toBeTruthy();
    expect(getByLabelText("Back year")).toBeTruthy();
    expect(getByLabelText("Forward year")).toBeTruthy();
    expect(getByLabelText("Day rail")).toBeTruthy();
    expect(getByLabelText("Remove day")).toBeTruthy();
    expect(getByLabelText("Month rail")).toBeTruthy();
    expect(getByLabelText("Year rail")).toBeTruthy();
    expect(getByLabelText("Time controls")).toBeTruthy();
    expect(getByLabelText("Hour drum")).toBeTruthy();
    expect(getByLabelText("Minute drum")).toBeTruthy();
    expect(getByLabelText("Month grid 2024")).toBeTruthy();
    expect(getByLabelText(/Year grid \d+-\d+/)).toBeTruthy();
    expect(getByLabelText("Year pages")).toBeTruthy();
    expect(getByLabelText("Back years")).toBeTruthy();
    expect(getByLabelText("Forward years")).toBeTruthy();
  });
});
